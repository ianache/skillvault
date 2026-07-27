import matter from "gray-matter";
import { validateBodySections, validateSkillFrontmatter } from "@/lib/skill-schema";
import { assertCanEditRequest, canReview, hasRole } from "./auth";
import { validateReviewFilePath } from "./files";
import type {
  AddReviewCommentInput,
  CreateReviewRequestInput,
  DecideReviewRequestInput,
  ListReviewRequestsQuery,
  ReviewActor,
  ReviewComment,
  ReviewDatabaseClient,
  ReviewFile,
  ReviewFileInput,
  ReviewRequest,
  ReviewRequestDetailDto,
  ReviewRequestSummary,
  ReviewStatus,
  ReviewStatusCounts,
  UpdateReviewRequestInput,
} from "./types";

const MAX_SKILL_LINES = 300;
const DEFAULT_RELAXED_DESCRIPTION = "Skill enviado a revision sin descripcion validada.";

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

function asNullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : asNumber(value);
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function toRequest(row: Record<string, unknown>): ReviewRequest {
  return {
    id: asNumber(row.id),
    skillId: asNullableNumber(row.skill_id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description),
    type: String(row.type),
    version: String(row.version),
    schemaVersion: String(row.schema_version),
    authorId: String(row.author_id),
    authorHandle: asNullableString(row.author_handle),
    rawContent: String(row.raw_content),
    status: row.status as ReviewStatus,
    reviewerId: asNullableString(row.reviewer_id),
    reviewerHandle: asNullableString(row.reviewer_handle),
    generalComment: asNullableString(row.general_comment),
    submittedAt: asNumber(row.submitted_at),
    reviewedAt: asNullableNumber(row.reviewed_at),
    updatedAt: asNumber(row.updated_at),
  };
}

function toFile(row: Record<string, unknown>): ReviewFile {
  return {
    id: asNumber(row.id),
    reviewRequestId: asNumber(row.review_request_id),
    path: String(row.path),
    fileType: row.file_type as ReviewFile["fileType"],
    content: String(row.content),
    changeType: row.change_type as ReviewFile["changeType"],
    createdAt: asNumber(row.created_at),
  };
}

function toComment(row: Record<string, unknown>): ReviewComment {
  return {
    id: asNumber(row.id),
    reviewRequestId: asNumber(row.review_request_id),
    filePath: asNullableString(row.file_path),
    authorId: String(row.author_id),
    authorHandle: asNullableString(row.author_handle),
    body: String(row.body),
    createdAt: asNumber(row.created_at),
  };
}

function countLines(value: string): number {
  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return normalized.endsWith("\n") ? normalized.slice(0, -1).split("\n").length : normalized.split("\n").length;
}

function slugifyDraftName(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug || "draft-skill";
}

function firstHeading(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function semverOrDefault(value: unknown): string {
  return typeof value === "string" && /^\d+\.\d+\.\d+$/.test(value) ? value : "1.0.0";
}

function compareSemver(a: string, b: string): number {
  const [aMaj, aMin, aPatch] = a.split(".").map(Number);
  const [bMaj, bMin, bPatch] = b.split(".").map(Number);
  if (aMaj !== bMaj) return aMaj - bMaj;
  if (aMin !== bMin) return aMin - bMin;
  return aPatch - bPatch;
}

async function assertVersionIsGreaterThanPublished(
  skillId: number,
  version: string,
  client: ReviewDatabaseClient
): Promise<void> {
  const currentSkill = await client.execute({
    sql: "SELECT version FROM skills WHERE id = ?",
    args: [skillId],
  });
  if (currentSkill.rows.length === 0) return;
  const currentVersion = String(currentSkill.rows[0].version);
  if (compareSemver(version, currentVersion) <= 0) {
    throw new Error(`Version invalida: ${version} debe ser mayor a la version publicada actual (${currentVersion})`);
  }
}

function normalizeReviewFiles(files: ReviewFileInput[] = []) {
  const paths = new Set<string>();
  return files.map((file) => {
    const path = validateReviewFilePath(file.path);
    if (paths.has(path)) throw new Error("Review file paths must be unique");
    paths.add(path);
    return { ...file, path, content: file.content ?? "", changeType: file.changeType ?? "added" };
  });
}

function validateSubmission(rawContent: string, files: ReviewFileInput[] = []) {
  if (!rawContent.trim()) throw new Error("SKILL.md content is required");

  const parsed = matter(rawContent);
  const frontmatter = validateSkillFrontmatter(parsed.data);
  const body = validateBodySections(parsed.content);
  const errors = [...frontmatter.errors, ...body.errors];
  if (!frontmatter.valid || errors.length > 0) {
    throw new Error(errors.map((error) => error.message).join("; "));
  }

  const normalizedFiles = normalizeReviewFiles(files);

  return { frontmatter: frontmatter.parsed!, files: normalizedFiles };
}

function parseRelaxedMatter(rawContent: string): { data: Record<string, unknown>; content: string } {
  try {
    const parsed = matter(rawContent);
    return { data: parsed.data as Record<string, unknown>, content: parsed.content };
  } catch {
    return { data: {}, content: rawContent };
  }
}

function relaxedSubmission(rawContent: string, files: ReviewFileInput[] = []) {
  if (!rawContent.trim()) throw new Error("SKILL.md content is required");
  if (countLines(rawContent) > MAX_SKILL_LINES) throw new Error("Maximo 300 lineas");

  const parsed = parseRelaxedMatter(rawContent);
  const data = parsed.data;
  const metadata = typeof data.metadata === "object" && data.metadata !== null
    ? data.metadata as Record<string, unknown>
    : {};

  const validName = typeof data.name === "string" && /^[a-z0-9-]{3,64}$/.test(data.name)
    ? data.name
    : null;
  const name = validName ?? slugifyDraftName(firstHeading(parsed.content) ?? "");
  const description = typeof data.description === "string"
    && data.description.length >= 20
    && data.description.length <= 280
    ? data.description
    : DEFAULT_RELAXED_DESCRIPTION;
  const triggers = stringArray(metadata.triggers);

  return {
    frontmatter: {
      name,
      description,
      version: semverOrDefault(data.version),
      schema_version: typeof data.schema_version === "string" && data.schema_version.trim().length > 0
        ? data.schema_version
        : "1.1",
      author: typeof data.author === "string" ? data.author : undefined,
      metadata: {
        type: typeof metadata.type === "string" && metadata.type.trim().length > 0 ? metadata.type : "code",
        triggers: triggers.length > 0 ? triggers : [name],
        tools: stringArray(metadata.tools),
        subagent_type: typeof metadata.subagent_type === "string" ? metadata.subagent_type : undefined,
      },
      compatibility: stringArray(data.compatibility).length > 0 ? stringArray(data.compatibility) : ["claude"],
      dependencies: stringArray(data.dependencies),
      resources: stringArray(data.resources),
      scripts: stringArray(data.scripts),
      config_requirements: Array.isArray(data.config_requirements) ? data.config_requirements : [],
    },
    files: normalizeReviewFiles(files),
  };
}

function assertValidDecision(input: DecideReviewRequestInput): void {
  if (!["approve", "reject", "request_changes"].includes(input.decision)) {
    throw new Error("Invalid review decision");
  }
}

async function getRequestRow(id: number, client: ReviewDatabaseClient): Promise<ReviewRequest> {
  const result = await client.execute({
    sql: "SELECT * FROM skill_review_requests WHERE id = ?",
    args: [id],
  });
  if (result.rows.length === 0) throw new Error("Review request not found");
  return toRequest(result.rows[0]);
}

async function replaceFiles(id: number, files: ReturnType<typeof validateSubmission>["files"], client: ReviewDatabaseClient) {
  await client.execute({ sql: "DELETE FROM skill_review_files WHERE review_request_id = ?", args: [id] });
  for (const file of files) {
    await client.execute({
      sql: `INSERT INTO skill_review_files
        (review_request_id, path, file_type, content, change_type)
        VALUES (?, ?, ?, ?, ?)`,
      args: [id, file.path, file.fileType, file.content, file.changeType],
    });
  }
}

async function activateApprovedRequest(
  request: ReviewRequest,
  actor: ReviewActor,
  comment: string | null,
  client: ReviewDatabaseClient
): Promise<void> {
  const { frontmatter } = relaxedSubmission(request.rawContent);
  const reviewFiles = await client.execute({
    sql: "SELECT * FROM skill_review_files WHERE review_request_id = ? ORDER BY id",
    args: [request.id],
  });
  const publishedAt = Math.floor(Date.now() / 1000);

  let skillId = request.skillId;
  if (skillId === null) {
    await client.execute({
        sql: `INSERT INTO skills
          (slug, name, description, type, author_id, author_handle, version, schema_version,
           triggers, tools, compatibility, dependencies, config_requirements, raw_content, status, created_at, updated_at, published_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?)`,
        args: [
          request.slug,
          request.name,
          request.description,
          request.type,
          request.authorId,
          request.authorHandle,
          request.version,
          request.schemaVersion,
          JSON.stringify(frontmatter.metadata.triggers),
          JSON.stringify(frontmatter.metadata.tools),
          JSON.stringify(frontmatter.compatibility),
          JSON.stringify(frontmatter.dependencies),
          JSON.stringify(frontmatter.config_requirements),
          request.rawContent,
          publishedAt,
          publishedAt,
          publishedAt,
        ],
    });
    const inserted = await client.execute({
        sql: "SELECT id FROM skills WHERE slug = ? AND status = 'published' LIMIT 1",
        args: [request.slug],
    });
    if (inserted.rows.length === 0) throw new Error("activation failed: published skill was not created");
    skillId = asNumber(inserted.rows[0].id);
  } else {
    await client.execute({
        sql: `UPDATE skills
          SET slug = ?, name = ?, description = ?, type = ?, author_id = ?, author_handle = ?,
              version = ?, schema_version = ?, triggers = ?, tools = ?, compatibility = ?,
              dependencies = ?, config_requirements = ?, raw_content = ?, status = 'published', published_at = ?, updated_at = ?
          WHERE id = ? AND status = 'published'`,
        args: [
          request.slug,
          request.name,
          request.description,
          request.type,
          request.authorId,
          request.authorHandle,
          request.version,
          request.schemaVersion,
          JSON.stringify(frontmatter.metadata.triggers),
          JSON.stringify(frontmatter.metadata.tools),
          JSON.stringify(frontmatter.compatibility),
          JSON.stringify(frontmatter.dependencies),
          JSON.stringify(frontmatter.config_requirements),
          request.rawContent,
          publishedAt,
          publishedAt,
          skillId,
        ],
    });
  }

  await client.execute({ sql: "DELETE FROM skill_files WHERE skill_id = ?", args: [skillId] });
  for (const file of reviewFiles.rows.map(toFile)) {
    if (file.changeType === "deleted") continue;
    await client.execute({
        sql: "INSERT INTO skill_files (skill_id, path, file_type, content) VALUES (?, ?, ?, ?)",
        args: [skillId, file.path, file.fileType, file.content],
    });
  }
  await client.execute({
      sql: "INSERT INTO skill_versions (skill_id, version, raw_content, created_at) VALUES (?, ?, ?, ?)",
      args: [skillId, request.version, request.rawContent, publishedAt],
  });
  await client.execute({
      sql: `UPDATE skill_review_requests
        SET status = ?, reviewer_id = ?, reviewer_handle = ?, general_comment = ?,
            reviewed_at = ?, updated_at = ?
        WHERE id = ?`,
      args: ["approved", actor.id, actor.handle ?? null, comment, publishedAt, publishedAt, request.id],
  });
}

export async function createReviewRequest(
  input: CreateReviewRequestInput,
  actor: ReviewActor,
  client: ReviewDatabaseClient
): Promise<ReviewRequest> {
  if (input.acceptedResponsibility !== true) throw new Error("Debes aceptar continuar con la publicacion");
  const { frontmatter, files } = relaxedSubmission(input.rawContent, input.files);

  if (!input.skillId) {
    const existingSkill = await client.execute({
      sql: "SELECT id FROM skills WHERE slug = ?",
      args: [frontmatter.name],
    });
    if (existingSkill.rows.length > 0) {
      throw new Error("A skill with this slug already exists — submit a new version instead");
    }
  } else {
    await assertVersionIsGreaterThanPublished(input.skillId, frontmatter.version, client);
  }

  const duplicate = await client.execute({
    sql: `SELECT id FROM skill_review_requests
      WHERE slug = ? AND version = ? AND status IN ('pending', 'changes_requested')`,
    args: [frontmatter.name, frontmatter.version],
  });
  if (duplicate.rows.length > 0) throw new Error("An open review request already exists");

  await client.execute({
    sql: `INSERT INTO skill_review_requests
      (skill_id, slug, name, description, type, version, schema_version, author_id, author_handle, raw_content, status, submitted_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    args: [
      input.skillId ?? null,
      frontmatter.name,
      frontmatter.name,
      frontmatter.description,
      frontmatter.metadata.type,
      frontmatter.version,
      frontmatter.schema_version,
      actor.id,
      actor.handle ?? null,
      input.rawContent,
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000),
    ],
  });

  const created = await client.execute({
    sql: `SELECT * FROM skill_review_requests
      WHERE author_id = ? AND slug = ? AND version = ?
      ORDER BY id DESC LIMIT 1`,
    args: [actor.id, frontmatter.name, frontmatter.version],
  });
  if (created.rows.length === 0) throw new Error("Review request was not created");

  const request = toRequest(created.rows[0]);
  await replaceFiles(request.id, files, client);
  return request;
}

export async function updateReviewRequest(
  id: number,
  input: UpdateReviewRequestInput,
  actor: ReviewActor,
  client: ReviewDatabaseClient
): Promise<ReviewRequest> {
  const request = await getRequestRow(id, client);
  assertCanEditRequest(actor, request);
  const { frontmatter, files } = relaxedSubmission(input.rawContent, input.files);
  if (request.skillId) {
    await assertVersionIsGreaterThanPublished(request.skillId, frontmatter.version, client);
  }

  await client.execute({
    sql: `UPDATE skill_review_requests
      SET slug = ?, name = ?, description = ?, type = ?, version = ?, schema_version = ?, raw_content = ?,
          status = 'pending', reviewer_id = NULL, reviewer_handle = NULL, general_comment = NULL,
          reviewed_at = NULL, updated_at = ?
      WHERE id = ?`,
    args: [
      frontmatter.name,
      frontmatter.name,
      frontmatter.description,
      frontmatter.metadata.type,
      frontmatter.version,
      frontmatter.schema_version,
      input.rawContent,
      Math.floor(Date.now() / 1000),
      id,
    ],
  });
  await replaceFiles(id, files, client);
  return getRequestRow(id, client);
}

export async function getReviewStatusCounts(
  actor: ReviewActor,
  options: { mine?: boolean } = {},
  client: ReviewDatabaseClient
): Promise<ReviewStatusCounts> {
  const isMine = options.mine ?? !canReview(actor);
  const whereClause = isMine ? "WHERE author_id = ?" : "";
  const args = isMine ? [actor.id] : [];

  const result = await client.execute({
    sql: `SELECT status, COUNT(*) as count FROM skill_review_requests ${whereClause} GROUP BY status`,
    args,
  });

  const counts: ReviewStatusCounts = {
    all: 0,
    pending: 0,
    changes_requested: 0,
    approved: 0,
    rejected: 0,
  };

  for (const row of result.rows) {
    const status = String(row.status) as ReviewStatus;
    const count = Number(row.count ?? 0);
    if (status in counts) {
      counts[status] = count;
      counts.all += count;
    }
  }

  return counts;
}

export async function listReviewRequests(
  query: ListReviewRequestsQuery,
  actor: ReviewActor,
  client: ReviewDatabaseClient
): Promise<ReviewRequestSummary[]> {
  const clauses: string[] = [];
  const args: unknown[] = [];
  if (query.mine || !canReview(actor)) {
    clauses.push("author_id = ?");
    args.push(actor.id);
  }
  if (query.status && query.status !== "all") {
    clauses.push("status = ?");
    args.push(query.status);
  }
  const where = clauses.length > 0 ? ` WHERE ${clauses.join(" AND ")}` : "";
  const result = await client.execute({
    sql: `SELECT * FROM skill_review_requests${where} ORDER BY updated_at DESC, id DESC`,
    args,
  });
  return result.rows.map(toRequest).map((request) => {
    const { rawContent, ...summary } = request;
    void rawContent;
    return summary;
  });
}

export async function getReviewRequest(
  id: number,
  actor: ReviewActor,
  client: ReviewDatabaseClient
): Promise<ReviewRequestDetailDto> {
  const request = await getRequestRow(id, client);
  if (request.authorId !== actor.id && !canReview(actor) && !hasRole(actor, "admin")) {
    throw new Error("Not allowed to view this request");
  }
  const [files, comments] = await Promise.all([
    client.execute({ sql: "SELECT * FROM skill_review_files WHERE review_request_id = ? ORDER BY id", args: [id] }),
    client.execute({ sql: "SELECT * FROM skill_review_comments WHERE review_request_id = ? ORDER BY id", args: [id] }),
  ]);
  return { ...request, files: files.rows.map(toFile), comments: comments.rows.map(toComment) };
}

export async function addReviewComment(
  id: number,
  input: AddReviewCommentInput,
  actor: ReviewActor,
  client: ReviewDatabaseClient
): Promise<ReviewComment> {
  const request = await getReviewRequest(id, actor, client);
  const body = input.body.trim();
  if (!body) throw new Error("Comment is required");
  const filePath = input.filePath === null || input.filePath === undefined
    ? null
    : validateReviewFilePath(input.filePath);
  if (filePath && filePath !== "SKILL.md" && !request.files.some((file) => file.path === filePath)) {
    throw new Error("Comment file path must match an attached file");
  }
  await client.execute({
    sql: `INSERT INTO skill_review_comments
      (review_request_id, file_path, author_id, author_handle, body, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, filePath, actor.id, actor.handle ?? null, body, Math.floor(Date.now() / 1000)],
  });
  const result = await client.execute({
    sql: "SELECT * FROM skill_review_comments WHERE review_request_id = ? ORDER BY id DESC LIMIT 1",
    args: [id],
  });
  if (result.rows.length === 0) throw new Error("Comment was not created");
  return toComment(result.rows[0]);
}

export async function decideReviewRequest(
  id: number,
  input: DecideReviewRequestInput,
  actor: ReviewActor,
  client: ReviewDatabaseClient
): Promise<ReviewRequest> {
  assertValidDecision(input);
  const request = await getRequestRow(id, client);
  if (request.authorId === actor.id) throw new Error("Author cannot approve own request");
  if (!canReview(actor)) throw new Error("Reviewer role is required");
  if (request.status !== "pending" && request.status !== "changes_requested") {
    throw new Error("Review request is not active");
  }
  if ((input.decision === "reject" || input.decision === "request_changes") && !input.comment?.trim()) {
    throw new Error("A general comment required for this decision");
  }

  const status: ReviewStatus = input.decision === "approve"
    ? "approved"
    : input.decision === "reject"
      ? "rejected"
      : "changes_requested";
  if (input.decision === "approve") {
    if (!client.transaction) throw new Error("Database transactions are required for approval");
    await client.transaction((transactionClient) =>
      activateApprovedRequest(request, actor, input.comment?.trim() ?? null, transactionClient)
    );
  } else {
    const decidedAt = Math.floor(Date.now() / 1000);
    await client.execute({
      sql: `UPDATE skill_review_requests
        SET status = ?, reviewer_id = ?, reviewer_handle = ?, general_comment = ?,
            reviewed_at = ?, updated_at = ?
        WHERE id = ?`,
      args: [status, actor.id, actor.handle ?? null, input.comment?.trim() ?? null, decidedAt, decidedAt, id],
    });
  }
  return { ...request, status, reviewerId: actor.id, reviewerHandle: actor.handle ?? null, generalComment: input.comment?.trim() ?? null };
}

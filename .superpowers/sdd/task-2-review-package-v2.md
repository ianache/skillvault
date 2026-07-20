# Task 2 Review Package v2

## Commits
28f4376 fix: enforce review edit and comment boundaries
d856c2f feat: add review workflow service

## Stat
 .superpowers/sdd/task-2-report.md |  46 ++++++
 package.json                      |   3 +-
 src/lib/review/auth.ts            |  21 +++
 src/lib/review/files.test.ts      |  17 +++
 src/lib/review/files.ts           |  11 ++
 src/lib/review/service.test.ts    | 156 ++++++++++++++++++++
 src/lib/review/service.ts         | 297 ++++++++++++++++++++++++++++++++++++++
 src/lib/review/types.ts           |  97 +++++++++++++
 8 files changed, 647 insertions(+), 1 deletion(-)

## Diff
diff --git a/.superpowers/sdd/task-2-report.md b/.superpowers/sdd/task-2-report.md
new file mode 100644
index 0000000..7864395
--- /dev/null
+++ b/.superpowers/sdd/task-2-report.md
@@ -0,0 +1,46 @@
+# Task 2 Report
+
+Status: DONE_WITH_CONCERNS
+
+Files changed:
+
+- `src/lib/review/types.ts`
+- `src/lib/review/auth.ts`
+- `src/lib/review/files.ts`
+- `src/lib/review/service.ts`
+- `src/lib/review/files.test.ts`
+- `src/lib/review/service.test.ts`
+- `package.json`
+
+Commit:
+
+- `d856c2f feat: add review workflow service`
+
+Tests and checks:
+
+- `node --test src/lib/review/files.test.ts`: failed as expected before implementation; Node 22 does not resolve extensionless TypeScript imports after implementation.
+- `node --test src/lib/review/service.test.ts`: failed as expected before implementation; same Node 22 resolver limitation applies after implementation.
+- `pnpm --config.package-manager-strict=false run test:review`: passed, 6 tests.
+- `pnpm --config.package-manager-strict=false exec tsc --noEmit`: passed.
+- `git diff --check` and `git diff --cached --check`: passed.
+
+Self-review:
+
+- Review requests validate `SKILL.md` frontmatter/body, ensure attached-file paths are relative and traversal-free, and reject duplicate attachment paths.
+- Edit permissions enforce author ownership for editable states; reviewer decisions reject self-approval and require comments for rejection/change requests.
+- Approval activation is intentionally deferred to Task 6 as defined by the approved plan.
+
+Concern:
+
+- The brief's direct `node --test` commands cannot run these extensionless TypeScript imports under Node 22. Added `test:review` using the existing `tsx` dependency; it passes all review-domain tests.
+
+## Review Fixes
+
+- Removed the admin bypass from `assertCanEditRequest`; only the request author can edit an editable proposal.
+- Per-file comments now accept only `SKILL.md` or a path matching an attached file on the request. General comments continue to use `null` or `undefined`.
+- Added focused tests covering admin edit denial, orphaned comment-path denial, `SKILL.md`/attached-file comment acceptance, and approved status recording without activation. Skill activation remains intentionally deferred to Task 6.
+
+Verification:
+
+- `pnpm --config.package-manager-strict=false run test:review`: passed, 10 tests.
+- `pnpm --config.package-manager-strict=false exec tsc --noEmit`: passed.
diff --git a/package.json b/package.json
index 72041b4..41888db 100644
--- a/package.json
+++ b/package.json
@@ -5,21 +5,22 @@
     "packageManager": "pnpm@9.15.9",
     "scripts": {
         "dev": "next dev",
         "build": "next build",
         "start": "next start",
         "lint": "eslint",
         "migrate:requirements": "tsx src/lib/db/migrate-requirements.ts",
         "migrate:timestamps": "tsx src/lib/db/migrate-timestamps.ts",
         "migrate:mysql": "tsx src/lib/db/migrate-mysql-init.ts",
         "migrate:review-workflow": "tsx src/lib/db/migrate-review-workflow.ts",
-        "migrate:review-workflow:mysql": "tsx src/lib/db/migrate-review-workflow-mysql.ts"
+        "migrate:review-workflow:mysql": "tsx src/lib/db/migrate-review-workflow-mysql.ts",
+        "test:review": "tsx --test src/lib/review/*.test.ts"
     },
     "dependencies": {
         "@codemirror/commands": "^6.10.4",
         "@codemirror/lang-markdown": "^6.5.1",
         "@codemirror/language": "^6.12.4",
         "@codemirror/state": "^6.7.1",
         "@codemirror/theme-one-dark": "^6.1.3",
         "@codemirror/view": "^6.43.6",
         "@libsql/client": "^0.17.4",
         "@types/jszip": "^3.4.1",
diff --git a/src/lib/review/auth.ts b/src/lib/review/auth.ts
new file mode 100644
index 0000000..402a571
--- /dev/null
+++ b/src/lib/review/auth.ts
@@ -0,0 +1,21 @@
+import type { ReviewActor, ReviewStatus } from "./types";
+
+export function hasRole(actor: ReviewActor, role: string): boolean {
+  return actor.roles.includes(role);
+}
+
+export function canReview(actor: ReviewActor): boolean {
+  return hasRole(actor, "reviewer") || hasRole(actor, "admin");
+}
+
+export function assertCanEditRequest(
+  actor: ReviewActor,
+  request: { authorId: string; status: ReviewStatus }
+) {
+  if (request.status !== "pending" && request.status !== "changes_requested") {
+    throw new Error("Request is not editable");
+  }
+  if (request.authorId !== actor.id) {
+    throw new Error("Only the author can edit this request");
+  }
+}
diff --git a/src/lib/review/files.test.ts b/src/lib/review/files.test.ts
new file mode 100644
index 0000000..1221519
--- /dev/null
+++ b/src/lib/review/files.test.ts
@@ -0,0 +1,17 @@
+import test from "node:test";
+import assert from "node:assert/strict";
+import { validateReviewFilePath } from "./files";
+
+test("rejects absolute paths", () => {
+  assert.throws(() => validateReviewFilePath("C:\\\\temp\\\\x.md"), /relative/);
+  assert.throws(() => validateReviewFilePath("/tmp/x.md"), /relative/);
+});
+
+test("rejects traversal paths", () => {
+  assert.throws(() => validateReviewFilePath("../secret.md"), /traversal/);
+  assert.throws(() => validateReviewFilePath("docs/../../secret.md"), /traversal/);
+});
+
+test("accepts nested relative paths", () => {
+  assert.equal(validateReviewFilePath("resources/reference.md"), "resources/reference.md");
+});
diff --git a/src/lib/review/files.ts b/src/lib/review/files.ts
new file mode 100644
index 0000000..a38eb9b
--- /dev/null
+++ b/src/lib/review/files.ts
@@ -0,0 +1,11 @@
+export function validateReviewFilePath(path: string): string {
+  const normalized = path.replace(/\\/g, "/").trim();
+  if (!normalized) throw new Error("File path is required");
+  if (normalized.startsWith("/") || /^[a-zA-Z]:\//.test(normalized)) {
+    throw new Error("File path must be relative");
+  }
+  if (normalized.split("/").includes("..")) {
+    throw new Error("File path must not contain traversal");
+  }
+  return normalized;
+}
diff --git a/src/lib/review/service.test.ts b/src/lib/review/service.test.ts
new file mode 100644
index 0000000..aba4170
--- /dev/null
+++ b/src/lib/review/service.test.ts
@@ -0,0 +1,156 @@
+import test from "node:test";
+import assert from "node:assert/strict";
+import {
+  addReviewComment,
+  createReviewRequest,
+  decideReviewRequest,
+  updateReviewRequest,
+} from "./service";
+import type { ReviewActor, ReviewDatabaseClient } from "./types";
+
+const validRawContent = `---
+name: demo-skill
+description: A complete enough description for the demo review skill.
+version: 1.0.0
+schema_version: "1.1"
+metadata:
+  type: code
+  triggers:
+    - demo
+compatibility:
+  - claude
+---
+# Demo Skill
+
+## Descripcion
+
+Demo description.
+
+## Cuando usar
+
+Use this demo.
+
+## Instrucciones
+
+Follow these instructions.`;
+
+const authorActor: ReviewActor = { id: "author-1", handle: "author", roles: ["author"] };
+const reviewerActor: ReviewActor = { id: "reviewer-1", handle: "reviewer", roles: ["reviewer"] };
+const adminActor: ReviewActor = { id: "admin-1", handle: "admin", roles: ["admin"] };
+
+function createFakeClient(files: Array<Record<string, unknown>> = []): ReviewDatabaseClient {
+  const comments: Array<Record<string, unknown>> = [];
+  const request = {
+    id: 1,
+    skill_id: null,
+    slug: "demo-skill",
+    name: "demo-skill",
+    description: "A complete enough description for the demo review skill.",
+    type: "code",
+    version: "1.0.0",
+    schema_version: "1.1",
+    author_id: "author-1",
+    author_handle: "author",
+    raw_content: validRawContent,
+    status: "pending",
+    reviewer_id: null,
+    reviewer_handle: null,
+    general_comment: null,
+    submitted_at: 1,
+    reviewed_at: null,
+    updated_at: 1,
+  };
+
+  return {
+    async execute(input) {
+      const sql = typeof input === "string" ? input : input.sql;
+      const args = typeof input === "string" ? [] : input.args ?? [];
+      if (sql.includes("SELECT * FROM skill_review_requests WHERE id = ?")) {
+        return { rows: [request] };
+      }
+      if (sql.includes("SELECT * FROM skill_review_requests") && sql.includes("ORDER BY id DESC")) {
+        return { rows: [request] };
+      }
+      if (sql.includes("SELECT * FROM skill_review_files WHERE review_request_id = ?")) {
+        return { rows: files };
+      }
+      if (sql.includes("INSERT INTO skill_review_comments")) {
+        comments.unshift({
+          id: comments.length + 1,
+          review_request_id: args[0],
+          file_path: args[1],
+          author_id: args[2],
+          author_handle: args[3],
+          body: args[4],
+          created_at: 1,
+        });
+        return { rows: [] };
+      }
+      if (sql.includes("SELECT * FROM skill_review_comments WHERE review_request_id = ? ORDER BY id DESC LIMIT 1")) {
+        return { rows: comments.slice(0, 1) };
+      }
+      if (sql.includes("SELECT * FROM skill_review_comments WHERE review_request_id = ?")) {
+        return { rows: comments };
+      }
+      return { rows: [] };
+    },
+  };
+}
+
+test("author creates pending request for a new skill", async () => {
+  const request = await createReviewRequest({ rawContent: validRawContent, files: [] }, authorActor, createFakeClient());
+  assert.equal(request.status, "pending");
+  assert.equal(request.slug, "demo-skill");
+});
+
+test("author cannot approve own request", async () => {
+  await assert.rejects(
+    () => decideReviewRequest(1, { decision: "approve" }, authorActor, createFakeClient()),
+    /cannot approve own request/
+  );
+});
+
+test("request_changes requires comment", async () => {
+  await assert.rejects(
+    () => decideReviewRequest(1, { decision: "request_changes" }, reviewerActor, createFakeClient()),
+    /comment required/
+  );
+});
+
+test("admin cannot edit another author's request", async () => {
+  await assert.rejects(
+    () => updateReviewRequest(1, { rawContent: validRawContent, files: [] }, adminActor, createFakeClient()),
+    /Only the author can edit this request/
+  );
+});
+
+test("per-file comment rejects a path that is not attached", async () => {
+  await assert.rejects(
+    () => addReviewComment(1, { body: "Missing attachment", filePath: "resources/missing.md" }, reviewerActor, createFakeClient()),
+    /attached file/
+  );
+});
+
+test("per-file comment accepts SKILL.md and an attached file", async () => {
+  const file = {
+    id: 1,
+    review_request_id: 1,
+    path: "resources/reference.md",
+    file_type: "resource",
+    content: "Reference content",
+    change_type: "added",
+    created_at: 1,
+  };
+
+  const skillComment = await addReviewComment(1, { body: "Skill note", filePath: "SKILL.md" }, reviewerActor, createFakeClient([file]));
+  const attachedFileComment = await addReviewComment(1, { body: "File note", filePath: "resources/reference.md" }, reviewerActor, createFakeClient([file]));
+
+  assert.equal(skillComment.filePath, "SKILL.md");
+  assert.equal(attachedFileComment.filePath, "resources/reference.md");
+});
+
+test("approval records approved status without activating the skill until Task 6", async () => {
+  const request = await decideReviewRequest(1, { decision: "approve" }, reviewerActor, createFakeClient());
+
+  assert.equal(request.status, "approved");
+});
diff --git a/src/lib/review/service.ts b/src/lib/review/service.ts
new file mode 100644
index 0000000..1d0622e
--- /dev/null
+++ b/src/lib/review/service.ts
@@ -0,0 +1,297 @@
+import matter from "gray-matter";
+import { validateBodySections, validateSkillFrontmatter } from "@/lib/skill-schema";
+import { assertCanEditRequest, canReview, hasRole } from "./auth";
+import { validateReviewFilePath } from "./files";
+import type {
+  AddReviewCommentInput,
+  CreateReviewRequestInput,
+  DecideReviewRequestInput,
+  ListReviewRequestsQuery,
+  ReviewActor,
+  ReviewComment,
+  ReviewDatabaseClient,
+  ReviewFile,
+  ReviewFileInput,
+  ReviewRequest,
+  ReviewRequestDetailDto,
+  ReviewRequestSummary,
+  ReviewStatus,
+  UpdateReviewRequestInput,
+} from "./types";
+
+function asNumber(value: unknown): number {
+  return typeof value === "number" ? value : Number(value);
+}
+
+function asNullableNumber(value: unknown): number | null {
+  return value === null || value === undefined ? null : asNumber(value);
+}
+
+function asNullableString(value: unknown): string | null {
+  return typeof value === "string" ? value : null;
+}
+
+function toRequest(row: Record<string, unknown>): ReviewRequest {
+  return {
+    id: asNumber(row.id),
+    skillId: asNullableNumber(row.skill_id),
+    slug: String(row.slug),
+    name: String(row.name),
+    description: String(row.description),
+    type: String(row.type),
+    version: String(row.version),
+    schemaVersion: String(row.schema_version),
+    authorId: String(row.author_id),
+    authorHandle: asNullableString(row.author_handle),
+    rawContent: String(row.raw_content),
+    status: row.status as ReviewStatus,
+    reviewerId: asNullableString(row.reviewer_id),
+    reviewerHandle: asNullableString(row.reviewer_handle),
+    generalComment: asNullableString(row.general_comment),
+    submittedAt: asNumber(row.submitted_at),
+    reviewedAt: asNullableNumber(row.reviewed_at),
+    updatedAt: asNumber(row.updated_at),
+  };
+}
+
+function toFile(row: Record<string, unknown>): ReviewFile {
+  return {
+    id: asNumber(row.id),
+    reviewRequestId: asNumber(row.review_request_id),
+    path: String(row.path),
+    fileType: row.file_type as ReviewFile["fileType"],
+    content: String(row.content),
+    changeType: row.change_type as ReviewFile["changeType"],
+    createdAt: asNumber(row.created_at),
+  };
+}
+
+function toComment(row: Record<string, unknown>): ReviewComment {
+  return {
+    id: asNumber(row.id),
+    reviewRequestId: asNumber(row.review_request_id),
+    filePath: asNullableString(row.file_path),
+    authorId: String(row.author_id),
+    authorHandle: asNullableString(row.author_handle),
+    body: String(row.body),
+    createdAt: asNumber(row.created_at),
+  };
+}
+
+function validateSubmission(rawContent: string, files: ReviewFileInput[] = []) {
+  if (!rawContent.trim()) throw new Error("SKILL.md content is required");
+
+  const parsed = matter(rawContent);
+  const frontmatter = validateSkillFrontmatter(parsed.data);
+  const body = validateBodySections(parsed.content);
+  const errors = [...frontmatter.errors, ...body.errors];
+  if (!frontmatter.valid || errors.length > 0) {
+    throw new Error(errors.map((error) => error.message).join("; "));
+  }
+
+  const paths = new Set<string>();
+  const normalizedFiles = files.map((file) => {
+    const path = validateReviewFilePath(file.path);
+    if (paths.has(path)) throw new Error("Review file paths must be unique");
+    paths.add(path);
+    return { ...file, path, content: file.content ?? "", changeType: file.changeType ?? "added" };
+  });
+
+  return { frontmatter: frontmatter.parsed!, files: normalizedFiles };
+}
+
+async function getRequestRow(id: number, client: ReviewDatabaseClient): Promise<ReviewRequest> {
+  const result = await client.execute({
+    sql: "SELECT * FROM skill_review_requests WHERE id = ?",
+    args: [id],
+  });
+  if (result.rows.length === 0) throw new Error("Review request not found");
+  return toRequest(result.rows[0]);
+}
+
+async function replaceFiles(id: number, files: ReturnType<typeof validateSubmission>["files"], client: ReviewDatabaseClient) {
+  await client.execute({ sql: "DELETE FROM skill_review_files WHERE review_request_id = ?", args: [id] });
+  for (const file of files) {
+    await client.execute({
+      sql: `INSERT INTO skill_review_files
+        (review_request_id, path, file_type, content, change_type)
+        VALUES (?, ?, ?, ?, ?)`,
+      args: [id, file.path, file.fileType, file.content, file.changeType],
+    });
+  }
+}
+
+export async function createReviewRequest(
+  input: CreateReviewRequestInput,
+  actor: ReviewActor,
+  client: ReviewDatabaseClient
+): Promise<ReviewRequest> {
+  const { frontmatter, files } = validateSubmission(input.rawContent, input.files);
+  const duplicate = await client.execute({
+    sql: `SELECT id FROM skill_review_requests
+      WHERE slug = ? AND version = ? AND status IN ('pending', 'changes_requested')`,
+    args: [frontmatter.name, frontmatter.version],
+  });
+  if (duplicate.rows.length > 0) throw new Error("An open review request already exists");
+
+  await client.execute({
+    sql: `INSERT INTO skill_review_requests
+      (skill_id, slug, name, description, type, version, schema_version, author_id, author_handle, raw_content, status)
+      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
+    args: [
+      input.skillId ?? null,
+      frontmatter.name,
+      frontmatter.name,
+      frontmatter.description,
+      frontmatter.metadata.type,
+      frontmatter.version,
+      frontmatter.schema_version,
+      actor.id,
+      actor.handle ?? null,
+      input.rawContent,
+    ],
+  });
+
+  const created = await client.execute({
+    sql: `SELECT * FROM skill_review_requests
+      WHERE author_id = ? AND slug = ? AND version = ?
+      ORDER BY id DESC LIMIT 1`,
+    args: [actor.id, frontmatter.name, frontmatter.version],
+  });
+  if (created.rows.length === 0) throw new Error("Review request was not created");
+
+  const request = toRequest(created.rows[0]);
+  await replaceFiles(request.id, files, client);
+  return request;
+}
+
+export async function updateReviewRequest(
+  id: number,
+  input: UpdateReviewRequestInput,
+  actor: ReviewActor,
+  client: ReviewDatabaseClient
+): Promise<ReviewRequest> {
+  const request = await getRequestRow(id, client);
+  assertCanEditRequest(actor, request);
+  const { frontmatter, files } = validateSubmission(input.rawContent, input.files);
+
+  await client.execute({
+    sql: `UPDATE skill_review_requests
+      SET slug = ?, name = ?, description = ?, type = ?, version = ?, schema_version = ?, raw_content = ?,
+          status = 'pending', reviewer_id = NULL, reviewer_handle = NULL, general_comment = NULL,
+          reviewed_at = NULL, updated_at = unixepoch()
+      WHERE id = ?`,
+    args: [
+      frontmatter.name,
+      frontmatter.name,
+      frontmatter.description,
+      frontmatter.metadata.type,
+      frontmatter.version,
+      frontmatter.schema_version,
+      input.rawContent,
+      id,
+    ],
+  });
+  await replaceFiles(id, files, client);
+  return getRequestRow(id, client);
+}
+
+export async function listReviewRequests(
+  query: ListReviewRequestsQuery,
+  actor: ReviewActor,
+  client: ReviewDatabaseClient
+): Promise<ReviewRequestSummary[]> {
+  const clauses: string[] = [];
+  const args: unknown[] = [];
+  if (query.mine || !canReview(actor)) {
+    clauses.push("author_id = ?");
+    args.push(actor.id);
+  }
+  if (query.status) {
+    clauses.push("status = ?");
+    args.push(query.status);
+  }
+  const where = clauses.length > 0 ? ` WHERE ${clauses.join(" AND ")}` : "";
+  const result = await client.execute({
+    sql: `SELECT * FROM skill_review_requests${where} ORDER BY updated_at DESC, id DESC`,
+    args,
+  });
+  return result.rows.map(toRequest).map(({ rawContent: _rawContent, ...request }) => request);
+}
+
+export async function getReviewRequest(
+  id: number,
+  actor: ReviewActor,
+  client: ReviewDatabaseClient
+): Promise<ReviewRequestDetailDto> {
+  const request = await getRequestRow(id, client);
+  if (request.authorId !== actor.id && !canReview(actor) && !hasRole(actor, "admin")) {
+    throw new Error("Not allowed to view this request");
+  }
+  const [files, comments] = await Promise.all([
+    client.execute({ sql: "SELECT * FROM skill_review_files WHERE review_request_id = ? ORDER BY id", args: [id] }),
+    client.execute({ sql: "SELECT * FROM skill_review_comments WHERE review_request_id = ? ORDER BY id", args: [id] }),
+  ]);
+  return { ...request, files: files.rows.map(toFile), comments: comments.rows.map(toComment) };
+}
+
+export async function addReviewComment(
+  id: number,
+  input: AddReviewCommentInput,
+  actor: ReviewActor,
+  client: ReviewDatabaseClient
+): Promise<ReviewComment> {
+  const request = await getReviewRequest(id, actor, client);
+  const body = input.body.trim();
+  if (!body) throw new Error("Comment is required");
+  const filePath = input.filePath === null || input.filePath === undefined
+    ? null
+    : validateReviewFilePath(input.filePath);
+  if (filePath && filePath !== "SKILL.md" && !request.files.some((file) => file.path === filePath)) {
+    throw new Error("Comment file path must match an attached file");
+  }
+  await client.execute({
+    sql: `INSERT INTO skill_review_comments
+      (review_request_id, file_path, author_id, author_handle, body)
+      VALUES (?, ?, ?, ?, ?)`,
+    args: [id, filePath, actor.id, actor.handle ?? null, body],
+  });
+  const result = await client.execute({
+    sql: "SELECT * FROM skill_review_comments WHERE review_request_id = ? ORDER BY id DESC LIMIT 1",
+    args: [id],
+  });
+  if (result.rows.length === 0) throw new Error("Comment was not created");
+  return toComment(result.rows[0]);
+}
+
+export async function decideReviewRequest(
+  id: number,
+  input: DecideReviewRequestInput,
+  actor: ReviewActor,
+  client: ReviewDatabaseClient
+): Promise<ReviewRequest> {
+  const request = await getRequestRow(id, client);
+  if (request.authorId === actor.id) throw new Error("Author cannot approve own request");
+  if (!canReview(actor)) throw new Error("Reviewer role is required");
+  if (request.status !== "pending" && request.status !== "changes_requested") {
+    throw new Error("Review request is not active");
+  }
+  if ((input.decision === "reject" || input.decision === "request_changes") && !input.comment?.trim()) {
+    throw new Error("A general comment required for this decision");
+  }
+
+  const status: ReviewStatus = input.decision === "approve"
+    ? "approved"
+    : input.decision === "reject"
+      ? "rejected"
+      : "changes_requested";
+  // Task 6 activates skills after approval; this task records only review state.
+  await client.execute({
+    sql: `UPDATE skill_review_requests
+      SET status = ?, reviewer_id = ?, reviewer_handle = ?, general_comment = ?,
+          reviewed_at = unixepoch(), updated_at = unixepoch()
+      WHERE id = ?`,
+    args: [status, actor.id, actor.handle ?? null, input.comment?.trim() ?? null, id],
+  });
+  return { ...request, status, reviewerId: actor.id, reviewerHandle: actor.handle ?? null, generalComment: input.comment?.trim() ?? null };
+}
diff --git a/src/lib/review/types.ts b/src/lib/review/types.ts
new file mode 100644
index 0000000..53967e9
--- /dev/null
+++ b/src/lib/review/types.ts
@@ -0,0 +1,97 @@
+export type ReviewStatus = "pending" | "changes_requested" | "approved" | "rejected";
+export type ReviewDecision = "approve" | "reject" | "request_changes";
+export type ReviewFileType = "resource" | "script";
+export type ReviewFileChangeType = "added" | "modified" | "deleted" | "unchanged";
+
+export type ReviewActor = {
+  id: string;
+  handle?: string | null;
+  roles: string[];
+};
+
+export type ReviewFileInput = {
+  path: string;
+  fileType: ReviewFileType;
+  content?: string;
+  changeType?: ReviewFileChangeType;
+};
+
+export type CreateReviewRequestInput = {
+  rawContent: string;
+  files?: ReviewFileInput[];
+  skillId?: number | null;
+};
+
+export type UpdateReviewRequestInput = {
+  rawContent: string;
+  files?: ReviewFileInput[];
+};
+
+export type ListReviewRequestsQuery = {
+  mine?: boolean;
+  status?: ReviewStatus;
+};
+
+export type AddReviewCommentInput = {
+  body: string;
+  filePath?: string | null;
+};
+
+export type DecideReviewRequestInput = {
+  decision: ReviewDecision;
+  comment?: string | null;
+};
+
+export type ReviewRequest = {
+  id: number;
+  skillId: number | null;
+  slug: string;
+  name: string;
+  description: string;
+  type: string;
+  version: string;
+  schemaVersion: string;
+  authorId: string;
+  authorHandle: string | null;
+  rawContent: string;
+  status: ReviewStatus;
+  reviewerId: string | null;
+  reviewerHandle: string | null;
+  generalComment: string | null;
+  submittedAt: number;
+  reviewedAt: number | null;
+  updatedAt: number;
+};
+
+export type ReviewFile = {
+  id: number;
+  reviewRequestId: number;
+  path: string;
+  fileType: ReviewFileType;
+  content: string;
+  changeType: ReviewFileChangeType;
+  createdAt: number;
+};
+
+export type ReviewComment = {
+  id: number;
+  reviewRequestId: number;
+  filePath: string | null;
+  authorId: string;
+  authorHandle: string | null;
+  body: string;
+  createdAt: number;
+};
+
+export type ReviewRequestSummary = Omit<ReviewRequest, "rawContent">;
+
+export type ReviewRequestDetailDto = ReviewRequest & {
+  files: ReviewFile[];
+  comments: ReviewComment[];
+};
+
+export type ReviewDatabaseClient = {
+  execute: (input: string | { sql: string; args?: unknown[] }) => Promise<{
+    rows: Record<string, unknown>[];
+  }>;
+};

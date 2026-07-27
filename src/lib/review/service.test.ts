import test from "node:test";
import assert from "node:assert/strict";
import {
  addReviewComment,
  createReviewRequest,
  decideReviewRequest,
  getReviewStatusCounts,
  listReviewRequests,
  updateReviewRequest,
} from "./service";
import type { ReviewActor, ReviewDatabaseClient } from "./types";

const validRawContent = `---
name: demo-skill
description: A complete enough description for the demo review skill.
version: 1.0.0
schema_version: "1.1"
metadata:
  type: code
  triggers:
    - demo
compatibility:
  - claude
---
# Demo Skill

## Descripcion

Demo description.

## Cuando usar

Use this demo.

## Instrucciones

Follow these instructions.`;

const relaxedRawContent = `# Draft Skill

This draft intentionally omits strict frontmatter metadata and required body sections.`;

const overLineLimitRawContent = Array.from({ length: 301 }, (_, index) => `line ${index + 1}`).join("\n");
const maxLineLimitWithTerminalNewlineRawContent = `${Array.from({ length: 300 }, (_, index) => `line ${index + 1}`).join("\n")}\n`;
const shortDescriptionRawContent = `---
name: short-desc-skill
description: Too short.
---
# Short Description Skill

Draft body.`;

const malformedFrontmatterRawContent = `---
name: [broken
---
# Broken YAML Draft

Draft body.`;

const higherVersionRawContent = `---
name: demo-skill
description: A complete enough description for the demo review skill.
version: 1.1.0
schema_version: "1.1"
metadata:
  type: code
  triggers:
    - demo
compatibility:
  - claude
---
# Demo Skill

## Descripcion

Demo description.

## Cuando usar

Use this demo.

## Instrucciones

Follow these instructions.`;

const sameVersionRawContent = higherVersionRawContent.replace("version: 1.1.0", "version: 1.0.0");
const lowerVersionRawContent = higherVersionRawContent.replace("version: 1.1.0", "version: 0.9.0");

const userActor: ReviewActor = { id: "user-1", handle: "user", roles: ["user"] };
const authorActor: ReviewActor = { id: "author-1", handle: "author", roles: ["author"] };
const editorActor: ReviewActor = { id: "author-1", handle: "editor", roles: ["editor"] };
const reviewerActor: ReviewActor = { id: "reviewer-1", handle: "reviewer", roles: ["reviewer"] };
const authorReviewerActor: ReviewActor = { id: "author-1", handle: "reviewer", roles: ["reviewer"] };
const adminActor: ReviewActor = { id: "admin-1", handle: "admin", roles: ["admin"] };

type FakeClient = ReviewDatabaseClient & {
  transaction: <T>(fn: (txClient: ReviewDatabaseClient) => Promise<T>) => Promise<T>;
  insertedSkill?: Record<string, unknown>;
  insertedReviewRequest?: Record<string, unknown>;
  insertedFiles: Array<Record<string, unknown>>;
  insertedVersionFiles: Array<Record<string, unknown>>;
  insertedVersion?: Record<string, unknown>;
  updatedRequest?: Record<string, unknown>;
  failOnSkillInsert: boolean;
  failOnVersionInsert: boolean;
  failOnApprovalUpdate: boolean;
  commands: string[];
};

function createFakeClient(
  files: Array<Record<string, unknown>> = [],
  requestOverrides: Partial<Record<string, unknown>> = {},
  options: { existingSkill?: boolean; publishedVersion?: string } = {}
): FakeClient {
  const comments: Array<Record<string, unknown>> = [];
  const request = {
    id: 1,
    skill_id: null,
    slug: "demo-skill",
    name: "demo-skill",
    description: "A complete enough description for the demo review skill.",
    type: "code",
    version: "1.0.0",
    schema_version: "1.1",
    author_id: "author-1",
    author_handle: "author",
    raw_content: validRawContent,
    status: "pending",
    reviewer_id: null,
    reviewer_handle: null,
    general_comment: null,
    submitted_at: 1,
    reviewed_at: null,
    updated_at: 1,
    ...requestOverrides,
  };

  const fakeClient: FakeClient = {
    insertedFiles: [],
    insertedVersionFiles: [],
    failOnSkillInsert: false,
    failOnVersionInsert: false,
    failOnApprovalUpdate: false,
    commands: [],
    transaction: async (fn) => fn(fakeClient),
    async execute(input) {
      const sql = typeof input === "string" ? input : input.sql;
      const args = typeof input === "string" ? [] : input.args ?? [];
      fakeClient.commands.push(sql);
      if (sql.includes("SELECT * FROM skill_review_requests WHERE id = ?")) {
        return { rows: [request] };
      }
      if (sql.includes("SELECT * FROM skill_review_requests") && sql.includes("ORDER BY id DESC")) {
        return { rows: [request] };
      }
      if (sql.includes("SELECT * FROM skill_review_files WHERE review_request_id = ?")) {
        return { rows: files };
      }
      if (sql.includes("INSERT INTO skills")) {
        if (fakeClient.failOnSkillInsert) throw new Error("activation failed");
        fakeClient.insertedSkill = {
          id: 7,
          slug: args[0],
          name: args[1],
        };
        return { rows: [] };
      }
      if (sql.includes("SELECT id FROM skills WHERE slug = ? AND status = 'published'")) {
        return { rows: [{ id: 7 }] };
      }
      if (sql.includes("SELECT id FROM skills WHERE slug = ?")) {
        return { rows: options.existingSkill ? [{ id: 7 }] : [] };
      }
      if (sql.includes("SELECT version FROM skills WHERE id = ?")) {
        return options.publishedVersion ? { rows: [{ version: options.publishedVersion }] } : { rows: [] };
      }
      if (sql.includes("INSERT INTO skill_review_requests")) {
        fakeClient.insertedReviewRequest = {
          skillId: args[0],
          slug: args[1],
          name: args[2],
          description: args[3],
          type: args[4],
          version: args[5],
          schemaVersion: args[6],
          authorId: args[7],
          authorHandle: args[8],
          rawContent: args[9],
        };
        return { rows: [] };
      }
      if (sql.includes("DELETE FROM skill_files")) {
        return { rows: [] };
      }
      if (sql.includes("INSERT INTO skill_files")) {
        fakeClient.insertedFiles.push({ skillId: args[0], path: args[1], fileType: args[2], content: args[3] });
        return { rows: [] };
      }
      if (sql.includes("INSERT INTO skill_versions")) {
        if (fakeClient.failOnVersionInsert) throw new Error("version insert failed");
        fakeClient.insertedVersion = { skillId: args[0], version: args[1], rawContent: args[2] };
        return { rows: [] };
      }
      if (sql.includes("SELECT id FROM skill_versions WHERE skill_id = ? AND version = ?")) {
        return { rows: [{ id: 42 }] };
      }
      if (sql.includes("INSERT INTO skill_version_files")) {
        fakeClient.insertedVersionFiles.push({ skillVersionId: args[0], path: args[1], fileType: args[2], content: args[3] });
        return { rows: [] };
      }
      if (sql.includes("UPDATE skill_review_requests")) {
        if (fakeClient.failOnApprovalUpdate && args[0] === "approved") throw new Error("approval update failed");
        fakeClient.updatedRequest = { status: args[0] };
        return { rows: [] };
      }
      if (sql.includes("INSERT INTO skill_review_comments")) {
        comments.unshift({
          id: comments.length + 1,
          review_request_id: args[0],
          file_path: args[1],
          author_id: args[2],
          author_handle: args[3],
          body: args[4],
          created_at: 1,
        });
        return { rows: [] };
      }
      if (sql.includes("SELECT * FROM skill_review_comments WHERE review_request_id = ? ORDER BY id DESC LIMIT 1")) {
        return { rows: comments.slice(0, 1) };
      }
      if (sql.includes("SELECT * FROM skill_review_comments WHERE review_request_id = ?")) {
        return { rows: comments };
      }
      return { rows: [] };
    },
  };
  return fakeClient;
}

test("user role cannot create a review request", async () => {
  await assert.rejects(
    () => createReviewRequest(
      {
        rawContent: validRawContent,
        files: [],
        acceptedResponsibility: true,
      },
      userActor,
      createFakeClient()
    ),
    /not allowed/
  );
});

test("user role cannot edit or inspect review workflow state", async () => {
  const fakeClient = createFakeClient();
  await assert.rejects(
    () => updateReviewRequest(
      1,
      { rawContent: validRawContent, files: [] },
      userActor,
      fakeClient
    ),
    /not allowed/
  );
  await assert.rejects(
    () => listReviewRequests({}, userActor, fakeClient),
    /not allowed/
  );
});

test("editor role can create review requests", async () => {
  const request = await createReviewRequest(
    {
      rawContent: validRawContent,
      files: [],
      acceptedResponsibility: true,
    },
    editorActor,
    createFakeClient()
  );
  assert.equal(request.status, "pending");
});

test("author role can create a review request for an existing skill edit", async () => {
  const fakeClient = createFakeClient([], {}, { publishedVersion: "1.0.0" });

  const request = await createReviewRequest(
    {
      rawContent: higherVersionRawContent,
      files: [],
      acceptedResponsibility: true,
      skillId: 7,
    },
    authorActor,
    fakeClient
  );

  assert.equal(request.status, "pending");
  assert.equal(fakeClient.insertedReviewRequest?.skillId, 7);
});

test("author role cannot create a review request for a new skill", async () => {
  await assert.rejects(
    () => createReviewRequest(
      {
        rawContent: validRawContent,
        files: [],
        acceptedResponsibility: true,
      },
      authorActor,
      createFakeClient()
    ),
    /Publishing is not allowed/
  );
});

test("editor creates pending request for a new skill", async () => {
  const request = await createReviewRequest(
    { rawContent: validRawContent, files: [], acceptedResponsibility: true },
    editorActor,
    createFakeClient()
  );
  assert.equal(request.status, "pending");
  assert.equal(request.slug, "demo-skill");
});

test("rejects a new-skill submission when a skill with the same slug already exists", async () => {
  await assert.rejects(
    () => createReviewRequest(
      { rawContent: validRawContent, files: [], acceptedResponsibility: true },
      editorActor,
      createFakeClient([], {}, { existingSkill: true })
    ),
    /already exists/
  );
});

test("createReviewRequest rejects a version submission equal to the currently published version", async () => {
  await assert.rejects(
    () => createReviewRequest(
      { rawContent: sameVersionRawContent, files: [], acceptedResponsibility: true, skillId: 7 },
      editorActor,
      createFakeClient([], {}, { publishedVersion: "1.0.0" })
    ),
    /invalida/
  );
});

test("createReviewRequest rejects a version submission lower than the currently published version", async () => {
  await assert.rejects(
    () => createReviewRequest(
      { rawContent: lowerVersionRawContent, files: [], acceptedResponsibility: true, skillId: 7 },
      editorActor,
      createFakeClient([], {}, { publishedVersion: "1.0.0" })
    ),
    /invalida/
  );
});

test("createReviewRequest accepts a version submission greater than the currently published version", async () => {
  const fakeClient = createFakeClient([], {}, { publishedVersion: "1.0.0" });
  const request = await createReviewRequest(
    { rawContent: higherVersionRawContent, files: [], acceptedResponsibility: true, skillId: 7 },
    editorActor,
    fakeClient
  );
  assert.equal(request.status, "pending");
  assert.equal(fakeClient.insertedReviewRequest?.version, "1.1.0");
});

test("updateReviewRequest rejects lowering the version below the currently published version", async () => {
  const fakeClient = createFakeClient([], { skill_id: 7 }, { publishedVersion: "1.0.0" });
  await assert.rejects(
    () => updateReviewRequest(1, { rawContent: sameVersionRawContent, files: [] }, authorActor, fakeClient),
    /invalida/
  );
});

test("updateReviewRequest accepts raising the version above the currently published version", async () => {
  const fakeClient = createFakeClient([], { skill_id: 7 }, { publishedVersion: "1.0.0" });
  const request = await updateReviewRequest(1, { rawContent: higherVersionRawContent, files: [] }, authorActor, fakeClient);
  assert.equal(request.status, "pending");
});

test("createReviewRequest stores relaxed draft metadata when responsibility is accepted", async () => {
  const fakeClient = createFakeClient([], {
    slug: "draft-skill",
    name: "draft-skill",
    description: "Skill enviado a revision sin descripcion validada.",
    raw_content: relaxedRawContent,
  });

  await createReviewRequest(
    { rawContent: relaxedRawContent, files: [], acceptedResponsibility: true },
    editorActor,
    fakeClient
  );

  assert.equal(fakeClient.insertedReviewRequest?.slug, "draft-skill");
  assert.equal(fakeClient.insertedReviewRequest?.description, "Skill enviado a revision sin descripcion validada.");
});

test("createReviewRequest rejects relaxed drafts over 300 lines", async () => {
  await assert.rejects(
    () => createReviewRequest(
      { rawContent: overLineLimitRawContent, files: [], acceptedResponsibility: true },
      editorActor,
      createFakeClient()
    ),
    /Maximo 300 lineas/
  );
});

test("createReviewRequest accepts 300 content lines with a final newline", async () => {
  await createReviewRequest(
    { rawContent: maxLineLimitWithTerminalNewlineRawContent, files: [], acceptedResponsibility: true },
    editorActor,
    createFakeClient([], {
      slug: "draft-skill",
      name: "draft-skill",
      raw_content: maxLineLimitWithTerminalNewlineRawContent,
    })
  );
});

test("createReviewRequest falls back to default description for short frontmatter descriptions", async () => {
  const fakeClient = createFakeClient([], {
    slug: "short-desc-skill",
    name: "short-desc-skill",
    description: "Skill enviado a revision sin descripcion validada.",
    raw_content: shortDescriptionRawContent,
  });

  await createReviewRequest(
    { rawContent: shortDescriptionRawContent, files: [], acceptedResponsibility: true },
    editorActor,
    fakeClient
  );

  assert.equal(fakeClient.insertedReviewRequest?.slug, "short-desc-skill");
  assert.equal(fakeClient.insertedReviewRequest?.description, "Skill enviado a revision sin descripcion validada.");
});

test("createReviewRequest accepts malformed YAML frontmatter as relaxed draft content", async () => {
  const fakeClient = createFakeClient([], {
    slug: "broken-yaml-draft",
    name: "broken-yaml-draft",
    description: "Skill enviado a revision sin descripcion validada.",
    raw_content: malformedFrontmatterRawContent,
  });

  await createReviewRequest(
    { rawContent: malformedFrontmatterRawContent, files: [], acceptedResponsibility: true },
    editorActor,
    fakeClient
  );

  assert.equal(fakeClient.insertedReviewRequest?.slug, "broken-yaml-draft");
  assert.equal(fakeClient.insertedReviewRequest?.description, "Skill enviado a revision sin descripcion validada.");
});

test("approval accepts relaxed draft content and publishes successfully", async () => {
  const fakeClient = createFakeClient([], {
    slug: "draft-skill",
    name: "draft-skill",
    description: "Skill enviado a revision sin descripcion validada.",
    raw_content: relaxedRawContent,
  });

  const decided = await decideReviewRequest(
    1,
    { decision: "approve" },
    reviewerActor,
    fakeClient
  );

  assert.equal(decided.status, "approved");
});

test("approval archives attached files into skill_version_files, excluding deleted ones", async () => {
  const fakeClient = createFakeClient([
    { id: 1, review_request_id: 1, path: "resources/reference.md", file_type: "resource", content: "hello", change_type: "added", created_at: 1 },
    { id: 2, review_request_id: 1, path: "scripts/old.sh", file_type: "script", content: "gone", change_type: "deleted", created_at: 1 },
  ], {
    slug: "draft-skill",
    name: "draft-skill",
    description: "Skill enviado a revision sin descripcion validada.",
    raw_content: relaxedRawContent,
  });

  await decideReviewRequest(1, { decision: "approve" }, reviewerActor, fakeClient);

  assert.equal(fakeClient.insertedVersionFiles.length, 1);
  assert.equal(fakeClient.insertedVersionFiles[0].path, "resources/reference.md");
  assert.equal(fakeClient.insertedVersionFiles[0].skillVersionId, 42);
});

test("author cannot approve own request", async () => {
  await assert.rejects(
    () => decideReviewRequest(1, { decision: "approve" }, authorReviewerActor, createFakeClient()),
    /cannot approve own request/
  );
});

test("allows an admin actor to approve a pending review request from another user", async () => {
  const fakeClient = createFakeClient();
  const decided = await decideReviewRequest(
    1,
    { decision: "approve", comment: "LGTM" },
    adminActor,
    fakeClient
  );

  assert.equal(decided.status, "approved");
  assert.equal(decided.reviewerId, "admin-1");
});

test("prevents an admin actor from approving their own review request", async () => {
  const fakeClient = createFakeClient([], { author_id: "admin-1" });

  await assert.rejects(
    () =>
      decideReviewRequest(
        1,
        { decision: "approve", comment: "Self approval attempt" },
        adminActor,
        fakeClient
      ),
    /Author cannot approve own request/
  );
});

test("request_changes requires comment", async () => {
  await assert.rejects(
    () => decideReviewRequest(1, { decision: "request_changes" }, reviewerActor, createFakeClient()),
    /comment required/
  );
});

test("invalid review decision is rejected", async () => {
  await assert.rejects(
    () => decideReviewRequest(1, { decision: "anything" as never }, reviewerActor, createFakeClient()),
    /Invalid review decision/
  );
});

test("unauthorized reviewer receives authorization denial before decision validation", async () => {
  const fakeClient = createFakeClient();

  await assert.rejects(
    () => decideReviewRequest(1, { decision: "anything" as never }, authorActor, fakeClient),
    /Reviewer role is required/
  );
  assert.equal(fakeClient.commands.length, 0);
});

test("admin cannot edit another author's request", async () => {
  await assert.rejects(
    () => updateReviewRequest(1, { rawContent: validRawContent, files: [] }, adminActor, createFakeClient()),
    /Only the author can edit this request/
  );
});

test("per-file comment rejects a path that is not attached", async () => {
  await assert.rejects(
    () => addReviewComment(1, { body: "Missing attachment", filePath: "resources/missing.md" }, reviewerActor, createFakeClient()),
    /attached file/
  );
});

test("per-file comment accepts SKILL.md and an attached file", async () => {
  const file = {
    id: 1,
    review_request_id: 1,
    path: "resources/reference.md",
    file_type: "resource",
    content: "Reference content",
    change_type: "added",
    created_at: 1,
  };

  const skillComment = await addReviewComment(1, { body: "Skill note", filePath: "SKILL.md" }, reviewerActor, createFakeClient([file]));
  const attachedFileComment = await addReviewComment(1, { body: "File note", filePath: "resources/reference.md" }, reviewerActor, createFakeClient([file]));

  assert.equal(skillComment.filePath, "SKILL.md");
  assert.equal(attachedFileComment.filePath, "resources/reference.md");
});

test("approving new skill creates published skill, files, and version snapshot", async () => {
  const files = [
    {
      id: 1,
      review_request_id: 1,
      path: "resources/reference.md",
      file_type: "resource",
      content: "Published reference",
      change_type: "added",
      created_at: 1,
    },
    {
      id: 2,
      review_request_id: 1,
      path: "resources/removed.md",
      file_type: "resource",
      content: "Deleted reference",
      change_type: "deleted",
      created_at: 1,
    },
  ];
  const fakeClient = createFakeClient(files);

  const request = await decideReviewRequest(1, { decision: "approve" }, reviewerActor, fakeClient);

  assert.equal(request.status, "approved");
  assert.equal(fakeClient.insertedSkill?.slug, "demo-skill");
  assert.deepEqual(fakeClient.insertedFiles, [{ skillId: 7, path: "resources/reference.md", fileType: "resource", content: "Published reference" }]);
  assert.deepEqual(fakeClient.insertedVersion, { skillId: 7, version: "1.0.0", rawContent: validRawContent });
  assert.equal(fakeClient.updatedRequest?.status, "approved");
});

test("approval activation uses the transaction-scoped client", async () => {
  const outerClient = createFakeClient();
  const transactionClient = createFakeClient();
  let transactionCalled = false;
  outerClient.transaction = async (fn) => {
    transactionCalled = true;
    return fn(transactionClient);
  };

  await decideReviewRequest(1, { decision: "approve" }, reviewerActor, outerClient);

  assert.equal(transactionCalled, true);
  assert.equal(outerClient.insertedSkill, undefined);
  assert.equal(outerClient.updatedRequest, undefined);
  assert.equal(transactionClient.insertedSkill?.slug, "demo-skill");
  assert.equal(transactionClient.updatedRequest?.status, "approved");
});

test("approval failure leaves request pending", async () => {
  const fakeClient = createFakeClient();
  fakeClient.failOnSkillInsert = true;

  await assert.rejects(
    () => decideReviewRequest(1, { decision: "approve" }, reviewerActor, fakeClient),
    /activation failed/
  );

  assert.notEqual(fakeClient.updatedRequest?.status, "approved");
});

test("approving an existing skill replaces published content and files", async () => {
  const fakeClient = createFakeClient([
    {
      id: 1,
      review_request_id: 1,
      path: "resources/replacement.md",
      file_type: "resource",
      content: "Replacement content",
      change_type: "modified",
      created_at: 1,
    },
  ], { skill_id: 7 });

  await decideReviewRequest(1, { decision: "approve" }, reviewerActor, fakeClient);

  assert.equal(fakeClient.insertedSkill, undefined);
  assert.deepEqual(fakeClient.insertedFiles, [{ skillId: 7, path: "resources/replacement.md", fileType: "resource", content: "Replacement content" }]);
  assert.ok(fakeClient.commands.some((sql) => sql.includes("UPDATE skills")));
  assert.ok(fakeClient.commands.some((sql) => sql.includes("DELETE FROM skill_files")));
});

test("version insert failure rolls back activation without approving the request", async () => {
  const fakeClient = createFakeClient();
  fakeClient.failOnVersionInsert = true;

  await assert.rejects(
    () => decideReviewRequest(1, { decision: "approve" }, reviewerActor, fakeClient),
    /version insert failed/
  );

  assert.notEqual(fakeClient.updatedRequest?.status, "approved");
  assert.equal(fakeClient.updatedRequest, undefined);
});

test("approval update failure rolls back published writes without approving the request", async () => {
  const fakeClient = createFakeClient();
  fakeClient.failOnApprovalUpdate = true;

  await assert.rejects(
    () => decideReviewRequest(1, { decision: "approve" }, reviewerActor, fakeClient),
    /approval update failed/
  );

  assert.notEqual(fakeClient.updatedRequest?.status, "approved");
  assert.equal(fakeClient.updatedRequest, undefined);
});

test("getReviewStatusCounts aggregates status counts correctly", async () => {
  const executedSql: string[] = [];
  const executedArgs: unknown[][] = [];
  const fakeClient: ReviewDatabaseClient = {
    async execute(input) {
      const sql = typeof input === "string" ? input : input.sql;
      const args = typeof input === "string" ? [] : input.args ?? [];
      executedSql.push(sql);
      executedArgs.push(args);
      return {
        rows: [
          { status: "pending", count: "3" },
          { status: "approved", count: 2 },
          { status: "changes_requested", count: 1 },
          { status: "rejected", count: 0 },
        ],
      };
    },
  };

  const authorCounts = await getReviewStatusCounts(authorActor, {}, fakeClient);
  assert.equal(executedSql[0].includes("WHERE author_id = ?"), true);
  assert.deepEqual(executedArgs[0], ["author-1"]);
  assert.deepEqual(authorCounts, {
    all: 6,
    pending: 3,
    approved: 2,
    changes_requested: 1,
    rejected: 0,
  });

  const reviewerCounts = await getReviewStatusCounts(reviewerActor, { mine: false }, fakeClient);
  assert.equal(executedSql[1].includes("WHERE author_id = ?"), false);
  assert.deepEqual(reviewerCounts, {
    all: 6,
    pending: 3,
    approved: 2,
    changes_requested: 1,
    rejected: 0,
  });
});

test("listReviewRequests filters by status when query.status is provided and !== 'all'", async () => {
  const executedSql: string[] = [];
  const executedArgs: unknown[][] = [];
  const fakeClient: ReviewDatabaseClient = {
    async execute(input) {
      const sql = typeof input === "string" ? input : input.sql;
      const args = typeof input === "string" ? [] : input.args ?? [];
      executedSql.push(sql);
      executedArgs.push(args);
      return { rows: [] };
    },
  };

  await listReviewRequests({ status: "pending" }, reviewerActor, fakeClient);
  assert.ok(executedSql[0].includes("status = ?"));
  assert.deepEqual(executedArgs[0], ["pending"]);

  await listReviewRequests({ status: "all" }, reviewerActor, fakeClient);
  assert.ok(!executedSql[1].includes("status = ?"));
});

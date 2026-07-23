import test from "node:test";
import assert from "node:assert/strict";
import {
  addReviewComment,
  createReviewRequest,
  decideReviewRequest,
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

const authorActor: ReviewActor = { id: "author-1", handle: "author", roles: ["author"] };
const reviewerActor: ReviewActor = { id: "reviewer-1", handle: "reviewer", roles: ["reviewer"] };
const adminActor: ReviewActor = { id: "admin-1", handle: "admin", roles: ["admin"] };

type FakeClient = ReviewDatabaseClient & {
  transaction: <T>(fn: (txClient: ReviewDatabaseClient) => Promise<T>) => Promise<T>;
  insertedSkill?: Record<string, unknown>;
  insertedFiles: Array<Record<string, unknown>>;
  insertedVersion?: Record<string, unknown>;
  updatedRequest?: Record<string, unknown>;
  failOnSkillInsert: boolean;
  failOnVersionInsert: boolean;
  failOnApprovalUpdate: boolean;
  commands: string[];
};

function createFakeClient(
  files: Array<Record<string, unknown>> = [],
  requestOverrides: Partial<Record<string, unknown>> = {}
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
      if (sql.includes("SELECT id FROM skills WHERE slug = ?")) {
        return { rows: [{ id: 7 }] };
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

test("author creates pending request for a new skill", async () => {
  const request = await createReviewRequest({ rawContent: validRawContent, files: [] }, authorActor, createFakeClient());
  assert.equal(request.status, "pending");
  assert.equal(request.slug, "demo-skill");
});

test("author cannot approve own request", async () => {
  await assert.rejects(
    () => decideReviewRequest(1, { decision: "approve" }, authorActor, createFakeClient()),
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

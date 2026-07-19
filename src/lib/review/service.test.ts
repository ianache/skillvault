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

function createFakeClient(files: Array<Record<string, unknown>> = []): ReviewDatabaseClient {
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
  };

  return {
    async execute(input) {
      const sql = typeof input === "string" ? input : input.sql;
      const args = typeof input === "string" ? [] : input.args ?? [];
      if (sql.includes("SELECT * FROM skill_review_requests WHERE id = ?")) {
        return { rows: [request] };
      }
      if (sql.includes("SELECT * FROM skill_review_requests") && sql.includes("ORDER BY id DESC")) {
        return { rows: [request] };
      }
      if (sql.includes("SELECT * FROM skill_review_files WHERE review_request_id = ?")) {
        return { rows: files };
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

test("approval records approved status without activating the skill until Task 6", async () => {
  const request = await decideReviewRequest(1, { decision: "approve" }, reviewerActor, createFakeClient());

  assert.equal(request.status, "approved");
});

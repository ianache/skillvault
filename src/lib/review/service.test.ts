import test from "node:test";
import assert from "node:assert/strict";
import {
  createReviewRequest,
  decideReviewRequest,
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

function createFakeClient(): ReviewDatabaseClient {
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
      if (sql.includes("SELECT * FROM skill_review_requests WHERE id = ?")) {
        return { rows: [request] };
      }
      if (sql.includes("SELECT * FROM skill_review_requests") && sql.includes("ORDER BY id DESC")) {
        return { rows: [request] };
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

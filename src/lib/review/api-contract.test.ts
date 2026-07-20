import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { createReviewRequestsHandlers } from "../../app/api/review-requests/route";
import { createReviewDecisionHandlers } from "../../app/api/review-requests/[id]/decision/route";
import { createSkillHandlers } from "../../app/api/skills/route";
import { createSkillDetailHandlers } from "../../app/api/skills/[slug]/route";
import { createSkillDownloadHandlers } from "../../app/api/skills/[slug]/download/route";
import { createSkillInstallHandlers } from "../../app/api/skills/[slug]/install/route";
import { createSkillVersionHandlers } from "../../app/api/skills/[slug]/versions/route";
import { POST as postSkillFiles } from "../../app/api/skills/[slug]/files/route";
import type { ReviewDatabaseClient, ReviewRequest } from "./types";

const reviewerSession = {
  user: {
    id: "reviewer-1",
    name: "Reviewer",
    email: "reviewer@example.test",
    roles: ["reviewer"],
  },
};

const database: ReviewDatabaseClient = {
  async execute() {
    return { rows: [] };
  },
};

const context = { params: Promise.resolve({ id: "1" }) };

const authorSession = {
  user: {
    id: "author-1",
    name: "Author",
    email: "author@example.test",
    roles: ["author"],
  },
};

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

const updatedRawContent = validRawContent.replace("Follow these instructions.", "Follow the updated instructions.");

function reviewRequest(overrides: Partial<ReviewRequest> = {}): ReviewRequest {
  return {
    id: 9,
    skillId: null,
    slug: "demo-skill",
    name: "demo-skill",
    description: "A complete enough description for the demo review skill.",
    type: "code",
    version: "1.0.0",
    schemaVersion: "1.1",
    authorId: "author-1",
    authorHandle: "Author",
    rawContent: validRawContent,
    status: "pending",
    reviewerId: null,
    reviewerHandle: null,
    generalComment: null,
    submittedAt: 1,
    reviewedAt: null,
    updatedAt: 1,
    ...overrides,
  };
}

test("POST /api/skills creates a review request instead of a published skill", async () => {
  const executedSql: string[] = [];
  let createInput: unknown;
  const { POST } = createSkillHandlers({
    getSession: async () => authorSession as never,
    database: {
      async execute(input) {
        executedSql.push(typeof input === "string" ? input : input.sql);
        return { rows: [] };
      },
    },
    create: async (input) => {
      createInput = input;
      return reviewRequest();
    },
  });

  const response = await POST(new NextRequest("http://test/api/skills", {
    method: "POST",
    body: JSON.stringify({
      rawContent: validRawContent,
      files: [{ path: "resources/reference.md", fileType: "resource", content: "Reference" }],
    }),
  }));

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { slug: "demo-skill", reviewRequestId: 9, status: "pending" });
  assert.deepEqual(createInput, {
    rawContent: validRawContent,
    files: [{ path: "resources/reference.md", fileType: "resource", content: "Reference" }],
  });
  assert.equal(executedSql.some((sql) => sql.includes("INSERT INTO skills")), false);
});

test("POST /api/skills/:slug/files is disabled while files are reviewed", async () => {
  const response = await postSkillFiles(
    new NextRequest("http://test/api/skills/demo-skill/files", {
      method: "POST",
      body: JSON.stringify({
        files: [{ path: "resources/replaced.md", fileType: "resource", content: "Replacement" }],
      }),
    }),
    { params: Promise.resolve({ slug: "demo-skill" }) }
  );

  assert.equal(response.status, 405);
});

test("PATCH /api/skills/:slug preserves published files when files are omitted", async () => {
  const originalRawContent = validRawContent;
  const publishedRawContent = originalRawContent;
  const publishedFiles = [{ path: "resources/reference.md", fileType: "resource", content: "Reference" }];
  let updateInput: unknown;
  const { PATCH } = createSkillDetailHandlers({
    getSession: async () => authorSession as never,
    database: {
      async execute(input) {
        const sql = typeof input === "string" ? input : input.sql;
        if (sql.includes("SELECT id, raw_content FROM skills")) {
          return { rows: [{ id: 4, raw_content: publishedRawContent }] };
        }
        if (sql.includes("SELECT path, file_type, content FROM skill_files")) {
          return { rows: [{ path: "resources/reference.md", file_type: "resource", content: "Reference" }] };
        }
        if (sql.includes("SELECT id FROM skill_review_requests")) {
          return { rows: [{ id: 9 }] };
        }
        throw new Error(`Unexpected query: ${sql}`);
      },
    },
    update: async (_id, input) => {
      updateInput = input;
      return reviewRequest({ skillId: 4, rawContent: updatedRawContent });
    },
  });

  const response = await PATCH(
    new NextRequest("http://test/api/skills/demo-skill", {
      method: "PATCH",
      body: JSON.stringify({ rawContent: updatedRawContent }),
    }),
    { params: Promise.resolve({ slug: "demo-skill" }) }
  );

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { slug: "demo-skill", reviewRequestId: 9, status: "pending" });
  assert.deepEqual(updateInput, {
    rawContent: updatedRawContent,
    files: [{ ...publishedFiles[0], changeType: "unchanged" }],
  });
  assert.equal(publishedRawContent, originalRawContent);
});

test("catalog excludes pending review requests", async () => {
  let catalogSql = "";
  const { GET } = createSkillHandlers({
    database: {
      async execute(input) {
        catalogSql = typeof input === "string" ? input : input.sql;
        return { rows: [] };
      },
    },
  });

  const response = await GET(new NextRequest("http://test/api/skills"));

  assert.equal(response.status, 200);
  assert.match(catalogSql, /FROM skills WHERE status = 'published'/);
});

test("detail returns published raw content while a pending version exists", async () => {
  const publishedRawContent = "published skill content";
  const { GET } = createSkillDetailHandlers({
    database: {
      async execute(input) {
        const sql = typeof input === "string" ? input : input.sql;
        assert.match(sql, /FROM skills WHERE slug = \? AND status = 'published'/);
        return {
          rows: [{
            id: 4,
            slug: "demo-skill",
            name: "demo-skill",
            description: "Published skill",
            type: "code",
            version: "1.0.0",
            schema_version: "1.1",
            triggers: "[]",
            tools: "[]",
            compatibility: "[\"claude\"]",
            dependencies: "[]",
            raw_content: publishedRawContent,
            status: "published",
            install_count: 0,
          }],
        };
      },
    },
  });

  const response = await GET(new NextRequest("http://test/api/skills/demo-skill"), { params: Promise.resolve({ slug: "demo-skill" }) });

  assert.equal((await response.json()).rawContent, publishedRawContent);
});

test("download packages only published skill content and files", async () => {
  const queries: string[] = [];
  const { GET } = createSkillDownloadHandlers({
    database: {
      async execute(input) {
        const sql = typeof input === "string" ? input : input.sql;
        queries.push(sql);
        if (sql.includes("FROM skills")) return { rows: [{ id: 4, raw_content: "published skill content" }] };
        return { rows: [{ path: "resources/published.md", file_type: "resource", content: "published file" }] };
      },
    },
  });

  const response = await GET(new NextRequest("http://test/api/skills/demo-skill/download"), { params: Promise.resolve({ slug: "demo-skill" }) });

  assert.equal(response.status, 200);
  assert.match(queries[0], /status = 'published'/);
  assert.match(queries[1], /FROM skill_files WHERE skill_id = \?/);
});

test("install increments only the published skill", async () => {
  const queries: string[] = [];
  const { POST } = createSkillInstallHandlers({
    database: {
      async execute(input) {
        const sql = typeof input === "string" ? input : input.sql;
        queries.push(sql);
        if (sql.startsWith("SELECT")) return { rows: [{ id: 4, install_count: 2 }] };
        return { rows: [] };
      },
    },
  });

  const response = await POST(new NextRequest("http://test/api/skills/demo-skill/install", { method: "POST" }), { params: Promise.resolve({ slug: "demo-skill" }) });

  assert.deepEqual(await response.json(), { slug: "demo-skill", installCount: 3 });
  assert.match(queries[0], /status = 'published'/);
  assert.match(queries[1], /WHERE id = \? AND status = 'published'/);
});

test("versions belong to the published skill only", async () => {
  const queries: string[] = [];
  const { GET } = createSkillVersionHandlers({
    database: {
      async execute(input) {
        const sql = typeof input === "string" ? input : input.sql;
        queries.push(sql);
        if (sql.includes("FROM skills")) return { rows: [{ id: 4 }] };
        return { rows: [{ version: "1.0.0", created_at: 1 }] };
      },
    },
  });

  const response = await GET(new NextRequest("http://test/api/skills/demo-skill/versions"), { params: Promise.resolve({ slug: "demo-skill" }) });

  assert.deepEqual(await response.json(), { versions: [{ version: "1.0.0", createdAt: 1 }] });
  assert.match(queries[0], /status = 'published'/);
});

test("unauthenticated create returns 401", async () => {
  const { POST } = createReviewRequestsHandlers({ getSession: async () => null as never });
  const response = await POST(
    new NextRequest("http://test/api/review-requests", { method: "POST" })
  );

  assert.equal(response.status, 401);
});

test("invalid decision returns 422 without mutating review state", async () => {
  let called = false;
  const { POST } = createReviewDecisionHandlers({
    getSession: async () => reviewerSession as never,
    database,
    decide: async () => {
      called = true;
      return {} as ReviewRequest;
    },
  });

  const response = await POST(
    new NextRequest("http://test/api/review-requests/1/decision", {
      method: "POST",
      body: JSON.stringify({ decision: "anything" }),
    }),
    context
  );

  assert.equal(response.status, 422);
  assert.equal(called, false);
});

test("request changes decision requires a general comment", async () => {
  let called = false;
  const { POST } = createReviewDecisionHandlers({
    getSession: async () => reviewerSession as never,
    database,
    decide: async () => {
      called = true;
      return {} as ReviewRequest;
    },
  });

  const response = await POST(
    new NextRequest("http://test/api/review-requests/1/decision", {
      method: "POST",
      body: JSON.stringify({ decision: "request_changes" }),
    }),
    context
  );

  assert.equal(response.status, 422);
  assert.equal(called, false);
});

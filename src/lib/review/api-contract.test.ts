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

const editorSession = {
  user: {
    id: "editor-1",
    name: "Editor",
    email: "editor@example.test",
    roles: ["editor"],
  },
};

const userSession = {
  user: {
    id: "user-1",
    name: "Fallback User",
    email: "user@example.com",
    roles: ["user"],
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

const relaxedRawContent = `# Draft Skill

This draft intentionally omits strict frontmatter metadata and required body sections.`;

const overLineLimitRawContent = Array.from({ length: 301 }, (_, index) => `line ${index + 1}`).join("\n");
const maxLineLimitWithTerminalNewlineRawContent = `${Array.from({ length: 300 }, (_, index) => `line ${index + 1}`).join("\n")}\n`;

const updatedRawContent = validRawContent.replace("Follow these instructions.", "Follow the updated instructions.");
const higherVersionRawContent = updatedRawContent.replace("version: 1.0.0", "version: 1.1.0");

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
    getSession: async () => editorSession as never,
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
      acceptedResponsibility: true,
    }),
  }));

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { slug: "demo-skill", reviewRequestId: 9, status: "pending" });
  assert.deepEqual(createInput, {
    rawContent: validRawContent,
    files: [{ path: "resources/reference.md", fileType: "resource", content: "Reference" }],
    acceptedResponsibility: true,
  });
  assert.equal(executedSql.some((sql) => sql.includes("INSERT INTO skills")), false);
});

test("POST /api/skills accepts relaxed draft submissions with responsibility consent", async () => {
  let createInput: unknown;
  const { POST } = createSkillHandlers({
    getSession: async () => editorSession as never,
    database,
    create: async (input) => {
      createInput = input;
      return reviewRequest({
        slug: "draft-skill",
        name: "draft-skill",
        description: "Skill enviado a revision sin descripcion validada.",
        rawContent: relaxedRawContent,
      });
    },
  });

  const response = await POST(new NextRequest("http://test/api/skills", {
    method: "POST",
    body: JSON.stringify({
      rawContent: relaxedRawContent,
      files: [],
      acceptedResponsibility: true,
    }),
  }));

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { slug: "draft-skill", reviewRequestId: 9, status: "pending" });
  assert.deepEqual(createInput, {
    rawContent: relaxedRawContent,
    files: [],
    acceptedResponsibility: true,
  });
});

test("POST /api/skills rejects relaxed submissions without responsibility consent", async () => {
  let called = false;
  const { POST } = createSkillHandlers({
    getSession: async () => editorSession as never,
    database,
    create: async () => {
      called = true;
      return reviewRequest();
    },
  });

  const response = await POST(new NextRequest("http://test/api/skills", {
    method: "POST",
    body: JSON.stringify({ rawContent: relaxedRawContent, files: [] }),
  }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Debes aceptar continuar con la publicacion" });
  assert.equal(called, false);
});

test("POST /api/skills rejects submissions over 300 lines", async () => {
  let called = false;
  const { POST } = createSkillHandlers({
    getSession: async () => editorSession as never,
    database,
    create: async () => {
      called = true;
      return reviewRequest();
    },
  });

  const response = await POST(new NextRequest("http://test/api/skills", {
    method: "POST",
    body: JSON.stringify({
      rawContent: overLineLimitRawContent,
      files: [],
      acceptedResponsibility: true,
    }),
  }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Maximo 300 lineas" });
  assert.equal(called, false);
});

test("POST /api/skills accepts 300 content lines with a final newline", async () => {
  let createInput: unknown;
  const { POST } = createSkillHandlers({
    getSession: async () => editorSession as never,
    database,
    create: async (input) => {
      createInput = input;
      return reviewRequest({
        slug: "draft-skill",
        name: "draft-skill",
        rawContent: maxLineLimitWithTerminalNewlineRawContent,
      });
    },
  });

  const response = await POST(new NextRequest("http://test/api/skills", {
    method: "POST",
    body: JSON.stringify({
      rawContent: maxLineLimitWithTerminalNewlineRawContent,
      files: [],
      acceptedResponsibility: true,
    }),
  }));

  assert.equal(response.status, 201);
  assert.deepEqual(createInput, {
    rawContent: maxLineLimitWithTerminalNewlineRawContent,
    files: [],
    acceptedResponsibility: true,
  });
});

test("POST /api/skills/:slug/files is disabled while files are reviewed", async () => {
  const response = await postSkillFiles();

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

test("PATCH /api/skills/:slug creates a review request without requiring responsibility consent in the payload", async () => {
  const publishedRawContent = validRawContent;
  const publishedFiles = [{ path: "resources/reference.md", fileType: "resource", content: "Reference" }];
  let createInput: unknown;
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
          return { rows: [] };
        }
        throw new Error(`Unexpected query: ${sql}`);
      },
    },
    create: async (input) => {
      createInput = input;
      return reviewRequest({ id: 10, skillId: 4, rawContent: updatedRawContent });
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
  assert.deepEqual(await response.json(), { slug: "demo-skill", reviewRequestId: 10, status: "pending" });
  assert.deepEqual(createInput, {
    rawContent: updatedRawContent,
    files: [{ ...publishedFiles[0], changeType: "unchanged" }],
    skillId: 4,
    acceptedResponsibility: true,
  });
});

test("PATCH /api/skills/:slug allows an author to create an existing-skill review request", async () => {
  let insertedReviewRequest: Record<string, unknown> | undefined;
  const publishedFiles = [{ path: "resources/reference.md", fileType: "resource", content: "Reference" }];
  const { PATCH } = createSkillDetailHandlers({
    getSession: async () => authorSession as never,
    database: {
      async execute(input) {
        const sql = typeof input === "string" ? input : input.sql;
        const args = typeof input === "string" ? [] : input.args ?? [];
        if (sql.includes("SELECT id, raw_content FROM skills")) {
          return { rows: [{ id: 4, raw_content: validRawContent }] };
        }
        if (sql.includes("SELECT path, file_type, content FROM skill_files")) {
          return { rows: publishedFiles.map((file) => ({ path: file.path, file_type: file.fileType, content: file.content })) };
        }
        if (sql.includes("SELECT id FROM skill_review_requests") && sql.includes("skill_id = ?")) {
          return { rows: [] };
        }
        if (sql.includes("SELECT version FROM skills WHERE id = ?")) {
          return { rows: [{ version: "1.0.0" }] };
        }
        if (sql.includes("SELECT id FROM skill_review_requests") && sql.includes("slug = ?")) {
          return { rows: [] };
        }
        if (sql.includes("INSERT INTO skill_review_requests")) {
          insertedReviewRequest = {
            skillId: args[0],
            slug: args[1],
            authorId: args[7],
          };
          return { rows: [] };
        }
        if (sql.includes("SELECT * FROM skill_review_requests") && sql.includes("ORDER BY id DESC")) {
          return { rows: [reviewRequest({ id: 12, skillId: 4, version: "1.1.0", rawContent: higherVersionRawContent })] };
        }
        if (sql.includes("DELETE FROM skill_review_files")) {
          return { rows: [] };
        }
        if (sql.includes("INSERT INTO skill_review_files")) {
          return { rows: [] };
        }
        throw new Error(`Unexpected query: ${sql}`);
      },
    },
  });

  const response = await PATCH(
    new NextRequest("http://test/api/skills/demo-skill", {
      method: "PATCH",
      body: JSON.stringify({ rawContent: higherVersionRawContent }),
    }),
    { params: Promise.resolve({ slug: "demo-skill" }) }
  );

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { slug: "demo-skill", reviewRequestId: 12, status: "pending" });
  assert.deepEqual(insertedReviewRequest, {
    skillId: 4,
    slug: "demo-skill",
    authorId: "author-1",
  });
});

test("catalog excludes pending review requests", async () => {
  let catalogSql = "";
  const { GET } = createSkillHandlers({
    getSession: async () => null,
    database: {
      async execute(input) {
        catalogSql = typeof input === "string" ? input : input.sql;
        return { rows: [] };
      },
    },
  });

  const response = await GET(new NextRequest("http://test/api/skills"));

  assert.equal(response.status, 200);
  assert.match(catalogSql, /FROM skills s/);
  assert.match(catalogSql, /s\.status = 'published'/);
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

test("user role receives 403 before creating a skill review request", async () => {
  let createCalled = false;
  const { POST } = createSkillHandlers({
    getSession: async () => userSession as never,
    create: async () => {
      createCalled = true;
      throw new Error("must not run");
    },
  });

  const response = await POST(new NextRequest("http://localhost/api/skills", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      rawContent: validRawContent,
      files: [],
      acceptedResponsibility: true,
    }),
  }));

  assert.equal(response.status, 403);
  assert.equal(createCalled, false);
});

test("author role receives 403 before creating a new skill review request", async () => {
  let createCalled = false;
  const { POST } = createSkillHandlers({
    getSession: async () => authorSession as never,
    create: async () => {
      createCalled = true;
      throw new Error("must not run");
    },
  });

  const response = await POST(new NextRequest("http://localhost/api/skills", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      rawContent: validRawContent,
      files: [],
      acceptedResponsibility: true,
    }),
  }));

  assert.equal(response.status, 403);
  assert.equal(createCalled, false);
});

test("user role receives 403 before entering review request APIs", async () => {
  let listCalled = false;
  const { GET } = createReviewRequestsHandlers({
    getSession: async () => userSession as never,
    list: async () => {
      listCalled = true;
      throw new Error("must not run");
    },
  });

  const response = await GET(
    new NextRequest("http://localhost/api/review-requests")
  );

  assert.equal(response.status, 403);
  assert.equal(listCalled, false);
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

test("POST /api/review-requests/[id]/decision allows admin session", async () => {
  const adminSession = {
    user: {
      id: "admin-1",
      name: "Admin",
      email: "admin@test.com",
      roles: ["admin"],
    },
  };

  const { POST } = createReviewDecisionHandlers({
    getSession: async () => adminSession as never,
    database,
    decide: async (id, _input, actor) => {
      assert.equal(actor.id, "admin-1");
      assert.deepEqual(actor.roles, ["admin"]);
      return reviewRequest({ id, status: "approved", reviewerId: actor.id });
    },
  });

  const response = await POST(
    new NextRequest("http://localhost/api/review-requests/9/decision", {
      method: "POST",
      body: JSON.stringify({ decision: "approve", comment: "Approved by admin" }),
    }),
    { params: Promise.resolve({ id: "9" }) }
  );

  assert.equal(response.status, 200);
  const json = await response.json();
  assert.equal(json.request.status, "approved");
});

test("GET /api/review-requests returns requests and counts", async () => {
  let listQuery: unknown;
  let countsOptions: unknown;
  const dummyCounts = { all: 5, pending: 2, changes_requested: 1, approved: 1, rejected: 1 };
  const dummyRequests = [reviewRequest()];

  const { GET } = createReviewRequestsHandlers({
    getSession: async () => reviewerSession as never,
    database,
    list: async (query) => {
      listQuery = query;
      return dummyRequests;
    },
    getCounts: async (_actor, options) => {
      countsOptions = options;
      return dummyCounts;
    },
  });

  const response = await GET(new NextRequest("http://test/api/review-requests?status=pending&mine=true"));

  assert.equal(response.status, 200);
  const json = await response.json();
  assert.deepEqual(json, { requests: dummyRequests, counts: dummyCounts });
  assert.deepEqual(listQuery, { mine: true, status: "pending" });
  assert.deepEqual(countsOptions, { mine: true });
});

test("GET /api/review-requests allows status=all", async () => {
  let listQuery: unknown;
  const { GET } = createReviewRequestsHandlers({
    getSession: async () => reviewerSession as never,
    database,
    list: async (query) => {
      listQuery = query;
      return [];
    },
    getCounts: async () => ({ all: 0, pending: 0, changes_requested: 0, approved: 0, rejected: 0 }),
  });

  const response = await GET(new NextRequest("http://test/api/review-requests?status=all"));

  assert.equal(response.status, 200);
  assert.deepEqual(listQuery, { mine: false, status: "all" });
});

test("GET /api/review-requests returns 422 for invalid status parameter", async () => {
  const { GET } = createReviewRequestsHandlers({
    getSession: async () => reviewerSession as never,
  });

  const response = await GET(new NextRequest("http://test/api/review-requests?status=invalid_status"));

  assert.equal(response.status, 422);
});

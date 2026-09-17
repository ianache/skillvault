import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import { NextRequest } from "next/server";
import { createRetireHandlers } from "../../app/api/skills/[slug]/retire/route";
import { client } from "../db";

describe("API POST /api/skills/[slug]/retire", () => {
  beforeEach(async () => {
    await client.execute(`
      INSERT INTO skills (id, name, slug, description, type, version, status, install_count, created_at)
      VALUES (9998, 'Test Skill', 'test-skill-retire', 'Description', 'code', '1.0.0', 'published', 0, 1234567)
      ON CONFLICT(id) DO UPDATE SET status='published';
    `);
  });

  afterEach(async () => {
    await client.execute("DELETE FROM skills WHERE id = 9998");
  });

  it("requires authenticated user session with reviewer, editor, or admin roles", async () => {
    const { POST } = createRetireHandlers({
      getSession: async () => null,
    });

    const req = new NextRequest("http://localhost/api/skills/test-skill-retire/retire", { method: "POST" });
    const response = await POST(req, { params: Promise.resolve({ slug: "test-skill-retire" }) });
    assert.equal(response.status, 401);
  });

  it("denies access to users without editor, reviewer, or admin roles", async () => {
    const { POST } = createRetireHandlers({
      getSession: async () => ({ user: { id: "user-123", roles: ["user"] } }),
    });

    const req = new NextRequest("http://localhost/api/skills/test-skill-retire/retire", { method: "POST" });
    const response = await POST(req, { params: Promise.resolve({ slug: "test-skill-retire" }) });
    assert.equal(response.status, 401);
  });

  it("allows access for admin role and sets status to retired", async () => {
    const { POST } = createRetireHandlers({
      getSession: async () => ({ user: { id: "admin-123", roles: ["admin"] } }),
    });

    const req = new NextRequest("http://localhost/api/skills/test-skill-retire/retire", { method: "POST" });
    const response = await POST(req, { params: Promise.resolve({ slug: "test-skill-retire" }) });
    assert.equal(response.status, 200);

    const json = await response.json();
    assert.deepEqual(json, { success: true });

    const result = await client.execute({
      sql: "SELECT status FROM skills WHERE slug = ? LIMIT 1",
      args: ["test-skill-retire"],
    });
    assert.equal(result.rows[0].status, "retired");
  });

  it("returns 404 when the skill does not exist or is not published", async () => {
    const { POST } = createRetireHandlers({
      getSession: async () => ({ user: { id: "admin-123", roles: ["admin"] } }),
    });

    const req = new NextRequest("http://localhost/api/skills/does-not-exist/retire", { method: "POST" });
    const response = await POST(req, { params: Promise.resolve({ slug: "does-not-exist" }) });
    assert.equal(response.status, 404);
  });
});

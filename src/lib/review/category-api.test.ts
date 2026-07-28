import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import { NextRequest } from "next/server";
import { createCategoryHandlers } from "../../app/api/skills/[slug]/category/route";
import { client } from "../db";

describe("API PUT /api/skills/[slug]/category", () => {
  beforeEach(async () => {
    // Insert test category
    await client.execute(`
      INSERT INTO categories (id, slug, label)
      VALUES (9999, 'docs', 'Documentation')
      ON CONFLICT(slug) DO UPDATE SET label='Documentation';
    `);
    
    // Insert test skill
    await client.execute(`
      INSERT INTO skills (id, name, slug, description, type, version, status, install_count, created_at)
      VALUES (9999, 'Test Skill', 'test-skill-category-edit', 'Description', 'code', '1.0.0', 'published', 0, 1234567)
      ON CONFLICT(id) DO UPDATE SET type='code', status='published';
    `);
  });

  afterEach(async () => {
    await client.execute("DELETE FROM skills WHERE id = 9999");
    await client.execute("DELETE FROM categories WHERE id = 9999");
  });

  it("requires authenticated user session with reviewer, editor, or admin roles", async () => {
    const { PUT } = createCategoryHandlers({
      getSession: async () => null, // unauthenticated
    });

    const req = new NextRequest("http://localhost/api/skills/test-skill-category-edit/category", {
      method: "PUT",
      body: JSON.stringify({ type: "docs" }),
    });

    const response = await PUT(req, { params: Promise.resolve({ slug: "test-skill-category-edit" }) });
    assert.equal(response.status, 401);
  });

  it("denies access to users without editor, reviewer, or admin roles", async () => {
    const { PUT } = createCategoryHandlers({
      getSession: async () => ({
        user: { id: "user-123", roles: ["user"] },
      }),
    });

    const req = new NextRequest("http://localhost/api/skills/test-skill-category-edit/category", {
      method: "PUT",
      body: JSON.stringify({ type: "docs" }),
    });

    const response = await PUT(req, { params: Promise.resolve({ slug: "test-skill-category-edit" }) });
    assert.equal(response.status, 401);
  });

  it("allows access for reviewer role and successfully updates a valid category type", async () => {
    const { PUT } = createCategoryHandlers({
      getSession: async () => ({
        user: { id: "reviewer-123", roles: ["reviewer"] },
      }),
    });

    const req = new NextRequest("http://localhost/api/skills/test-skill-category-edit/category", {
      method: "PUT",
      body: JSON.stringify({ type: "docs" }),
    });

    const response = await PUT(req, { params: Promise.resolve({ slug: "test-skill-category-edit" }) });
    assert.equal(response.status, 200);

    const json = await response.json();
    assert.deepEqual(json, { success: true, type: "docs" });

    // Verify the DB was actually updated
    const result = await client.execute({
      sql: "SELECT type FROM skills WHERE slug = ? LIMIT 1",
      args: ["test-skill-category-edit"],
    });
    assert.equal(result.rows[0].type, "docs");
  });

  it("returns 400 if the category type parameter is missing or invalid", async () => {
    const { PUT } = createCategoryHandlers({
      getSession: async () => ({
        user: { id: "admin-123", roles: ["admin"] },
      }),
    });

    const req = new NextRequest("http://localhost/api/skills/test-skill-category-edit/category", {
      method: "PUT",
      body: JSON.stringify({}),
    });

    const response = await PUT(req, { params: Promise.resolve({ slug: "test-skill-category-edit" }) });
    assert.equal(response.status, 400);
    const json = await response.json();
    assert.equal(json.error, "Tipo de categoría inválido o ausente");
  });

  it("returns 400 if the specified category type does not exist in categories table", async () => {
    const { PUT } = createCategoryHandlers({
      getSession: async () => ({
        user: { id: "editor-123", roles: ["editor"] },
      }),
    });

    const req = new NextRequest("http://localhost/api/skills/test-skill-category-edit/category", {
      method: "PUT",
      body: JSON.stringify({ type: "non-existent-category" }),
    });

    const response = await PUT(req, { params: Promise.resolve({ slug: "test-skill-category-edit" }) });
    assert.equal(response.status, 400);
    const json = await response.json();
    assert.equal(json.error, "La categoría especificada no existe");
  });
});

import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ensureUser, listUsers } from "../users/service";
import { client } from "../db";

describe("User and Role Synchronization (ensureUser)", () => {
  beforeEach(async () => {
    // Only delete test users to avoid wiping developer's local seed database records
    await client.execute("DELETE FROM users WHERE id LIKE 'usr-test-%';");
    await client.execute("DELETE FROM skills WHERE slug LIKE 'skill-test-%';");
    await client.execute("DELETE FROM skill_review_requests WHERE slug LIKE 'skill-test-%';");
  });

  test("inserts new user with their roles correctly", async () => {
    await ensureUser({
      id: "usr-test-1",
      username: "testuser",
      email: "test@skillvault.dev",
      keycloakRoles: ["author"],
    });

    const users = await listUsers();
    const created = users.find(u => u.id === "usr-test-1");
    
    assert.ok(created);
    assert.strictEqual(created.username, "testuser");
    assert.strictEqual(created.email, "test@skillvault.dev");
    assert.deepEqual(created.roles, ["author"]);
  });

  test("updates roles of an existing user when they log in with new roles", async () => {
    // Registrar usuario inicialmente como 'author'
    await ensureUser({
      id: "usr-test-2",
      username: "rmedina",
      email: "rmedina@skillvault.dev",
      keycloakRoles: ["author"],
    });

    // Simular login con un nuevo set de roles ('author' y 'admin')
    await ensureUser({
      id: "usr-test-2",
      username: "rmedina",
      email: "rmedina@skillvault.dev",
      keycloakRoles: ["author", "admin"],
    });

    const users = await listUsers();
    const updated = users.find(u => u.id === "usr-test-2");

    assert.ok(updated);
    assert.deepEqual(updated.roles.sort(), ["admin", "author"]);
  });

  test("removes roles of an existing user when they lose roles in Keycloak", async () => {
    // Registrar usuario con 'admin' y 'reviewer'
    await ensureUser({
      id: "usr-test-3",
      username: "user3",
      email: "user3@skillvault.dev",
      keycloakRoles: ["admin", "reviewer"],
    });

    // Simular login habiendo perdido el rol 'admin'
    await ensureUser({
      id: "usr-test-3",
      username: "user3",
      email: "user3@skillvault.dev",
      keycloakRoles: ["reviewer"],
    });

    const users = await listUsers();
    const updated = users.find(u => u.id === "usr-test-3");

    assert.ok(updated);
    assert.deepEqual(updated.roles, ["reviewer"]);
  });

  test("filters out roles not present in APP_ROLES", async () => {
    await ensureUser({
      id: "usr-test-4",
      username: "externaluser",
      email: "external@skillvault.dev",
      keycloakRoles: ["author", "invalid-role", "admin", "other-realm-role"],
    });

    const users = await listUsers();
    const created = users.find(u => u.id === "usr-test-4");

    assert.ok(created);
    assert.deepEqual(created.roles.sort(), ["admin", "author"]);
  });

  test("persists the user fallback role instead of filtering it out", async () => {
    await ensureUser({
      id: "usr-test-fallback",
      username: "fallbackuser",
      email: "fallback@skillvault.dev",
      keycloakRoles: ["user"],
    });

    const users = await listUsers();
    const created = users.find(u => u.id === "usr-test-fallback");

    assert.ok(created);
    assert.deepEqual(created.roles, ["user"]);
  });

  test("propagates author_id updates to skills and skill_review_requests when Keycloak ID changes", async () => {
    // 1. Registrar usuario inicial con id antiguo
    await ensureUser({
      id: "usr-test-old",
      username: "testuser",
      email: "test@skillvault.dev",
      keycloakRoles: ["author"],
    });

    // 2. Insertar registros asociados a ese id antiguo
    await client.execute({
      sql: "INSERT INTO skills (slug, name, description, type, author_id) VALUES (?, ?, ?, ?, ?)",
      args: ["skill-test-1", "Test Skill", "Test Desc", "code", "usr-test-old"],
    });

    await client.execute({
      sql: "INSERT INTO skill_review_requests (slug, name, description, type, version, author_id, raw_content) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: ["skill-test-req-1", "Test Req", "Test Req", "code", "1.0.0", "usr-test-old", "some raw content"],
    });

    // 3. Simular login con un nuevo ID de Keycloak para el mismo usuario (mismo username/email)
    await ensureUser({
      id: "usr-test-new",
      username: "testuser",
      email: "test@skillvault.dev",
      keycloakRoles: ["author"],
    });

    // 4. Verificar que el usuario tiene el nuevo ID
    const users = await listUsers();
    const updatedUser = users.find(u => u.username === "testuser");
    assert.ok(updatedUser);
    assert.strictEqual(updatedUser.id, "usr-test-new");

    // 5. Verificar que los registros en skills y skill_review_requests se actualizaron
    const skillRes = await client.execute({
      sql: "SELECT author_id FROM skills WHERE slug = ?",
      args: ["skill-test-1"],
    });
    assert.strictEqual(skillRes.rows[0]?.author_id, "usr-test-new");

    const reqRes = await client.execute({
      sql: "SELECT author_id FROM skill_review_requests WHERE slug = ?",
      args: ["skill-test-req-1"],
    });
    assert.strictEqual(reqRes.rows[0]?.author_id, "usr-test-new");
  });

  test("propagates author_id updates and deletes duplicate users safely without data loss", async () => {
    // 1. Registrar dos usuarios con el mismo username/email para simular duplicados
    await client.execute({
      sql: `INSERT INTO users (id, username, full_name, email, roles, last_login_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ["usr-test-dup1", "dupuser", "dupuser", "dup@skillvault.dev", "[]", 100, 100, 100],
    });
    await client.execute({
      sql: `INSERT INTO users (id, username, full_name, email, roles, last_login_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: ["usr-test-dup2", "dupuser", "dupuser", "dup@skillvault.dev", "[]", 50, 50, 50],
    });

    // 2. Asociar un skill al usuario duplicado secundario (usr-test-dup2) que será eliminado
    await client.execute({
      sql: "INSERT INTO skills (slug, name, description, type, author_id) VALUES (?, ?, ?, ?, ?)",
      args: ["skill-test-dup", "Dup Skill", "Dup Desc", "code", "usr-test-dup2"],
    });

    // 3. Iniciar sesión con un nuevo ID de Keycloak
    await ensureUser({
      id: "usr-test-dup-new",
      username: "dupuser",
      email: "dup@skillvault.dev",
      keycloakRoles: ["author"],
    });

    // 4. Verificar que se eliminaron los registros duplicados de users
    const users = await listUsers();
    const dup1 = users.find(u => u.id === "usr-test-dup1");
    const dup2 = users.find(u => u.id === "usr-test-dup2");
    assert.strictEqual(dup1, undefined);
    assert.strictEqual(dup2, undefined);

    // 5. Verificar que el usuario activo tiene el ID nuevo
    const active = users.find(u => u.username === "dupuser");
    assert.ok(active);
    assert.strictEqual(active.id, "usr-test-dup-new");

    // 6. Verificar que el skill del usuario eliminado se actualizó al nuevo ID
    const skillRes = await client.execute({
      sql: "SELECT author_id FROM skills WHERE slug = ?",
      args: ["skill-test-dup"],
    });
    assert.strictEqual(skillRes.rows[0]?.author_id, "usr-test-dup-new");
  });
});

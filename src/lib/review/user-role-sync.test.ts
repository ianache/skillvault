import test, { describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { ensureUser, listUsers } from "../users/service";
import { client } from "../db";

describe("User and Role Synchronization (ensureUser)", () => {
  beforeEach(async () => {
    // Only delete test users to avoid wiping developer's local seed database records
    await client.execute("DELETE FROM users WHERE id LIKE 'usr-test-%';");
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
});

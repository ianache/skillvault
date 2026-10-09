import assert from "node:assert/strict";
import test from "node:test";
import { migratePackages } from "./package-migration";

function fakeClient() {
  const statements: string[] = [];
  return {
    statements,
    execute: async (input: string | { sql: string; args?: unknown[] }) => {
      statements.push(typeof input === "string" ? input : input.sql);
      return { rows: [] };
    },
  };
}

test("migratePackages creates package, install, audit and rate-limit tables", async () => {
  const db = fakeClient();

  await migratePackages(db);

  for (const table of [
    "packages",
    "package_versions",
    "package_items",
    "package_install_runs",
    "package_install_items",
    "package_download_audit",
    "package_download_rate_limits",
    "package_download_rate_limit_config",
  ]) {
    assert.ok(db.statements.some((sql) => sql.includes(`CREATE TABLE IF NOT EXISTS ${table}`)), table);
  }
});

test("migratePackages creates the package invariants indexes", async () => {
  const db = fakeClient();

  await migratePackages(db);

  assert.ok(db.statements.some((sql) => sql.includes("idx_package_versions_package_version")));
  assert.ok(db.statements.some((sql) => sql.includes("idx_package_items_version_position")));
  assert.ok(db.statements.some((sql) => sql.includes("idx_package_download_rate_limits_key")));
});

test("migratePackages emits MySQL-compatible statements", async () => {
  const db = fakeClient();

  await migratePackages(db, "mysql");

  assert.ok(db.statements.every((sql) => !sql.includes("AUTOINCREMENT")));
  assert.ok(db.statements.every((sql) => !sql.includes("INSERT OR IGNORE")));
  assert.ok(db.statements.some((sql) => sql.includes("INSERT IGNORE INTO package_download_rate_limit_config")));
});

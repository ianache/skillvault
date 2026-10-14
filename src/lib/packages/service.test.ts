import assert from "node:assert/strict";
import test from "node:test";
import { createPackage, createPackageVersion, duplicatePackage, getDraftPackageVersion, getLatestPackageVersion, getPublishedManifest, retirePackage, updatePackage } from "./service";

function fakeClient(rowsBySql: Record<string, Record<string, unknown>[]> = {}) {
  const calls: Array<{ sql: string; args?: unknown[] }> = [];
  return {
    calls,
    execute: async (input: string | { sql: string; args?: unknown[] }) => {
      const sql = typeof input === "string" ? input : input.sql;
      const args = typeof input === "string" ? undefined : input.args;
      calls.push({ sql, args });
      const key = Object.keys(rowsBySql).find((candidate) => sql.includes(candidate));
      return { rows: key ? rowsBySql[key] : [] };
    },
  };
}

test("createPackage validates and persists a draft package", async () => {
  const db = fakeClient({ "SELECT * FROM packages WHERE slug": [{ id: 4, slug: "analista-funcional", name: "Analista", description: "Skills", role: "analista", status: "draft", current_version: null }] });
  const result = await createPackage({ slug: "analista-funcional", name: "Analista", description: "Skills", role: "analista" }, { id: "u1" }, db);
  assert.equal(result.slug, "analista-funcional");
  assert.ok(db.calls.some((call) => call.sql.includes("INSERT INTO packages")));
});

test("createPackageVersion creates a snapshot from published skills", async () => {
  const db = fakeClient({
    "SELECT * FROM packages WHERE slug": [{ id: 4, slug: "analista-funcional", name: "Analista", description: "Skills", role: "analista", status: "draft" }],
    "SELECT * FROM skills WHERE id": [{ id: 8, slug: "skill-a", name: "Skill A", version: "2.0.0", status: "published", raw_content: "---\nname: skill-a\n---\n" }],
    "SELECT id FROM package_versions": [],
  });
  const result = await createPackageVersion("analista-funcional", { version: "1.0.0", items: [{ skillId: 8, versionPolicy: "pinned", pinnedVersion: "2.0.0", position: 0 }] }, { id: "u1" }, db);
  assert.equal(result.version, "1.0.0");
  assert.equal(result.items[0].slug, "skill-a");
  assert.ok(db.calls.some((call) => call.sql.includes("INSERT INTO package_versions")));
});

test("createPackageVersion updates an existing draft snapshot instead of inserting a duplicate", async () => {
  const calls: Array<{ sql: string; args?: unknown[] }> = [];
  const db = {
    calls,
    execute: async (input: string | { sql: string; args?: unknown[] }) => {
      const sql = typeof input === "string" ? input : input.sql;
      const args = typeof input === "string" ? undefined : input.args;
      calls.push({ sql, args });
      if (sql.includes("SELECT * FROM packages WHERE slug")) {
        return { rows: [{ id: 4, slug: "analista-funcional", name: "Analista", description: "Skills", role: "analista", status: "draft" }] };
      }
      if (sql.includes("SELECT id, release_status FROM package_versions")) return { rows: [{ id: 12, release_status: "draft" }] };
      if (sql.includes("SELECT * FROM skills WHERE id")) return { rows: [{ id: 8, slug: "skill-a", name: "Skill A", version: "2.0.0", status: "published", raw_content: "---\nname: skill-a\n---\n" }] };
      if (sql.includes("SELECT id FROM package_versions")) return { rows: [{ id: 12 }] };
      return { rows: [] };
    },
  };

  await createPackageVersion("analista-funcional", { version: "1.0.0", items: [{ skillId: 8, versionPolicy: "pinned", pinnedVersion: "2.0.0", position: 0 }] }, { id: "u1" }, db);

  assert.ok(calls.some((call) => call.sql.includes("DELETE FROM package_items WHERE package_version_id = ?")));
  assert.ok(!calls.some((call) => call.sql.includes("INSERT INTO package_versions")));
});

test("getDraftPackageVersion loads the skills already included in the package", async () => {
  const db = fakeClient({
    "SELECT pv.id": [{ id: 12, version: "1.0.0", release_status: "draft" }],
    "SELECT skill_id": [
      { skill_id: 8, version_policy: "pinned", pinned_version: "2.0.0", position: 0 },
      { skill_id: 9, version_policy: "latest", pinned_version: null, position: 1 },
    ],
  });
  const draft = await getDraftPackageVersion("analista-funcional", db);
  assert.deepEqual(draft, {
    version: "1.0.0",
    releaseStatus: "draft",
    items: [
      { skillId: 8, versionPolicy: "pinned", pinnedVersion: "2.0.0", position: 0 },
      { skillId: 9, versionPolicy: "latest", position: 1 },
    ],
  });
});

test("getLatestPackageVersion loads included skills from a published package for editing", async () => {
  const db = fakeClient({
    "SELECT pv.id": [{ id: 12, version: "1.0.0", release_status: "published" }],
    "SELECT skill_id": [{ skill_id: 8, version_policy: "latest", pinned_version: null, position: 0 }],
  });
  const latest = await getLatestPackageVersion("qa-package-foundation", db);
  assert.deepEqual(latest, {
    version: "1.0.0",
    releaseStatus: "published",
    items: [{ skillId: 8, versionPolicy: "latest", position: 0 }],
  });
});

test("getPublishedManifest refuses an unpublished package version", async () => {
  const db = fakeClient({ "SELECT p.*, pv.*": [{ slug: "analista-funcional", version: "1.0.0", release_status: "draft" }] });
  await assert.rejects(() => getPublishedManifest("analista-funcional", undefined, db), /published/i);
});

test("getPublishedManifest refuses a retired package even when its version is published", async () => {
  const db = fakeClient({ "SELECT p.*, pv.*": [{ slug: "analista-funcional", status: "retired", version: "1.0.0", release_status: "published", manifest_json: JSON.stringify({ package: "analista-funcional", version: "1.0.0", generatedAt: "2026-01-01", items: [], excludedItems: [] }) }] });
  await assert.rejects(() => getPublishedManifest("analista-funcional", undefined, db), /published package/i);
});

test("updatePackage changes only draft metadata", async () => {
  const db = fakeClient({ "SELECT * FROM packages WHERE slug": [{ id: 4, slug: "analista-funcional", name: "Analista", description: "Skills", role: "analista", status: "draft" }] });
  const result = await updatePackage("analista-funcional", { name: "Analista actualizado" }, { id: "u1" }, db);
  assert.equal(result.name, "Analista");
  const updateCall = db.calls.find((call) => call.sql.includes("UPDATE packages SET"));
  assert.ok(updateCall);
  assert.ok(!updateCall.sql.includes("unixepoch()"));
  assert.equal(typeof updateCall.args?.[3], "number");
});

test("retirePackage changes a published package to retired", async () => {
  const db = fakeClient({ "SELECT * FROM packages WHERE slug": [{ id: 4, slug: "analista-funcional", name: "Analista", description: "Skills", role: "analista", status: "published" }] });
  await retirePackage("analista-funcional", { id: "u1" }, db);
  assert.ok(db.calls.some((call) => call.sql.includes("UPDATE packages SET status = 'retired'")));
});

test("duplicatePackage creates a new draft with a unique slug", async () => {
  const db = fakeClient({ "SELECT * FROM packages WHERE slug": [{ id: 4, slug: "qa-starter", name: "QA Starter", description: "QA", role: "QA", status: "published" }] });
  const result = await duplicatePackage("qa-starter", { id: "u1" }, db);
  assert.equal(result.slug, "qa-starter-copy");
  assert.equal(result.status, "draft");
  assert.ok(db.calls.some((call) => call.sql.includes("INSERT INTO packages")));
});

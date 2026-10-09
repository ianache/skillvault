import assert from "node:assert/strict";
import test from "node:test";
import { serializePackageJson, serializePackageZip } from "./serializer";

const manifest = {
  package: "analista-funcional",
  version: "1.0.0",
  generatedAt: "2026-10-08T00:00:00Z",
  items: [{ slug: "skill-a", versionPolicy: "pinned" as const, version: "2.0.0", rawContent: "---\nname: skill-a\n---\n" }],
  excludedItems: [{ slug: "skill-retirado", reason: "retired" }],
};

test("serializePackageJson returns canonical manifest JSON", () => {
  const body = serializePackageJson(manifest);
  assert.deepEqual(JSON.parse(body), manifest);
});

test("serializePackageZip contains manifest and one archive per installable skill", async () => {
  const archive = await serializePackageZip(manifest);
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(archive);
  assert.ok(zip.file("manifest.json"));
  assert.ok(zip.file("skills/skill-a.zip"));
  assert.equal(zip.file("skills/skill-retirado.zip"), null);
});

import assert from "node:assert/strict";
import test from "node:test";
import { validatePackageItem, validatePackageSlug, validatePublishedManifest } from "./validation";

test("validatePackageItem requires pinned version for pinned policy", () => {
  assert.throws(() => validatePackageItem({ slug: "skill-a", versionPolicy: "pinned" }), /pinned version/i);
  assert.doesNotThrow(() => validatePackageItem({ slug: "skill-a", versionPolicy: "pinned", version: "1.2.0" }));
  assert.doesNotThrow(() => validatePackageItem({ slug: "skill-a", versionPolicy: "latest" }));
});

test("validatePackageSlug rejects path traversal and unsupported names", () => {
  assert.doesNotThrow(() => validatePackageSlug("analista-funcional"));
  assert.throws(() => validatePackageSlug("../private"));
  assert.throws(() => validatePackageSlug("Bad Name"));
});

test("validatePublishedManifest excludes retired items from installable items", () => {
  const manifest = validatePublishedManifest({
    package: "analista-funcional",
    version: "1.0.0",
    generatedAt: "2026-10-08T00:00:00Z",
    items: [{ slug: "skill-a", versionPolicy: "latest" }],
    excludedItems: [{ slug: "skill-retirado", reason: "retired" }],
  });
  assert.equal(manifest.items.length, 1);
  assert.equal(manifest.excludedItems[0].reason, "retired");
});

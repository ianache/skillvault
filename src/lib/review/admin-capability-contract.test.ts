import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const root = process.cwd();
const files = [
  "src/app/api/categories/route.ts",
  "src/app/api/categories/[slug]/route.ts",
  "src/app/api/users/route.ts",
  "src/app/api/users/[id]/roles/route.ts",
  "src/app/users/page.tsx",
];

test("admin surfaces use the central admin capability", () => {
  for (const file of files) {
    const source = readFileSync(join(root, file), "utf8");
    assert.match(source, /hasCapability/);
    assert.match(source, /admin:manage/);
    assert.doesNotMatch(source, /roles\??\.includes\("admin"\)/);
  }
});

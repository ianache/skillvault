import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { installPackage } from "../src/commands/package-install.js";

async function exists(path) { return stat(path).then(() => true).catch(() => false); }

test("package install writes every compatible skill independently", async () => {
  const root = await mkdtemp(join(tmpdir(), "skillvault-package-"));
  const previous = process.env.CODEX_HOME;
  process.env.CODEX_HOME = root;
  globalThis.fetch = async () => Response.json({
    package: "analista-funcional", version: "1.0.0", generatedAt: "2026-10-08T00:00:00Z",
    items: [
      { slug: "skill-a", versionPolicy: "pinned", version: "1.0.0", rawContent: "# A\n" },
      { slug: "skill-b", versionPolicy: "latest", rawContent: "# B\n" },
    ], excludedItems: [],
  });
  try {
    await installPackage("analista-funcional", { format: "json", version: "latest", harness: "codex", scope: "global", server: "http://test", confirm: async () => true });
    assert.equal(await readFile(join(root, "skills", "skill-a", "SKILL.md"), "utf8"), "# A\n");
    assert.equal(await readFile(join(root, "skills", "skill-b", "SKILL.md"), "utf8"), "# B\n");
  } finally { if (previous === undefined) delete process.env.CODEX_HOME; else process.env.CODEX_HOME = previous; }
});

test("package install rolls back files when a later skill fails", async () => {
  const root = await mkdtemp(join(tmpdir(), "skillvault-package-rollback-"));
  const previous = process.env.CODEX_HOME;
  process.env.CODEX_HOME = root;
  globalThis.fetch = async () => Response.json({ package: "p", version: "1.0.0", generatedAt: "2026-10-08T00:00:00Z", items: [{ slug: "skill-a", versionPolicy: "latest", rawContent: "# A\n" }, { slug: "../bad", versionPolicy: "latest", rawContent: "# bad\n" }], excludedItems: [] });
  try {
    await assert.rejects(() => installPackage("p", { format: "json", version: "latest", harness: "codex", scope: "global", server: "http://test", confirm: async () => true }), /invalid|unsupported|single path|rollback/i);
    assert.equal(await exists(join(root, "skills", "skill-a", "SKILL.md")), false);
  } finally { if (previous === undefined) delete process.env.CODEX_HOME; else process.env.CODEX_HOME = previous; }
});

test("package install reports incompatible and retired skills as skipped", async () => {
  const root = await mkdtemp(join(tmpdir(), "skillvault-package-skip-"));
  const previous = process.env.CODEX_HOME;
  process.env.CODEX_HOME = root;
  globalThis.fetch = async () => Response.json({ package: "p", version: "1.0.0", generatedAt: "2026-10-08T00:00:00Z", items: [{ slug: "skill-a", versionPolicy: "latest", compatibility: ["claude"], rawContent: "# A\n" }], excludedItems: [{ slug: "retired-skill", reason: "retired" }] });
  try {
    const result = await installPackage("p", { format: "json", version: "latest", harness: "codex", scope: "global", server: "http://test", confirm: async () => true });
    assert.deepEqual(result.skipped, ["retired-skill", "skill-a"]);
    assert.deepEqual(result.installed, []);
  } finally { if (previous === undefined) delete process.env.CODEX_HOME; else process.env.CODEX_HOME = previous; }
});

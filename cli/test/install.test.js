import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { resolveSkillTarget, validateSkillSlug } from "../src/config.js";
import { install } from "../src/commands/install.js";
import { list } from "../src/commands/list.js";
import { remove } from "../src/commands/remove.js";

async function exists(path) {
  return stat(path).then(() => true).catch(() => false);
}

function mockSkillServer({ files = [] } = {}) {
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).endsWith("/api/skills/demo-skill")) {
      return Response.json({
        slug: "demo-skill",
        name: "Demo Skill",
        version: "1.0.0",
        rawContent: "---\nname: demo-skill\n---\n# Demo\n",
      });
    }
    if (String(url).endsWith("/api/skills/demo-skill/files")) {
      return Response.json({ files });
    }
    if (String(url).endsWith("/api/skills/demo-skill/install")) {
      return Response.json({ ok: true });
    }
    return Response.json({ error: "not found" }, { status: 404 });
  };
}

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

test("codex global target uses CODEX_HOME and canonical skill directory", async () => {
  const root = await mkdtemp(join(tmpdir(), "skillvault-codex-"));
  const target = resolveSkillTarget("codex", "global", "demo-skill", {
    CODEX_HOME: root,
  });

  assert.equal(target.rootDir, join(root, "skills"));
  assert.equal(target.skillDir, join(root, "skills", "demo-skill"));
  assert.equal(target.skillFile, join(root, "skills", "demo-skill", "SKILL.md"));
});

test("install writes codex skills to <CODEX_HOME>/skills/<slug>/SKILL.md", async () => {
  const root = await mkdtemp(join(tmpdir(), "skillvault-install-"));
  const previousCodexHome = process.env.CODEX_HOME;
  process.env.CODEX_HOME = root;
  mockSkillServer();

  try {
    await install("demo-skill", {
      harness: "codex",
      scope: "global",
      server: "http://skillvault.test",
      force: false,
    });

    const skillFile = join(root, "skills", "demo-skill", "SKILL.md");
    assert.equal(await exists(skillFile), true);
    assert.match(await readFile(skillFile, "utf8"), /# Demo/);
  } finally {
    restoreEnv("CODEX_HOME", previousCodexHome);
  }
});

test("validateSkillSlug rejects path-like slugs", () => {
  assert.throws(() => validateSkillSlug("../bad"), /single path segment/);
  assert.throws(() => validateSkillSlug("nested/bad"), /single path segment/);
  assert.throws(() => validateSkillSlug("nested\\bad"), /single path segment/);
});

test("install rejects attached files outside the skill directory", async () => {
  const root = await mkdtemp(join(tmpdir(), "skillvault-attach-"));
  const previousCodexHome = process.env.CODEX_HOME;
  process.env.CODEX_HOME = root;
  mockSkillServer({
    files: [{ path: "../escape.txt", content: "bad", fileType: "document" }],
  });

  try {
    await assert.rejects(
      () => install("demo-skill", {
        harness: "codex",
        scope: "global",
        server: "http://skillvault.test",
        force: false,
      }),
      /outside the skill directory/
    );
    assert.equal(await exists(join(root, "skills", "escape.txt")), false);
  } finally {
    restoreEnv("CODEX_HOME", previousCodexHome);
  }
});

test("list detects canonical codex skills and marks legacy flat files", async () => {
  const root = await mkdtemp(join(tmpdir(), "skillvault-list-"));
  const previousCodexHome = process.env.CODEX_HOME;
  process.env.CODEX_HOME = root;
  await mkdir(join(root, "skills", "demo-skill"), { recursive: true });
  await writeFile(join(root, "skills", "demo-skill", "SKILL.md"), "---\nname: Demo Skill\nversion: 1.0.0\n---\n", "utf8");
  await writeFile(join(root, "skills", "legacy-skill.md"), "---\nname: Legacy Skill\nversion: 0.1.0\n---\n", "utf8");

  const output = [];
  const previousLog = console.log;
  console.log = (...args) => output.push(args.join(" "));

  try {
    await list({
      harness: "codex",
      scope: "global",
      server: "http://skillvault.test",
    });

    const rendered = output.join("\n");
    assert.match(rendered, /Demo Skill/);
    assert.match(rendered, /Legacy Skill/);
    assert.match(rendered, /legacy/);
    assert.match(rendered, /demo-skill[\\/]SKILL\.md/);
  } finally {
    console.log = previousLog;
    restoreEnv("CODEX_HOME", previousCodexHome);
  }
});

test("remove deletes canonical skill directory only when SKILL.md is present", async () => {
  const root = await mkdtemp(join(tmpdir(), "skillvault-remove-"));
  const previousCodexHome = process.env.CODEX_HOME;
  process.env.CODEX_HOME = root;
  await mkdir(join(root, "skills", "demo-skill"), { recursive: true });
  await writeFile(join(root, "skills", "demo-skill", "SKILL.md"), "# Demo\n", "utf8");

  try {
    await remove("demo-skill", {
      harness: "codex",
      scope: "global",
    });

    assert.equal(await exists(join(root, "skills", "demo-skill")), false);
  } finally {
    restoreEnv("CODEX_HOME", previousCodexHome);
  }
});

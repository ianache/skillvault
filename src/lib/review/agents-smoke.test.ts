import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { describe } from "node:test";

const source = (path: string) => readFile(new URL(path, import.meta.url), "utf8");

describe("AI Agents Feature Smoke Tests", () => {
  test("AppSidebar includes Agentes IA navigation link pointing to /agents", async () => {
    // Assert navigation.ts or AppSidebar.tsx contains '/agents'
    const navSource = await source("../../components/shell/navigation.ts");
    assert.ok(navSource.includes("/agents"), "navigation.ts must contain /agents");
    assert.ok(navSource.includes("Agentes IA"), "navigation.ts must contain 'Agentes IA' label");
  });

  test("agents page exports page component", async () => {
    const page = await import("@/app/agents/page");
    assert.equal(typeof page.default, "function");
  });

  test("create agent form page exports page component", async () => {
    const page = await import("@/app/agents/create/page");
    assert.equal(typeof page.default, "function");
  });
});

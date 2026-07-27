import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { createSkillVersionDetailHandlers } from "../../app/api/skills/[slug]/versions/[version]/route";
import type { ReviewDatabaseClient } from "./types";

function requestFor(version: string) {
  return new NextRequest(`http://localhost/api/skills/demo/versions/${version}`);
}

test("historical version handler returns the archived content and files", async () => {
  const database: ReviewDatabaseClient = {
    async execute(input) {
      const sql = typeof input === "string" ? input : input.sql;
      if (sql.includes("FROM skill_versions")) {
        return {
          rows: [{ id: 42, version: "1.2.0", raw_content: "# archived", created_at: 123 }],
        };
      }
      return {
        rows: [{ path: "resources/guide.md", file_type: "resource", content: "guide" }],
      };
    },
  };
  const { GET } = createSkillVersionDetailHandlers({ database });

  const response = await GET(requestFor("1.2.0"), {
    params: Promise.resolve({ slug: "demo", version: "1.2.0" }),
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    version: "1.2.0",
    createdAt: 123,
    rawContent: "# archived",
    files: [{ path: "resources/guide.md", fileType: "resource", content: "guide" }],
  });
});

test("historical version handler does not expose versions of unpublished skills", async () => {
  const database: ReviewDatabaseClient = {
    async execute(input) {
      const sql = typeof input === "string" ? input : input.sql;
      if (sql.includes("FROM skill_versions")) {
        return {
          rows: sql.includes("s.status = 'published'")
            ? []
            : [{ id: 42, version: "1.2.0", raw_content: "# private", created_at: 123 }],
        };
      }
      return { rows: [] };
    },
  };
  const { GET } = createSkillVersionDetailHandlers({ database });

  const response = await GET(requestFor("1.2.0"), {
    params: Promise.resolve({ slug: "demo", version: "1.2.0" }),
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: "Version no encontrada" });
});

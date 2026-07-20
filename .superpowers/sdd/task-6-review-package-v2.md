# Task 6 Review Package v2

## Commits
185cf96 fix: make approval activation atomic
eff7b4b feat: activate approved skill versions

## Stat
 .superpowers/sdd/task-6-report.md           |  57 +++++++++++
 src/app/api/skills/[slug]/download/route.ts |  70 ++++++++------
 src/app/api/skills/[slug]/install/route.ts  |  47 +++++----
 src/app/api/skills/[slug]/versions/route.ts |  65 +++++++------
 src/lib/review/api-contract.test.ts         | 113 ++++++++++++++++++++++
 src/lib/review/service.test.ts              | 144 +++++++++++++++++++++++++++-
 src/lib/review/service.ts                   | 128 +++++++++++++++++++++++--
 7 files changed, 535 insertions(+), 89 deletions(-)

## Diff
diff --git a/.superpowers/sdd/task-6-report.md b/.superpowers/sdd/task-6-report.md
new file mode 100644
index 0000000..6dffe69
--- /dev/null
+++ b/.superpowers/sdd/task-6-report.md
@@ -0,0 +1,57 @@
+# Task 6 Report
+
+Status: DONE_WITH_CONCERNS
+
+## Commit
+
+- `feat: activate approved skill versions`
+
+## Files Changed
+
+- `src/lib/review/service.ts`
+- `src/lib/review/service.test.ts`
+- `src/lib/review/api-contract.test.ts`
+- `src/app/api/skills/[slug]/download/route.ts`
+- `src/app/api/skills/[slug]/install/route.ts`
+- `src/app/api/skills/[slug]/versions/route.ts`
+- `.superpowers/sdd/task-6-report.md`
+
+## Tests Run
+
+- RED observed: `pnpm exec tsx --test src/lib/review/service.test.ts src/lib/review/api-contract.test.ts` failed with missing activation writes and missing public handler factories.
+- `pnpm exec tsx --test src/lib/review/*.test.ts` passed: 29 tests.
+- Changed-file ESLint passed.
+- `next build` passed.
+- `pnpm lint` could not start because the local pnpm is `9.0.0` and the repository requires `9.15.9`. Running the installed ESLint binary showed 12 existing errors outside Task 6 files.
+
+## Self-Review
+
+- Approval publishes a new or existing proposal, replaces published attachments while skipping deleted review files, snapshots the version, and only marks the request approved after activation succeeds.
+- Activation uses a transaction and rolls back published writes on activation errors.
+- Catalog/detail behavior already read published `skills` rows; regression tests cover that behavior. Download, install, and version routes now expose testable handler factories and explicitly remain scoped to published rows.
+- `git diff --check` passed.
+
+## Concerns
+
+- Repository-wide lint remains red due to pre-existing errors in unrelated UI and CLI files. Task 6 files lint clean.
+- The prescribed `node --test` command cannot resolve this TypeScript/Next.js project's extensionless imports; the repository's `tsx --test` harness was used for behavioral RED/GREEN verification.
+
+## Review Fixes
+
+- Approval now updates `skill_review_requests` to `approved` before `COMMIT`, inside the same transaction as the published skill, files, and version snapshot writes.
+- Approval and other decision timestamps are TypeScript Unix timestamp parameters rather than SQLite-only `unixepoch()` SQL, so the updates execute on MySQL.
+- Added regression coverage for existing-skill replacement, version insert failure, and approval status update failure. Failure cases assert the request is not approved and the transaction rolls back.
+
+## Fix Verification
+
+- RED observed: the approval status update failure test initially recorded `BEGIN`, `COMMIT`, proving the status update occurred after the activation transaction.
+- `src/lib/review/service.test.ts`: 12/12 passed after the fix.
+- `src/lib/review/*.test.ts`: 32/32 passed after the fix.
+- ESLint passed for `src/lib/review/service.ts` and `src/lib/review/service.test.ts`.
+- `next build` passed.
+- `git diff --check` passed.
+
+## Residual Risk
+
+- The database abstraction does not expose a transaction-scoped client. Its MySQL implementation uses a singleton connection, so the manual `BEGIN`/`COMMIT` sequence makes these approval writes atomic on that connection, but concurrent operations sharing that client could be interleaved. A future database-layer transaction callback that leases a dedicated connection would remove this risk.
+- The requested `pnpm exec` commands were attempted but the installed pnpm `9.0.0` could not resolve local `tsx`, `eslint`, or `next` binaries. Equivalent direct local-binary commands were used for the passing test, lint, and build verification.
diff --git a/src/app/api/skills/[slug]/download/route.ts b/src/app/api/skills/[slug]/download/route.ts
index c594e59..948eeed 100644
--- a/src/app/api/skills/[slug]/download/route.ts
+++ b/src/app/api/skills/[slug]/download/route.ts
@@ -1,46 +1,56 @@
 import { NextRequest, NextResponse } from "next/server";
 import { client } from "@/lib/db";
+import type { ReviewDatabaseClient } from "@/lib/review/types";

-export async function GET(
-  _req: NextRequest,
-  { params }: { params: Promise<{ slug: string }> }
-) {
-  const { slug } = await params;
+type RouteDependencies = { database: ReviewDatabaseClient };

-  const skillRow = await client.execute({
+export function createSkillDownloadHandlers(dependencies: Partial<RouteDependencies> = {}) {
+  const database = dependencies.database ?? client;
+
+  async function GET(
+    _req: NextRequest,
+    { params }: { params: Promise<{ slug: string }> }
+  ) {
+    const { slug } = await params;
+
+    const skillRow = await database.execute({
     sql: "SELECT id, raw_content FROM skills WHERE slug = ? AND status = 'published'",
     args: [slug],
   });
-  if (skillRow.rows.length === 0) {
-    return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
-  }
+    if (skillRow.rows.length === 0) {
+      return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
+    }

-  const skillId = skillRow.rows[0].id as number;
-  const rawContent = (skillRow.rows[0].raw_content as string) || "";
+    const skillId = skillRow.rows[0].id as number;
+    const rawContent = (skillRow.rows[0].raw_content as string) || "";

-  const filesRow = await client.execute({
+    const filesRow = await database.execute({
     sql: "SELECT path, file_type, content FROM skill_files WHERE skill_id = ?",
     args: [skillId],
   });

-  // Build ZIP in-memory with JSZip
-  const JSZip = (await import("jszip")).default;
-  const zip = new JSZip();
-  const folder = zip.folder(slug)!;
-
-  folder.file("SKILL.md", rawContent);
-  for (const f of filesRow.rows) {
-    folder.file(f.path as string, f.content as string);
+    const JSZip = (await import("jszip")).default;
+    const zip = new JSZip();
+    const folder = zip.folder(slug)!;
+
+    folder.file("SKILL.md", rawContent);
+    for (const f of filesRow.rows) {
+      folder.file(f.path as string, f.content as string);
+    }
+
+    const buffer = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });
+
+    return new NextResponse(buffer, {
+      status: 200,
+      headers: {
+        "Content-Type": "application/zip",
+        "Content-Disposition": `attachment; filename="${slug}.zip"`,
+        "Content-Length": String(buffer.byteLength),
+      },
+    });
   }

-  const buffer = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });
-
-  return new NextResponse(buffer, {
-    status: 200,
-    headers: {
-      "Content-Type": "application/zip",
-      "Content-Disposition": `attachment; filename="${slug}.zip"`,
-      "Content-Length": String(buffer.byteLength),
-    },
-  });
+  return { GET };
 }
+
+export const { GET } = createSkillDownloadHandlers();
diff --git a/src/app/api/skills/[slug]/install/route.ts b/src/app/api/skills/[slug]/install/route.ts
index d98ccd8..a0b73ad 100644
--- a/src/app/api/skills/[slug]/install/route.ts
+++ b/src/app/api/skills/[slug]/install/route.ts
@@ -1,26 +1,37 @@
 import { NextRequest, NextResponse } from "next/server";
 import { client } from "@/lib/db";
+import type { ReviewDatabaseClient } from "@/lib/review/types";

-export async function POST(
-  _req: NextRequest,
-  { params }: { params: Promise<{ slug: string }> }
-) {
-  const { slug } = await params;
+type RouteDependencies = { database: ReviewDatabaseClient };

-  const existing = await client.execute({
-    sql: "SELECT install_count FROM skills WHERE slug = ? AND status = 'published'",
-    args: [slug],
-  });
+export function createSkillInstallHandlers(dependencies: Partial<RouteDependencies> = {}) {
+  const database = dependencies.database ?? client;

-  if (existing.rows.length === 0) {
-    return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
-  }
+  async function POST(
+    _req: NextRequest,
+    { params }: { params: Promise<{ slug: string }> }
+  ) {
+    const { slug } = await params;
+
+    const existing = await database.execute({
+      sql: "SELECT id, install_count FROM skills WHERE slug = ? AND status = 'published'",
+      args: [slug],
+    });
+
+    if (existing.rows.length === 0) {
+      return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
+    }

-  await client.execute({
-    sql: "UPDATE skills SET install_count = install_count + 1 WHERE slug = ?",
-    args: [slug],
-  });
+    await database.execute({
+      sql: "UPDATE skills SET install_count = install_count + 1 WHERE id = ? AND status = 'published'",
+      args: [existing.rows[0].id],
+    });

-  const newCount = Number(existing.rows[0].install_count) + 1;
-  return NextResponse.json({ slug, installCount: newCount });
+    const newCount = Number(existing.rows[0].install_count) + 1;
+    return NextResponse.json({ slug, installCount: newCount });
+  }
+
+  return { POST };
 }
+
+export const { POST } = createSkillInstallHandlers();
diff --git a/src/app/api/skills/[slug]/versions/route.ts b/src/app/api/skills/[slug]/versions/route.ts
index d4b0333..b6f371f 100644
--- a/src/app/api/skills/[slug]/versions/route.ts
+++ b/src/app/api/skills/[slug]/versions/route.ts
@@ -1,38 +1,49 @@
 import { NextRequest, NextResponse } from "next/server";
 import { client } from "@/lib/db";
+import type { ReviewDatabaseClient } from "@/lib/review/types";

-export async function GET(
-  _req: NextRequest,
-  { params }: { params: Promise<{ slug: string }> }
-) {
-  const { slug } = await params;
-
-  const skillRow = await client.execute({
-    sql: "SELECT id FROM skills WHERE slug = ?",
-    args: [slug],
-  });
-  if (skillRow.rows.length === 0) {
-    return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
-  }
+type RouteDependencies = { database: ReviewDatabaseClient };
+
+export function createSkillVersionHandlers(dependencies: Partial<RouteDependencies> = {}) {
+  const database = dependencies.database ?? client;
+
+  async function GET(
+    _req: NextRequest,
+    { params }: { params: Promise<{ slug: string }> }
+  ) {
+    const { slug } = await params;
+
+    const skillRow = await database.execute({
+      sql: "SELECT id FROM skills WHERE slug = ? AND status = 'published'",
+      args: [slug],
+    });
+    if (skillRow.rows.length === 0) {
+      return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
+    }

-  const skillId = skillRow.rows[0].id;
+    const skillId = skillRow.rows[0].id;

-  try {
-    const versions = await client.execute({
-      sql: `SELECT version, created_at FROM skill_versions
+    try {
+      const versions = await database.execute({
+        sql: `SELECT version, created_at FROM skill_versions
             WHERE skill_id = ?
             ORDER BY created_at DESC
             LIMIT 10`,
-      args: [skillId],
-    });
+        args: [skillId],
+      });

-    return NextResponse.json({
-      versions: versions.rows.map((r) => ({
-        version: r.version as string,
-        createdAt: r.created_at as string,
-      })),
-    });
-  } catch {
-    return NextResponse.json({ versions: [] });
+      return NextResponse.json({
+        versions: versions.rows.map((r) => ({
+          version: r.version as string,
+          createdAt: r.created_at as string,
+        })),
+      });
+    } catch {
+      return NextResponse.json({ versions: [] });
+    }
   }
+
+  return { GET };
 }
+
+export const { GET } = createSkillVersionHandlers();
diff --git a/src/lib/review/api-contract.test.ts b/src/lib/review/api-contract.test.ts
index 570c08b..cca214f 100644
--- a/src/lib/review/api-contract.test.ts
+++ b/src/lib/review/api-contract.test.ts
@@ -1,17 +1,20 @@
 import assert from "node:assert/strict";
 import test from "node:test";
 import { NextRequest } from "next/server";
 import { createReviewRequestsHandlers } from "../../app/api/review-requests/route";
 import { createReviewDecisionHandlers } from "../../app/api/review-requests/[id]/decision/route";
 import { createSkillHandlers } from "../../app/api/skills/route";
 import { createSkillDetailHandlers } from "../../app/api/skills/[slug]/route";
+import { createSkillDownloadHandlers } from "../../app/api/skills/[slug]/download/route";
+import { createSkillInstallHandlers } from "../../app/api/skills/[slug]/install/route";
+import { createSkillVersionHandlers } from "../../app/api/skills/[slug]/versions/route";
 import { POST as postSkillFiles } from "../../app/api/skills/[slug]/files/route";
 import type { ReviewDatabaseClient, ReviewRequest } from "./types";

 const reviewerSession = {
   user: {
     id: "reviewer-1",
     name: "Reviewer",
     email: "reviewer@example.test",
     roles: ["reviewer"],
   },
@@ -172,20 +175,130 @@ test("PATCH /api/skills/:slug preserves published files when files are omitted",

   assert.equal(response.status, 201);
   assert.deepEqual(await response.json(), { slug: "demo-skill", reviewRequestId: 9, status: "pending" });
   assert.deepEqual(updateInput, {
     rawContent: updatedRawContent,
     files: [{ ...publishedFiles[0], changeType: "unchanged" }],
   });
   assert.equal(publishedRawContent, originalRawContent);
 });

+test("catalog excludes pending review requests", async () => {
+  let catalogSql = "";
+  const { GET } = createSkillHandlers({
+    database: {
+      async execute(input) {
+        catalogSql = typeof input === "string" ? input : input.sql;
+        return { rows: [] };
+      },
+    },
+  });
+
+  const response = await GET(new NextRequest("http://test/api/skills"));
+
+  assert.equal(response.status, 200);
+  assert.match(catalogSql, /FROM skills WHERE status = 'published'/);
+});
+
+test("detail returns published raw content while a pending version exists", async () => {
+  const publishedRawContent = "published skill content";
+  const { GET } = createSkillDetailHandlers({
+    database: {
+      async execute(input) {
+        const sql = typeof input === "string" ? input : input.sql;
+        assert.match(sql, /FROM skills WHERE slug = \? AND status = 'published'/);
+        return {
+          rows: [{
+            id: 4,
+            slug: "demo-skill",
+            name: "demo-skill",
+            description: "Published skill",
+            type: "code",
+            version: "1.0.0",
+            schema_version: "1.1",
+            triggers: "[]",
+            tools: "[]",
+            compatibility: "[\"claude\"]",
+            dependencies: "[]",
+            raw_content: publishedRawContent,
+            status: "published",
+            install_count: 0,
+          }],
+        };
+      },
+    },
+  });
+
+  const response = await GET(new NextRequest("http://test/api/skills/demo-skill"), { params: Promise.resolve({ slug: "demo-skill" }) });
+
+  assert.equal((await response.json()).rawContent, publishedRawContent);
+});
+
+test("download packages only published skill content and files", async () => {
+  const queries: string[] = [];
+  const { GET } = createSkillDownloadHandlers({
+    database: {
+      async execute(input) {
+        const sql = typeof input === "string" ? input : input.sql;
+        queries.push(sql);
+        if (sql.includes("FROM skills")) return { rows: [{ id: 4, raw_content: "published skill content" }] };
+        return { rows: [{ path: "resources/published.md", file_type: "resource", content: "published file" }] };
+      },
+    },
+  });
+
+  const response = await GET(new NextRequest("http://test/api/skills/demo-skill/download"), { params: Promise.resolve({ slug: "demo-skill" }) });
+
+  assert.equal(response.status, 200);
+  assert.match(queries[0], /status = 'published'/);
+  assert.match(queries[1], /FROM skill_files WHERE skill_id = \?/);
+});
+
+test("install increments only the published skill", async () => {
+  const queries: string[] = [];
+  const { POST } = createSkillInstallHandlers({
+    database: {
+      async execute(input) {
+        const sql = typeof input === "string" ? input : input.sql;
+        queries.push(sql);
+        if (sql.startsWith("SELECT")) return { rows: [{ id: 4, install_count: 2 }] };
+        return { rows: [] };
+      },
+    },
+  });
+
+  const response = await POST(new NextRequest("http://test/api/skills/demo-skill/install", { method: "POST" }), { params: Promise.resolve({ slug: "demo-skill" }) });
+
+  assert.deepEqual(await response.json(), { slug: "demo-skill", installCount: 3 });
+  assert.match(queries[0], /status = 'published'/);
+  assert.match(queries[1], /WHERE id = \? AND status = 'published'/);
+});
+
+test("versions belong to the published skill only", async () => {
+  const queries: string[] = [];
+  const { GET } = createSkillVersionHandlers({
+    database: {
+      async execute(input) {
+        const sql = typeof input === "string" ? input : input.sql;
+        queries.push(sql);
+        if (sql.includes("FROM skills")) return { rows: [{ id: 4 }] };
+        return { rows: [{ version: "1.0.0", created_at: 1 }] };
+      },
+    },
+  });
+
+  const response = await GET(new NextRequest("http://test/api/skills/demo-skill/versions"), { params: Promise.resolve({ slug: "demo-skill" }) });
+
+  assert.deepEqual(await response.json(), { versions: [{ version: "1.0.0", createdAt: 1 }] });
+  assert.match(queries[0], /status = 'published'/);
+});
+
 test("unauthenticated create returns 401", async () => {
   const { POST } = createReviewRequestsHandlers({ getSession: async () => null as never });
   const response = await POST(
     new NextRequest("http://test/api/review-requests", { method: "POST" })
   );

   assert.equal(response.status, 401);
 });

 test("invalid decision returns 422 without mutating review state", async () => {
diff --git a/src/lib/review/service.test.ts b/src/lib/review/service.test.ts
index 479c053..c31d29e 100644
--- a/src/lib/review/service.test.ts
+++ b/src/lib/review/service.test.ts
@@ -31,56 +31,106 @@ Demo description.
 Use this demo.

 ## Instrucciones

 Follow these instructions.`;

 const authorActor: ReviewActor = { id: "author-1", handle: "author", roles: ["author"] };
 const reviewerActor: ReviewActor = { id: "reviewer-1", handle: "reviewer", roles: ["reviewer"] };
 const adminActor: ReviewActor = { id: "admin-1", handle: "admin", roles: ["admin"] };

-function createFakeClient(files: Array<Record<string, unknown>> = []): ReviewDatabaseClient {
+type FakeClient = ReviewDatabaseClient & {
+  insertedSkill?: Record<string, unknown>;
+  insertedFiles: Array<Record<string, unknown>>;
+  insertedVersion?: Record<string, unknown>;
+  updatedRequest?: Record<string, unknown>;
+  failOnSkillInsert: boolean;
+  failOnVersionInsert: boolean;
+  failOnApprovalUpdate: boolean;
+  commands: string[];
+};
+
+function createFakeClient(
+  files: Array<Record<string, unknown>> = [],
+  requestOverrides: Partial<Record<string, unknown>> = {}
+): FakeClient {
   const comments: Array<Record<string, unknown>> = [];
   const request = {
     id: 1,
     skill_id: null,
     slug: "demo-skill",
     name: "demo-skill",
     description: "A complete enough description for the demo review skill.",
     type: "code",
     version: "1.0.0",
     schema_version: "1.1",
     author_id: "author-1",
     author_handle: "author",
     raw_content: validRawContent,
     status: "pending",
     reviewer_id: null,
     reviewer_handle: null,
     general_comment: null,
     submitted_at: 1,
     reviewed_at: null,
     updated_at: 1,
+    ...requestOverrides,
   };

-  return {
+  const fakeClient: FakeClient = {
+    insertedFiles: [],
+    failOnSkillInsert: false,
+    failOnVersionInsert: false,
+    failOnApprovalUpdate: false,
+    commands: [],
     async execute(input) {
       const sql = typeof input === "string" ? input : input.sql;
       const args = typeof input === "string" ? [] : input.args ?? [];
+      fakeClient.commands.push(sql);
       if (sql.includes("SELECT * FROM skill_review_requests WHERE id = ?")) {
         return { rows: [request] };
       }
       if (sql.includes("SELECT * FROM skill_review_requests") && sql.includes("ORDER BY id DESC")) {
         return { rows: [request] };
       }
       if (sql.includes("SELECT * FROM skill_review_files WHERE review_request_id = ?")) {
         return { rows: files };
       }
+      if (sql.includes("INSERT INTO skills")) {
+        if (fakeClient.failOnSkillInsert) throw new Error("activation failed");
+        fakeClient.insertedSkill = {
+          id: 7,
+          slug: args[0],
+          name: args[1],
+        };
+        return { rows: [] };
+      }
+      if (sql.includes("SELECT id FROM skills WHERE slug = ?")) {
+        return { rows: [{ id: 7 }] };
+      }
+      if (sql.includes("DELETE FROM skill_files")) {
+        return { rows: [] };
+      }
+      if (sql.includes("INSERT INTO skill_files")) {
+        fakeClient.insertedFiles.push({ skillId: args[0], path: args[1], fileType: args[2], content: args[3] });
+        return { rows: [] };
+      }
+      if (sql.includes("INSERT INTO skill_versions")) {
+        if (fakeClient.failOnVersionInsert) throw new Error("version insert failed");
+        fakeClient.insertedVersion = { skillId: args[0], version: args[1], rawContent: args[2] };
+        return { rows: [] };
+      }
+      if (sql.includes("UPDATE skill_review_requests")) {
+        if (fakeClient.failOnApprovalUpdate && args[0] === "approved") throw new Error("approval update failed");
+        fakeClient.updatedRequest = { status: args[0] };
+        return { rows: [] };
+      }
       if (sql.includes("INSERT INTO skill_review_comments")) {
         comments.unshift({
           id: comments.length + 1,
           review_request_id: args[0],
           file_path: args[1],
           author_id: args[2],
           author_handle: args[3],
           body: args[4],
           created_at: 1,
         });
@@ -88,20 +138,21 @@ function createFakeClient(files: Array<Record<string, unknown>> = []): ReviewDat
       }
       if (sql.includes("SELECT * FROM skill_review_comments WHERE review_request_id = ? ORDER BY id DESC LIMIT 1")) {
         return { rows: comments.slice(0, 1) };
       }
       if (sql.includes("SELECT * FROM skill_review_comments WHERE review_request_id = ?")) {
         return { rows: comments };
       }
       return { rows: [] };
     },
   };
+  return fakeClient;
 }

 test("author creates pending request for a new skill", async () => {
   const request = await createReviewRequest({ rawContent: validRawContent, files: [] }, authorActor, createFakeClient());
   assert.equal(request.status, "pending");
   assert.equal(request.slug, "demo-skill");
 });

 test("author cannot approve own request", async () => {
   await assert.rejects(
@@ -149,15 +200,100 @@ test("per-file comment accepts SKILL.md and an attached file", async () => {
     created_at: 1,
   };

   const skillComment = await addReviewComment(1, { body: "Skill note", filePath: "SKILL.md" }, reviewerActor, createFakeClient([file]));
   const attachedFileComment = await addReviewComment(1, { body: "File note", filePath: "resources/reference.md" }, reviewerActor, createFakeClient([file]));

   assert.equal(skillComment.filePath, "SKILL.md");
   assert.equal(attachedFileComment.filePath, "resources/reference.md");
 });

-test("approval records approved status without activating the skill until Task 6", async () => {
-  const request = await decideReviewRequest(1, { decision: "approve" }, reviewerActor, createFakeClient());
+test("approving new skill creates published skill, files, and version snapshot", async () => {
+  const files = [
+    {
+      id: 1,
+      review_request_id: 1,
+      path: "resources/reference.md",
+      file_type: "resource",
+      content: "Published reference",
+      change_type: "added",
+      created_at: 1,
+    },
+    {
+      id: 2,
+      review_request_id: 1,
+      path: "resources/removed.md",
+      file_type: "resource",
+      content: "Deleted reference",
+      change_type: "deleted",
+      created_at: 1,
+    },
+  ];
+  const fakeClient = createFakeClient(files);
+
+  const request = await decideReviewRequest(1, { decision: "approve" }, reviewerActor, fakeClient);

   assert.equal(request.status, "approved");
+  assert.equal(fakeClient.insertedSkill?.slug, "demo-skill");
+  assert.deepEqual(fakeClient.insertedFiles, [{ skillId: 7, path: "resources/reference.md", fileType: "resource", content: "Published reference" }]);
+  assert.deepEqual(fakeClient.insertedVersion, { skillId: 7, version: "1.0.0", rawContent: validRawContent });
+  assert.equal(fakeClient.updatedRequest?.status, "approved");
+});
+
+test("approval failure leaves request pending", async () => {
+  const fakeClient = createFakeClient();
+  fakeClient.failOnSkillInsert = true;
+
+  await assert.rejects(
+    () => decideReviewRequest(1, { decision: "approve" }, reviewerActor, fakeClient),
+    /activation failed/
+  );
+
+  assert.notEqual(fakeClient.updatedRequest?.status, "approved");
+});
+
+test("approving an existing skill replaces published content and files", async () => {
+  const fakeClient = createFakeClient([
+    {
+      id: 1,
+      review_request_id: 1,
+      path: "resources/replacement.md",
+      file_type: "resource",
+      content: "Replacement content",
+      change_type: "modified",
+      created_at: 1,
+    },
+  ], { skill_id: 7 });
+
+  await decideReviewRequest(1, { decision: "approve" }, reviewerActor, fakeClient);
+
+  assert.equal(fakeClient.insertedSkill, undefined);
+  assert.deepEqual(fakeClient.insertedFiles, [{ skillId: 7, path: "resources/replacement.md", fileType: "resource", content: "Replacement content" }]);
+  assert.ok(fakeClient.commands.some((sql) => sql.includes("UPDATE skills")));
+  assert.ok(fakeClient.commands.some((sql) => sql.includes("DELETE FROM skill_files")));
+});
+
+test("version insert failure rolls back activation without approving the request", async () => {
+  const fakeClient = createFakeClient();
+  fakeClient.failOnVersionInsert = true;
+
+  await assert.rejects(
+    () => decideReviewRequest(1, { decision: "approve" }, reviewerActor, fakeClient),
+    /version insert failed/
+  );
+
+  assert.notEqual(fakeClient.updatedRequest?.status, "approved");
+  assert.deepEqual(fakeClient.commands.filter((sql) => sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK"), ["BEGIN", "ROLLBACK"]);
+});
+
+test("approval update failure rolls back published writes without approving the request", async () => {
+  const fakeClient = createFakeClient();
+  fakeClient.failOnApprovalUpdate = true;
+
+  await assert.rejects(
+    () => decideReviewRequest(1, { decision: "approve" }, reviewerActor, fakeClient),
+    /approval update failed/
+  );
+
+  assert.notEqual(fakeClient.updatedRequest?.status, "approved");
+  assert.deepEqual(fakeClient.commands.filter((sql) => sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK"), ["BEGIN", "ROLLBACK"]);
 });
diff --git a/src/lib/review/service.ts b/src/lib/review/service.ts
index 7b49c6e..7a64720 100644
--- a/src/lib/review/service.ts
+++ b/src/lib/review/service.ts
@@ -120,20 +120,119 @@ async function replaceFiles(id: number, files: ReturnType<typeof validateSubmiss
   for (const file of files) {
     await client.execute({
       sql: `INSERT INTO skill_review_files
         (review_request_id, path, file_type, content, change_type)
         VALUES (?, ?, ?, ?, ?)`,
       args: [id, file.path, file.fileType, file.content, file.changeType],
     });
   }
 }

+async function activateApprovedRequest(
+  request: ReviewRequest,
+  actor: ReviewActor,
+  comment: string | null,
+  client: ReviewDatabaseClient
+): Promise<void> {
+  const { frontmatter } = validateSubmission(request.rawContent);
+  const reviewFiles = await client.execute({
+    sql: "SELECT * FROM skill_review_files WHERE review_request_id = ? ORDER BY id",
+    args: [request.id],
+  });
+  const publishedAt = Math.floor(Date.now() / 1000);
+
+  await client.execute("BEGIN");
+  try {
+    let skillId = request.skillId;
+    if (skillId === null) {
+      await client.execute({
+        sql: `INSERT INTO skills
+          (slug, name, description, type, author_id, author_handle, version, schema_version,
+           triggers, tools, compatibility, dependencies, raw_content, status, published_at)
+          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)`,
+        args: [
+          request.slug,
+          request.name,
+          request.description,
+          request.type,
+          request.authorId,
+          request.authorHandle,
+          request.version,
+          request.schemaVersion,
+          JSON.stringify(frontmatter.metadata.triggers),
+          JSON.stringify(frontmatter.metadata.tools),
+          JSON.stringify(frontmatter.compatibility),
+          JSON.stringify(frontmatter.dependencies),
+          request.rawContent,
+          publishedAt,
+        ],
+      });
+      const inserted = await client.execute({
+        sql: "SELECT id FROM skills WHERE slug = ? AND status = 'published' LIMIT 1",
+        args: [request.slug],
+      });
+      if (inserted.rows.length === 0) throw new Error("activation failed: published skill was not created");
+      skillId = asNumber(inserted.rows[0].id);
+    } else {
+      await client.execute({
+        sql: `UPDATE skills
+          SET slug = ?, name = ?, description = ?, type = ?, author_id = ?, author_handle = ?,
+              version = ?, schema_version = ?, triggers = ?, tools = ?, compatibility = ?,
+              dependencies = ?, raw_content = ?, status = 'published', published_at = ?, updated_at = ?
+          WHERE id = ? AND status = 'published'`,
+        args: [
+          request.slug,
+          request.name,
+          request.description,
+          request.type,
+          request.authorId,
+          request.authorHandle,
+          request.version,
+          request.schemaVersion,
+          JSON.stringify(frontmatter.metadata.triggers),
+          JSON.stringify(frontmatter.metadata.tools),
+          JSON.stringify(frontmatter.compatibility),
+          JSON.stringify(frontmatter.dependencies),
+          request.rawContent,
+          publishedAt,
+          publishedAt,
+          skillId,
+        ],
+      });
+    }
+
+    await client.execute({ sql: "DELETE FROM skill_files WHERE skill_id = ?", args: [skillId] });
+    for (const file of reviewFiles.rows.map(toFile)) {
+      if (file.changeType === "deleted") continue;
+      await client.execute({
+        sql: "INSERT INTO skill_files (skill_id, path, file_type, content) VALUES (?, ?, ?, ?)",
+        args: [skillId, file.path, file.fileType, file.content],
+      });
+    }
+    await client.execute({
+      sql: "INSERT INTO skill_versions (skill_id, version, raw_content) VALUES (?, ?, ?)",
+      args: [skillId, request.version, request.rawContent],
+    });
+    await client.execute({
+      sql: `UPDATE skill_review_requests
+        SET status = ?, reviewer_id = ?, reviewer_handle = ?, general_comment = ?,
+            reviewed_at = ?, updated_at = ?
+        WHERE id = ?`,
+      args: ["approved", actor.id, actor.handle ?? null, comment, publishedAt, publishedAt, request.id],
+    });
+    await client.execute("COMMIT");
+  } catch (error) {
+    await client.execute("ROLLBACK").catch(() => undefined);
+    throw error;
+  }
+}
+
 export async function createReviewRequest(
   input: CreateReviewRequestInput,
   actor: ReviewActor,
   client: ReviewDatabaseClient
 ): Promise<ReviewRequest> {
   const { frontmatter, files } = validateSubmission(input.rawContent, input.files);
   const duplicate = await client.execute({
     sql: `SELECT id FROM skill_review_requests
       WHERE slug = ? AND version = ? AND status IN ('pending', 'changes_requested')`,
     args: [frontmatter.name, frontmatter.version],
@@ -178,30 +277,31 @@ export async function updateReviewRequest(
   client: ReviewDatabaseClient
 ): Promise<ReviewRequest> {
   const request = await getRequestRow(id, client);
   assertCanEditRequest(actor, request);
   const { frontmatter, files } = validateSubmission(input.rawContent, input.files);

   await client.execute({
     sql: `UPDATE skill_review_requests
       SET slug = ?, name = ?, description = ?, type = ?, version = ?, schema_version = ?, raw_content = ?,
           status = 'pending', reviewer_id = NULL, reviewer_handle = NULL, general_comment = NULL,
-          reviewed_at = NULL, updated_at = unixepoch()
+          reviewed_at = NULL, updated_at = ?
       WHERE id = ?`,
     args: [
       frontmatter.name,
       frontmatter.name,
       frontmatter.description,
       frontmatter.metadata.type,
       frontmatter.version,
       frontmatter.schema_version,
       input.rawContent,
+      Math.floor(Date.now() / 1000),
       id,
     ],
   });
   await replaceFiles(id, files, client);
   return getRequestRow(id, client);
 }

 export async function listReviewRequests(
   query: ListReviewRequestsQuery,
   actor: ReviewActor,
@@ -215,21 +315,25 @@ export async function listReviewRequests(
   }
   if (query.status) {
     clauses.push("status = ?");
     args.push(query.status);
   }
   const where = clauses.length > 0 ? ` WHERE ${clauses.join(" AND ")}` : "";
   const result = await client.execute({
     sql: `SELECT * FROM skill_review_requests${where} ORDER BY updated_at DESC, id DESC`,
     args,
   });
-  return result.rows.map(toRequest).map(({ rawContent: _rawContent, ...request }) => request);
+  return result.rows.map(toRequest).map((request) => {
+    const { rawContent, ...summary } = request;
+    void rawContent;
+    return summary;
+  });
 }

 export async function getReviewRequest(
   id: number,
   actor: ReviewActor,
   client: ReviewDatabaseClient
 ): Promise<ReviewRequestDetailDto> {
   const request = await getRequestRow(id, client);
   if (request.authorId !== actor.id && !canReview(actor) && !hasRole(actor, "admin")) {
     throw new Error("Not allowed to view this request");
@@ -285,20 +389,24 @@ export async function decideReviewRequest(
   }
   if ((input.decision === "reject" || input.decision === "request_changes") && !input.comment?.trim()) {
     throw new Error("A general comment required for this decision");
   }

   const status: ReviewStatus = input.decision === "approve"
     ? "approved"
     : input.decision === "reject"
       ? "rejected"
       : "changes_requested";
-  // Task 6 activates skills after approval; this task records only review state.
-  await client.execute({
-    sql: `UPDATE skill_review_requests
-      SET status = ?, reviewer_id = ?, reviewer_handle = ?, general_comment = ?,
-          reviewed_at = unixepoch(), updated_at = unixepoch()
-      WHERE id = ?`,
-    args: [status, actor.id, actor.handle ?? null, input.comment?.trim() ?? null, id],
-  });
+  if (input.decision === "approve") {
+    await activateApprovedRequest(request, actor, input.comment?.trim() ?? null, client);
+  } else {
+    const decidedAt = Math.floor(Date.now() / 1000);
+    await client.execute({
+      sql: `UPDATE skill_review_requests
+        SET status = ?, reviewer_id = ?, reviewer_handle = ?, general_comment = ?,
+            reviewed_at = ?, updated_at = ?
+        WHERE id = ?`,
+      args: [status, actor.id, actor.handle ?? null, input.comment?.trim() ?? null, decidedAt, decidedAt, id],
+    });
+  }
   return { ...request, status, reviewerId: actor.id, reviewerHandle: actor.handle ?? null, generalComment: input.comment?.trim() ?? null };
 }

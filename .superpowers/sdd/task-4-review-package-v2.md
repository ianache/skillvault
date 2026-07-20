# Task 4 Review Package v2

## Commits
a2c12c0 fix: keep skill files behind review
f164f9b feat: route publishing through review requests

## Stat
 .superpowers/sdd/task-4-report.md        |  52 +++++++++
 src/app/api/skills/[slug]/files/route.ts |  44 +-------
 src/app/api/skills/[slug]/route.ts       | 179 +++++++++++++++----------------
 src/app/api/skills/route.ts              | 179 +++++++++++++++++--------------
 src/app/publish/page.tsx                 |  18 +---
 src/app/publish/success/page.tsx         |  16 +--
 src/components/dashboard/SkillEditor.tsx |   4 +-
 src/components/wizard/Step3Review.tsx    |   2 +-
 src/lib/review/api-contract.test.ts      | 157 +++++++++++++++++++++++++++
 9 files changed, 417 insertions(+), 234 deletions(-)

## Diff
diff --git a/.superpowers/sdd/task-4-report.md b/.superpowers/sdd/task-4-report.md
new file mode 100644
index 0000000..29bb5c8
--- /dev/null
+++ b/.superpowers/sdd/task-4-report.md
@@ -0,0 +1,52 @@
+# Task 4 Report
+
+Status: DONE_WITH_CONCERNS
+
+## Commit
+
+- `feat: route publishing through review requests`
+
+## Files Changed
+
+- `src/app/api/skills/route.ts`
+- `src/app/api/skills/[slug]/route.ts`
+- `src/app/publish/page.tsx`
+- `src/app/publish/success/page.tsx`
+- `src/components/dashboard/SkillEditor.tsx`
+- `src/components/wizard/Step3Review.tsx` (adjacent button-copy change)
+- `src/lib/review/api-contract.test.ts`
+- `.superpowers/sdd/task-4-report.md`
+
+## Tests Run
+
+- RED: `node --test src/lib/review/api-contract.test.ts` failed before loading tests because Node 22 could not resolve Next 16's extensionless `next/server` import.
+- RED: `pnpm exec tsx --test src/lib/review/api-contract.test.ts` failed as expected with `createSkillHandlers is not a function` and `createSkillDetailHandlers is not a function`.
+- PASS: `node_modules/.bin/tsx --test src/lib/review/*.test.ts` - 16 passing, 0 failing.
+- PASS: scoped `node_modules/.bin/eslint` on changed API, publish, success, review-button, and contract-test files.
+- PASS: `git diff --check`.
+
+## Self-Review Notes
+
+- `POST /api/skills` creates a pending review request and includes submitted files; it no longer inserts a published skill.
+- `PATCH /api/skills/:slug` updates the author's open request for that published skill, or creates one when absent. It does not update the published row.
+- Public `GET` queries remain restricted to published skills.
+- No approval activation behavior was added; Task 6 remains responsible for activation.
+
+## Concerns
+
+- Required `pnpm lint` could not run: the installed pnpm is 9.0.0 while the project requires 9.15.9. Corepack could not download the pinned version because of a local certificate verification failure.
+- Running the local ESLint binary across the entire repository still fails on existing unrelated lint errors, including existing effect-rule errors in `SkillEditor` and other components.
+- Full TypeScript checking reports existing dependency-injection typing errors in the pre-existing review-route contract tests (`typeof auth` and `DbClient.close` requirements). The Task 4 handler dependencies use structural types and do not add to those errors.
+
+## Review Fixes
+
+- Disabled `POST /api/skills/:slug/files` with `405` so published attachments cannot bypass review requests; public `GET` is unchanged.
+- When `PATCH /api/skills/:slug` omits `files`, it now submits the published `skill_files` as `changeType: "unchanged"`. An explicitly supplied `files` array remains authoritative.
+
+### Tests And Results
+
+- RED: `node_modules/.bin/tsx --test src/lib/review/api-contract.test.ts` failed with the legacy files POST reaching the `skills` query and PATCH submitting `files: []`.
+- PASS: `node_modules/.bin/tsx --test src/lib/review/api-contract.test.ts` - 6 passing, 0 failing.
+- PASS: `node_modules/.bin/tsx --test src/lib/review/*.test.ts` - 17 passing, 0 failing.
+- PASS: scoped `node_modules/.bin/eslint` for the changed API routes and contract test.
+- PASS: `git diff --check`.
diff --git a/src/app/api/skills/[slug]/files/route.ts b/src/app/api/skills/[slug]/files/route.ts
index 983c30a..f1a624e 100644
--- a/src/app/api/skills/[slug]/files/route.ts
+++ b/src/app/api/skills/[slug]/files/route.ts
@@ -1,19 +1,13 @@
 import { NextRequest, NextResponse } from "next/server";
 import { client } from "@/lib/db";

-interface FileEntry {
-  path: string;
-  fileType: "resource" | "script";
-  content: string;
-}
-
 export async function GET(
   _req: NextRequest,
   { params }: { params: Promise<{ slug: string }> }
 ) {
   const { slug } = await params;

   const skill = await client.execute({
     sql: "SELECT id FROM skills WHERE slug = ?",
     args: [slug],
   });
@@ -30,44 +24,16 @@ export async function GET(
   return NextResponse.json({
     files: files.rows.map((r) => ({
       id: r.id,
       path: r.path as string,
       fileType: r.file_type as string,
       content: r.content as string,
     })),
   });
 }

-export async function POST(
-  req: NextRequest,
-  { params }: { params: Promise<{ slug: string }> }
-) {
-  const { slug } = await params;
-
-  const skill = await client.execute({
-    sql: "SELECT id FROM skills WHERE slug = ?",
-    args: [slug],
-  });
-  if (skill.rows.length === 0) {
-    return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
-  }
-
-  const skillId = skill.rows[0].id as number;
-  const { files } = (await req.json()) as { files: FileEntry[] };
-
-  if (!Array.isArray(files) || files.length === 0) {
-    return NextResponse.json({ error: "files[] requerido" }, { status: 400 });
-  }
-
-  // Delete existing files for this skill and re-insert
-  await client.execute({ sql: "DELETE FROM skill_files WHERE skill_id = ?", args: [skillId] });
-
-  for (const f of files) {
-    const fileType = f.fileType === "script" ? "script" : "resource";
-    await client.execute({
-      sql: "INSERT INTO skill_files (skill_id, path, file_type, content) VALUES (?, ?, ?, ?)",
-      args: [skillId, f.path, fileType, f.content ?? ""],
-    });
-  }
-
-  return NextResponse.json({ saved: files.length });
+export async function POST() {
+  return NextResponse.json(
+    { error: "Skill file updates must be submitted through a review request" },
+    { status: 405 }
+  );
 }
diff --git a/src/app/api/skills/[slug]/route.ts b/src/app/api/skills/[slug]/route.ts
index f130d23..bebbcea 100644
--- a/src/app/api/skills/[slug]/route.ts
+++ b/src/app/api/skills/[slug]/route.ts
@@ -1,25 +1,38 @@
 import { NextRequest, NextResponse } from "next/server";
+import { auth } from "@/auth";
 import { client } from "@/lib/db";
-import matter from "gray-matter";
-import { validateSkillFrontmatter } from "@/lib/skill-schema";
+import { createReviewRequest, updateReviewRequest } from "@/lib/review/service";
+import { actorFromSession, errorResponse } from "../../review-requests/route-utils";
+import { skillSubmissionBody } from "../route";
+import type { Session } from "next-auth";
+import type { CreateReviewRequestInput, ReviewActor, ReviewDatabaseClient, ReviewRequest, UpdateReviewRequestInput } from "@/lib/review/types";
+
+type RouteContext = { params: Promise<{ slug: string }> };
+
+type RouteDependencies = {
+  getSession: () => Promise<Session | null>;
+  database: ReviewDatabaseClient;
+  create: (input: CreateReviewRequestInput, actor: ReviewActor, database: ReviewDatabaseClient) => Promise<ReviewRequest>;
+  update: (id: number, input: UpdateReviewRequestInput, actor: ReviewActor, database: ReviewDatabaseClient) => Promise<ReviewRequest>;
+};

 function yamlList(arr: string[]) {
   return arr.length ? arr.map((v) => `  - "${v}"`).join("\n") : "  []";
 }

 function buildRawContent(row: Record<string, unknown>): string {
   const triggers = JSON.parse(row.triggers as string ?? "[]") as string[];
-  const tools    = JSON.parse(row.tools    as string ?? "[]") as string[];
-  const compat   = JSON.parse(row.compatibility as string ?? '["claude"]') as string[];
-  const deps     = JSON.parse(row.dependencies  as string ?? "[]") as string[];
-  const author   = row.author_handle ? `\nauthor: "${row.author_handle}"` : "";
+  const tools = JSON.parse(row.tools as string ?? "[]") as string[];
+  const compat = JSON.parse(row.compatibility as string ?? '["claude"]') as string[];
+  const deps = JSON.parse(row.dependencies as string ?? "[]") as string[];
+  const author = row.author_handle ? `\nauthor: "${row.author_handle}"` : "";

   return `---
 name: "${row.name}"
 description: "${(row.description as string).replace(/"/g, '\\"')}"
 version: "${row.version ?? "1.0.0"}"
 schema_version: "${row.schema_version ?? "1.1"}"${author}
 metadata:
   type: ${row.type}
   triggers:
 ${yamlList(triggers)}
@@ -36,24 +49,24 @@ ${deps.length ? deps.map((d) => `  - "${d}"`).join("\n") : "  []"}
 ${row.description}

 ## Usage

 Invoke this skill to use its capabilities.
 `;
 }

 function parseSkill(row: Record<string, unknown>) {
   const triggers = JSON.parse(row.triggers as string ?? "[]");
-  const tools    = JSON.parse(row.tools    as string ?? "[]");
-  const compat   = JSON.parse(row.compatibility as string ?? '["claude"]');
-  const deps     = JSON.parse(row.dependencies  as string ?? "[]");
-  const raw      = (row.raw_content as string) || buildRawContent(row);
+  const tools = JSON.parse(row.tools as string ?? "[]");
+  const compat = JSON.parse(row.compatibility as string ?? '["claude"]');
+  const deps = JSON.parse(row.dependencies as string ?? "[]");
+  const raw = (row.raw_content as string) || buildRawContent(row);

   return {
     id: row.id,
     slug: row.slug,
     name: row.name,
     description: row.description,
     type: row.type,
     authorHandle: row.author_handle,
     version: row.version,
     schemaVersion: row.schema_version,
@@ -62,98 +75,84 @@ function parseSkill(row: Record<string, unknown>) {
     compatibility: compat,
     dependencies: deps,
     rawContent: raw,
     status: row.status,
     installCount: row.install_count,
     createdAt: row.created_at,
     publishedAt: row.published_at,
   };
 }

-export async function GET(
-  _req: NextRequest,
-  { params }: { params: Promise<{ slug: string }> }
-) {
-  const { slug } = await params;
-  const result = await client.execute({
-    sql: `SELECT * FROM skills WHERE slug = ? AND status = 'published' LIMIT 1`,
-    args: [slug],
-  });
-
-  if (result.rows.length === 0) {
-    return NextResponse.json({ error: "Not found" }, { status: 404 });
-  }
-
-  return NextResponse.json(parseSkill(result.rows[0] as Record<string, unknown>));
-}
+export function createSkillDetailHandlers(dependencies: Partial<RouteDependencies> = {}) {
+  const getSession = dependencies.getSession ?? auth;
+  const database = dependencies.database ?? client;
+  const create = dependencies.create ?? createReviewRequest;
+  const update = dependencies.update ?? updateReviewRequest;

-export async function PATCH(
-  req: NextRequest,
-  { params }: { params: Promise<{ slug: string }> }
-) {
-  const { slug } = await params;
-
-  const existing = await client.execute({
-    sql: "SELECT id FROM skills WHERE slug = ?",
-    args: [slug],
-  });
-  if (existing.rows.length === 0) {
-    return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
-  }
+  async function GET(_req: NextRequest, { params }: RouteContext) {
+    const { slug } = await params;
+    const result = await database.execute({
+      sql: `SELECT * FROM skills WHERE slug = ? AND status = 'published' LIMIT 1`,
+      args: [slug],
+    });

-  const { rawContent } = await req.json();
-  if (!rawContent || typeof rawContent !== "string") {
-    return NextResponse.json({ error: "rawContent requerido" }, { status: 400 });
-  }
+    if (result.rows.length === 0) {
+      return NextResponse.json({ error: "Not found" }, { status: 404 });
+    }

-  const parsed = matter(rawContent);
-  const fmResult = validateSkillFrontmatter(parsed.data);
-  if (!fmResult.valid) {
-    return NextResponse.json(
-      { error: "Frontmatter inválido", errors: fmResult.errors },
-      { status: 422 }
-    );
+    return NextResponse.json(parseSkill(result.rows[0] as Record<string, unknown>));
   }

-  const fm = fmResult.parsed!;
-  const now = Math.floor(Date.now() / 1000);
-
-  await client.execute({
-    sql: `UPDATE skills SET
-      name = ?, description = ?, type = ?, author_handle = ?,
-      version = ?, schema_version = ?,
-      triggers = ?, tools = ?, compatibility = ?, dependencies = ?,
-      raw_content = ?, updated_at = ?
-      WHERE slug = ?`,
-    args: [
-      fm.name,
-      fm.description,
-      fm.metadata.type,
-      fm.author ?? null,
-      fm.version ?? "1.0.0",
-      fm.schema_version ?? "1.1",
-      JSON.stringify(fm.metadata.triggers),
-      JSON.stringify(fm.metadata.tools ?? []),
-      JSON.stringify(fm.compatibility ?? ["claude"]),
-      JSON.stringify(fm.dependencies ?? []),
-      rawContent,
-      now,
-      slug,
-    ],
-  });
-
-  // Record version snapshot
-  const skillRow = await client.execute({
-    sql: "SELECT id FROM skills WHERE slug = ?",
-    args: [slug],
-  });
-  if (skillRow.rows.length > 0) {
-    const skillId = skillRow.rows[0].id;
-    await client.execute({
-      sql: `INSERT INTO skill_versions (skill_id, version, raw_content, created_at)
-            VALUES (?, ?, ?, ?)`,
-      args: [skillId, fm.version ?? "1.0.0", rawContent, now],
-    }).catch(() => {}); // graceful if table schema differs
+  async function PATCH(req: NextRequest, { params }: RouteContext) {
+    const session = await getSession();
+    const actor = session ? actorFromSession(session) : null;
+    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
+
+    const { slug } = await params;
+    const skill = await database.execute({
+      sql: "SELECT id, raw_content FROM skills WHERE slug = ? AND status = 'published' LIMIT 1",
+      args: [slug],
+    });
+    if (skill.rows.length === 0) {
+      return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
+    }
+
+    const input = await skillSubmissionBody(req);
+    if (!input) return NextResponse.json({ error: "rawContent y files[] inválidos" }, { status: 400 });
+
+    try {
+      const skillId = Number(skill.rows[0].id);
+      const files = input.files === undefined
+        ? (await database.execute({
+          sql: "SELECT path, file_type, content FROM skill_files WHERE skill_id = ? ORDER BY file_type, path",
+          args: [skillId],
+        })).rows.map((file) => ({
+          path: String(file.path),
+          fileType: file.file_type as "resource" | "script",
+          content: String(file.content),
+          changeType: "unchanged" as const,
+        }))
+        : input.files;
+      const reviewInput = { ...input, files };
+      const openRequest = await database.execute({
+        sql: `SELECT id FROM skill_review_requests
+          WHERE skill_id = ? AND author_id = ? AND status IN ('pending', 'changes_requested')
+          ORDER BY id DESC LIMIT 1`,
+        args: [skillId, actor.id],
+      });
+      const request = openRequest.rows.length > 0
+        ? await update(Number(openRequest.rows[0].id), reviewInput, actor, database)
+        : await create({ ...reviewInput, skillId }, actor, database);
+
+      return NextResponse.json(
+        { slug: request.slug, reviewRequestId: request.id, status: request.status },
+        { status: 201 }
+      );
+    } catch (error) {
+      return errorResponse(error);
+    }
   }

-  return NextResponse.json({ slug, updated: now });
+  return { GET, PATCH };
 }
+
+export const { GET, PATCH } = createSkillDetailHandlers();
diff --git a/src/app/api/skills/route.ts b/src/app/api/skills/route.ts
index a0420ab..4ef8bb5 100644
--- a/src/app/api/skills/route.ts
+++ b/src/app/api/skills/route.ts
@@ -1,14 +1,65 @@
 import { NextRequest, NextResponse } from "next/server";
+import { auth } from "@/auth";
 import { client } from "@/lib/db";
-import matter from "gray-matter";
-import { validateSkillFrontmatter, validateBodySections } from "@/lib/skill-schema";
+import { createReviewRequest } from "@/lib/review/service";
+import type { CreateReviewRequestInput, ReviewActor, ReviewDatabaseClient, ReviewFileInput, ReviewRequest } from "@/lib/review/types";
+import { actorFromSession, errorResponse } from "../review-requests/route-utils";
+import type { Session } from "next-auth";
+
+type RouteDependencies = {
+  getSession: () => Promise<Session | null>;
+  database: ReviewDatabaseClient;
+  create: (input: CreateReviewRequestInput, actor: ReviewActor, database: ReviewDatabaseClient) => Promise<ReviewRequest>;
+};
+
+function parseFiles(value: unknown): ReviewFileInput[] | null | undefined {
+  if (value === undefined) return undefined;
+  if (!Array.isArray(value)) return null;
+  const files: ReviewFileInput[] = [];
+  for (const file of value) {
+    if (!file || typeof file !== "object") return null;
+    const entry = file as Record<string, unknown>;
+    if (
+      typeof entry.path !== "string" ||
+      (entry.fileType !== "resource" && entry.fileType !== "script") ||
+      (entry.content !== undefined && typeof entry.content !== "string") ||
+      (entry.changeType !== undefined && !["added", "modified", "deleted", "unchanged"].includes(String(entry.changeType)))
+    ) {
+      return null;
+    }
+    files.push({
+      path: entry.path,
+      fileType: entry.fileType,
+      ...(typeof entry.content === "string" ? { content: entry.content } : {}),
+      ...(entry.changeType !== undefined ? { changeType: entry.changeType as ReviewFileInput["changeType"] } : {}),
+    });
+  }
+  return files;
+}
+
+export async function skillSubmissionBody(request: Request): Promise<CreateReviewRequestInput | null> {
+  let body: unknown;
+  try {
+    body = await request.json();
+  } catch {
+    return null;
+  }
+  if (!body || typeof body !== "object") return null;
+  const { rawContent, files } = body as Record<string, unknown>;
+  const parsedFiles = parseFiles(files);
+  if (typeof rawContent !== "string" || !rawContent || parsedFiles === null) return null;
+  return {
+    rawContent,
+    ...(parsedFiles === undefined ? {} : { files: parsedFiles }),
+  };
+}

 function parseSkill(row: Record<string, unknown>) {
   return {
     id: row.id,
     slug: row.slug,
     name: row.name,
     description: row.description,
     type: row.type,
     authorHandle: row.author_handle,
     version: row.version,
@@ -16,103 +67,69 @@ function parseSkill(row: Record<string, unknown>) {
     tools: JSON.parse(row.tools as string ?? "[]"),
     compatibility: JSON.parse(row.compatibility as string ?? '["claude"]'),
     configRequirements: JSON.parse(row.config_requirements as string ?? "[]"),
     status: row.status,
     installCount: row.install_count,
     createdAt: row.created_at,
     publishedAt: row.published_at,
   };
 }

-export async function GET(req: NextRequest) {
-  const { searchParams } = req.nextUrl;
-  const q = searchParams.get("q") ?? "";
-  const type = searchParams.get("type") ?? "";
-  const sort = searchParams.get("sort") ?? "popular";
+export function createSkillHandlers(dependencies: Partial<RouteDependencies> = {}) {
+  const getSession = dependencies.getSession ?? auth;
+  const database = dependencies.database ?? client;
+  const create = dependencies.create ?? createReviewRequest;

-  let sql = `SELECT * FROM skills WHERE status = 'published'`;
-  const args: (string | number)[] = [];
+  async function GET(req: NextRequest) {
+    const { searchParams } = req.nextUrl;
+    const q = searchParams.get("q") ?? "";
+    const type = searchParams.get("type") ?? "";
+    const sort = searchParams.get("sort") ?? "popular";

-  if (q) {
-    sql += ` AND (name LIKE ? OR description LIKE ? OR triggers LIKE ?)`;
-    args.push(`%${q}%`, `%${q}%`, `%${q}%`);
-  }
-  if (type) {
-    sql += ` AND type = ?`;
-    args.push(type);
-  }
+    let sql = `SELECT * FROM skills WHERE status = 'published'`;
+    const args: (string | number)[] = [];

-  const orderMap: Record<string, string> = {
-    popular: "install_count DESC",
-    recent: "created_at DESC",
-    az: "name ASC",
-  };
-  sql += ` ORDER BY ${orderMap[sort] ?? "install_count DESC"}`;
+    if (q) {
+      sql += ` AND (name LIKE ? OR description LIKE ? OR triggers LIKE ?)`;
+      args.push(`%${q}%`, `%${q}%`, `%${q}%`);
+    }
+    if (type) {
+      sql += ` AND type = ?`;
+      args.push(type);
+    }

-  const result = await client.execute({ sql, args });
-  const skills = result.rows.map((r) => parseSkill(r as Record<string, unknown>));
+    const orderMap: Record<string, string> = {
+      popular: "install_count DESC",
+      recent: "created_at DESC",
+      az: "name ASC",
+    };
+    sql += ` ORDER BY ${orderMap[sort] ?? "install_count DESC"}`;

-  return NextResponse.json({ skills, total: skills.length });
-}
+    const result = await database.execute({ sql, args });
+    const skills = result.rows.map((r) => parseSkill(r as Record<string, unknown>));

-export async function POST(req: NextRequest) {
-  try {
-    const { rawContent } = await req.json();
-    if (!rawContent || typeof rawContent !== "string") {
-      return NextResponse.json({ error: "rawContent requerido" }, { status: 400 });
-    }
+    return NextResponse.json({ skills, total: skills.length });
+  }

-    const parsed = matter(rawContent);
-    const fmResult = validateSkillFrontmatter(parsed.data);
-    if (!fmResult.valid) {
-      return NextResponse.json(
-        { error: "Frontmatter inválido", errors: fmResult.errors },
-        { status: 422 }
-      );
-    }
+  async function POST(req: NextRequest) {
+    const session = await getSession();
+    const actor = session ? actorFromSession(session) : null;
+    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

-    const fm = fmResult.parsed!;
-    const now = Math.floor(Date.now() / 1000);
+    const input = await skillSubmissionBody(req);
+    if (!input) return NextResponse.json({ error: "rawContent y files[] inválidos" }, { status: 400 });

-    // Check for duplicate slug
-    const existing = await client.execute({
-      sql: "SELECT id FROM skills WHERE slug = ?",
-      args: [fm.name],
-    });
-    if (existing.rows.length > 0) {
+    try {
+      const request = await create(input, actor, database);
       return NextResponse.json(
-        { error: `Ya existe un skill con el nombre "${fm.name}"` },
-        { status: 409 }
+        { slug: request.slug, reviewRequestId: request.id, status: request.status },
+        { status: 201 }
       );
+    } catch (error) {
+      return errorResponse(error);
     }
-
-    await client.execute({
-      sql: `INSERT INTO skills
-        (slug, name, description, type, author_handle, version, schema_version,
-         triggers, tools, compatibility, dependencies, config_requirements, raw_content, status,
-         install_count, created_at, updated_at, published_at)
-        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 0, ?, ?, ?)`,
-      args: [
-        fm.name,
-        fm.name,
-        fm.description,
-        fm.metadata.type,
-        fm.author ?? null,
-        fm.version ?? "1.0.0",
-        fm.schema_version ?? "1.1",
-        JSON.stringify(fm.metadata.triggers),
-        JSON.stringify(fm.metadata.tools ?? []),
-        JSON.stringify(fm.compatibility ?? ["claude"]),
-        JSON.stringify(fm.dependencies ?? []),
-        JSON.stringify(fm.config_requirements ?? []),
-        rawContent,
-        now,
-        now,
-        now,
-      ],
-    });
-
-    return NextResponse.json({ slug: fm.name }, { status: 201 });
-  } catch (e) {
-    return NextResponse.json({ error: String(e) }, { status: 500 });
   }
+
+  return { GET, POST };
 }
+
+export const { GET, POST } = createSkillHandlers();
diff --git a/src/app/publish/page.tsx b/src/app/publish/page.tsx
index 2c501ea..2273b1a 100644
--- a/src/app/publish/page.tsx
+++ b/src/app/publish/page.tsx
@@ -1,13 +1,14 @@
 "use client";

 import { useState } from "react";
+import Link from "next/link";
 import { useRouter } from "next/navigation";
 import { WizardLayout } from "@/components/wizard/WizardLayout";
 import { Step1Metadata, MetadataFields } from "@/components/wizard/Step1Metadata";
 import { Step2Editor } from "@/components/wizard/Step2Editor";
 import { StepRequirements } from "@/components/wizard/StepRequirements";
 import { Step3Review } from "@/components/wizard/Step3Review";
 import { LocalSkillLoader, LoadedFile } from "@/components/wizard/LocalSkillLoader";
 import { getSkillTemplate } from "@/lib/skill-schema";

 const DEFAULT_META: MetadataFields = {
@@ -60,35 +61,26 @@ export default function PublishPage() {
   function handleMetaNext() {
     setContent(buildContent(meta));
     setStep(2);
   }

   async function handlePublish() {
     try {
       const res = await fetch("/api/skills", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
-        body: JSON.stringify({ rawContent: content }),
+        body: JSON.stringify({ rawContent: content, files: attachedFiles }),
       });
       const data = await res.json();
       if (!res.ok) return { ok: false, error: data.error ?? "Error del servidor" };

-      // Upload attached files if any
-      if (attachedFiles.length > 0) {
-        await fetch(`/api/skills/${data.slug}/files`, {
-          method: "POST",
-          headers: { "Content-Type": "application/json" },
-          body: JSON.stringify({ files: attachedFiles }),
-        }).catch(() => {}); // non-blocking
-      }
-
-      router.push(`/publish/success?slug=${data.slug}`);
+      router.push(`/publish/success?slug=${data.slug}&reviewRequestId=${data.reviewRequestId}`);
       return { ok: true, slug: data.slug };
     } catch (e) {
       return { ok: false, error: String(e) };
     }
   }

   // Step 0: loader screen (outside WizardLayout)
   if (step === 0) {
     return (
       <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
@@ -96,35 +88,35 @@ export default function PublishPage() {
         <div
           style={{
             height: "56px",
             borderBottom: "1px solid var(--border)",
             display: "flex",
             alignItems: "center",
             padding: "0 24px",
             gap: "12px",
           }}
         >
-          <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
+          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
             <span
               style={{
                 width: "24px", height: "24px", background: "var(--accent)", borderRadius: "4px",
                 display: "inline-flex", alignItems: "center", justifyContent: "center",
                 fontSize: "12px", color: "#fff", fontWeight: 700,
                 fontFamily: "var(--font-jetbrains-mono), monospace",
               }}
             >
               SV
             </span>
             <span style={{ fontFamily: "var(--font-geist), sans-serif", fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>
               SkillVault
             </span>
-          </a>
+          </Link>
           <span style={{ color: "var(--border)" }}>/</span>
           <span style={{ fontSize: "13px", color: "var(--muted)" }}>Publicar Skill</span>
         </div>

         <div style={{ maxWidth: "640px", margin: "48px auto", padding: "0 24px" }}>
           <LocalSkillLoader
             onLoaded={handleLoaded}
             onSkip={() => setStep(1)}
           />
         </div>
diff --git a/src/app/publish/success/page.tsx b/src/app/publish/success/page.tsx
index 9f8da23..1ed0492 100644
--- a/src/app/publish/success/page.tsx
+++ b/src/app/publish/success/page.tsx
@@ -1,18 +1,18 @@
 import Link from "next/link";

 interface Props {
-  searchParams: Promise<{ slug?: string }>;
+  searchParams: Promise<{ slug?: string; reviewRequestId?: string }>;
 }

 export default async function PublishSuccessPage({ searchParams }: Props) {
-  const { slug } = await searchParams;
+  const { slug, reviewRequestId } = await searchParams;

   return (
     <div
       style={{
         minHeight: "100vh",
         background: "var(--bg)",
         display: "flex",
         alignItems: "center",
         justifyContent: "center",
         padding: "40px 24px",
@@ -45,21 +45,21 @@ export default async function PublishSuccessPage({ searchParams }: Props) {

         <h1
           style={{
             fontFamily: "var(--font-geist), sans-serif",
             fontSize: "28px",
             fontWeight: 700,
             color: "var(--text)",
             marginBottom: "12px",
           }}
         >
-          ¡Skill publicado!
+          Pendiente de revision
         </h1>

         {slug && (
           <div
             style={{
               fontFamily: "var(--font-jetbrains-mono), monospace",
               fontSize: "14px",
               color: "var(--accent)",
               background: "var(--surface)",
               border: "1px solid var(--border)",
@@ -74,40 +74,40 @@ export default async function PublishSuccessPage({ searchParams }: Props) {
         )}

         <p
           style={{
             fontSize: "14px",
             color: "var(--muted)",
             lineHeight: 1.6,
             marginBottom: "32px",
           }}
         >
-          Tu skill ya está disponible en el catálogo. Otros desarrolladores pueden
-          descubrirlo, instalarlo y contribuir mejoras.
+          Tu propuesta fue enviada para revision. Estara disponible en el catálogo
+          cuando sea aprobada.
         </p>

         <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
-          {slug && (
+          {reviewRequestId && (
             <Link
-              href={`/skills/${slug}`}
+              href={`/dashboard/proposals/${reviewRequestId}`}
               style={{
                 fontFamily: "var(--font-geist), sans-serif",
                 fontSize: "13px",
                 fontWeight: 600,
                 padding: "10px 22px",
                 borderRadius: "4px",
                 background: "var(--accent)",
                 color: "#fff",
                 textDecoration: "none",
               }}
             >
-              Ver skill →
+              Ver propuesta →
             </Link>
           )}
           <Link
             href="/"
             style={{
               fontFamily: "var(--font-geist), sans-serif",
               fontSize: "13px",
               padding: "10px 22px",
               borderRadius: "4px",
               border: "1px solid var(--border)",
diff --git a/src/components/dashboard/SkillEditor.tsx b/src/components/dashboard/SkillEditor.tsx
index c4114a2..4cef8fd 100644
--- a/src/components/dashboard/SkillEditor.tsx
+++ b/src/components/dashboard/SkillEditor.tsx
@@ -216,41 +216,41 @@ export function SkillEditor({ slug, initialContent }: Props) {
             display: "flex",
             alignItems: "center",
             gap: "12px",
             justifyContent: "flex-end",
           }}
         >
           {saveError && (
             <span style={{ fontSize: "12px", color: "var(--red)", flex: 1 }}>{saveError}</span>
           )}
           {saveOk && (
-            <span style={{ fontSize: "12px", color: "var(--green)", flex: 1 }}>✓ Guardado correctamente</span>
+            <span style={{ fontSize: "12px", color: "var(--green)", flex: 1 }}>✓ Enviado a revision</span>
           )}
           <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", color: "var(--faint)" }}>
             {content.split("\n").length} líneas
           </span>
           <button
             onClick={handleSave}
             disabled={saving || !valid || !dirty}
             style={{
               fontFamily: "var(--font-geist), sans-serif",
               fontSize: "13px",
               fontWeight: 600,
               padding: "9px 22px",
               borderRadius: "4px",
               border: "none",
               background: valid && dirty && !saving ? "var(--accent)" : "var(--faint)",
               color: valid && dirty && !saving ? "#fff" : "var(--muted)",
               cursor: valid && dirty && !saving ? "pointer" : "not-allowed",
             }}
           >
-            {saving ? "Guardando…" : "Guardar cambios"}
+            {saving ? "Enviando…" : "Enviar a revision"}
           </button>
         </div>
       </div>

       {/* Validation sidebar */}
       <div style={{ position: "sticky", top: "72px" }}>
         <div
           style={{
             background: "var(--surface)",
             border: `1px solid ${errors.length > 0 ? "var(--red)" : warnings.length > 0 ? "var(--amber)" : "var(--green)"}`,
diff --git a/src/components/wizard/Step3Review.tsx b/src/components/wizard/Step3Review.tsx
index 1a9d8b2..2166075 100644
--- a/src/components/wizard/Step3Review.tsx
+++ b/src/components/wizard/Step3Review.tsx
@@ -315,21 +315,21 @@ export function Step3Review({ content, attachedFiles = [], onBack, onPublish }:
             borderRadius: "4px",
             border: "none",
             background: publishing ? "var(--faint)" : "var(--accent)",
             color: "#fff",
             cursor: publishing ? "not-allowed" : "pointer",
             display: "flex",
             alignItems: "center",
             gap: "8px",
           }}
         >
-          {publishing ? "Publicando…" : "Publicar skill →"}
+          {publishing ? "Enviando…" : "Enviar a revision"}
         </button>
       </div>
     </div>
   );
 }

 function SectionLabel({ children }: { children: React.ReactNode }) {
   return (
     <div
       style={{
diff --git a/src/lib/review/api-contract.test.ts b/src/lib/review/api-contract.test.ts
index 35845a6..570c08b 100644
--- a/src/lib/review/api-contract.test.ts
+++ b/src/lib/review/api-contract.test.ts
@@ -1,34 +1,191 @@
 import assert from "node:assert/strict";
 import test from "node:test";
 import { NextRequest } from "next/server";
 import { createReviewRequestsHandlers } from "../../app/api/review-requests/route";
 import { createReviewDecisionHandlers } from "../../app/api/review-requests/[id]/decision/route";
+import { createSkillHandlers } from "../../app/api/skills/route";
+import { createSkillDetailHandlers } from "../../app/api/skills/[slug]/route";
+import { POST as postSkillFiles } from "../../app/api/skills/[slug]/files/route";
 import type { ReviewDatabaseClient, ReviewRequest } from "./types";

 const reviewerSession = {
   user: {
     id: "reviewer-1",
     name: "Reviewer",
     email: "reviewer@example.test",
     roles: ["reviewer"],
   },
 };

 const database: ReviewDatabaseClient = {
   async execute() {
     return { rows: [] };
   },
 };

 const context = { params: Promise.resolve({ id: "1" }) };

+const authorSession = {
+  user: {
+    id: "author-1",
+    name: "Author",
+    email: "author@example.test",
+    roles: ["author"],
+  },
+};
+
+const validRawContent = `---
+name: demo-skill
+description: A complete enough description for the demo review skill.
+version: 1.0.0
+schema_version: "1.1"
+metadata:
+  type: code
+  triggers:
+    - demo
+compatibility:
+  - claude
+---
+# Demo Skill
+
+## Descripcion
+
+Demo description.
+
+## Cuando usar
+
+Use this demo.
+
+## Instrucciones
+
+Follow these instructions.`;
+
+const updatedRawContent = validRawContent.replace("Follow these instructions.", "Follow the updated instructions.");
+
+function reviewRequest(overrides: Partial<ReviewRequest> = {}): ReviewRequest {
+  return {
+    id: 9,
+    skillId: null,
+    slug: "demo-skill",
+    name: "demo-skill",
+    description: "A complete enough description for the demo review skill.",
+    type: "code",
+    version: "1.0.0",
+    schemaVersion: "1.1",
+    authorId: "author-1",
+    authorHandle: "Author",
+    rawContent: validRawContent,
+    status: "pending",
+    reviewerId: null,
+    reviewerHandle: null,
+    generalComment: null,
+    submittedAt: 1,
+    reviewedAt: null,
+    updatedAt: 1,
+    ...overrides,
+  };
+}
+
+test("POST /api/skills creates a review request instead of a published skill", async () => {
+  const executedSql: string[] = [];
+  let createInput: unknown;
+  const { POST } = createSkillHandlers({
+    getSession: async () => authorSession as never,
+    database: {
+      async execute(input) {
+        executedSql.push(typeof input === "string" ? input : input.sql);
+        return { rows: [] };
+      },
+    },
+    create: async (input) => {
+      createInput = input;
+      return reviewRequest();
+    },
+  });
+
+  const response = await POST(new NextRequest("http://test/api/skills", {
+    method: "POST",
+    body: JSON.stringify({
+      rawContent: validRawContent,
+      files: [{ path: "resources/reference.md", fileType: "resource", content: "Reference" }],
+    }),
+  }));
+
+  assert.equal(response.status, 201);
+  assert.deepEqual(await response.json(), { slug: "demo-skill", reviewRequestId: 9, status: "pending" });
+  assert.deepEqual(createInput, {
+    rawContent: validRawContent,
+    files: [{ path: "resources/reference.md", fileType: "resource", content: "Reference" }],
+  });
+  assert.equal(executedSql.some((sql) => sql.includes("INSERT INTO skills")), false);
+});
+
+test("POST /api/skills/:slug/files is disabled while files are reviewed", async () => {
+  const response = await postSkillFiles(
+    new NextRequest("http://test/api/skills/demo-skill/files", {
+      method: "POST",
+      body: JSON.stringify({
+        files: [{ path: "resources/replaced.md", fileType: "resource", content: "Replacement" }],
+      }),
+    }),
+    { params: Promise.resolve({ slug: "demo-skill" }) }
+  );
+
+  assert.equal(response.status, 405);
+});
+
+test("PATCH /api/skills/:slug preserves published files when files are omitted", async () => {
+  const originalRawContent = validRawContent;
+  const publishedRawContent = originalRawContent;
+  const publishedFiles = [{ path: "resources/reference.md", fileType: "resource", content: "Reference" }];
+  let updateInput: unknown;
+  const { PATCH } = createSkillDetailHandlers({
+    getSession: async () => authorSession as never,
+    database: {
+      async execute(input) {
+        const sql = typeof input === "string" ? input : input.sql;
+        if (sql.includes("SELECT id, raw_content FROM skills")) {
+          return { rows: [{ id: 4, raw_content: publishedRawContent }] };
+        }
+        if (sql.includes("SELECT path, file_type, content FROM skill_files")) {
+          return { rows: [{ path: "resources/reference.md", file_type: "resource", content: "Reference" }] };
+        }
+        if (sql.includes("SELECT id FROM skill_review_requests")) {
+          return { rows: [{ id: 9 }] };
+        }
+        throw new Error(`Unexpected query: ${sql}`);
+      },
+    },
+    update: async (_id, input) => {
+      updateInput = input;
+      return reviewRequest({ skillId: 4, rawContent: updatedRawContent });
+    },
+  });
+
+  const response = await PATCH(
+    new NextRequest("http://test/api/skills/demo-skill", {
+      method: "PATCH",
+      body: JSON.stringify({ rawContent: updatedRawContent }),
+    }),
+    { params: Promise.resolve({ slug: "demo-skill" }) }
+  );
+
+  assert.equal(response.status, 201);
+  assert.deepEqual(await response.json(), { slug: "demo-skill", reviewRequestId: 9, status: "pending" });
+  assert.deepEqual(updateInput, {
+    rawContent: updatedRawContent,
+    files: [{ ...publishedFiles[0], changeType: "unchanged" }],
+  });
+  assert.equal(publishedRawContent, originalRawContent);
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

# Skill Version Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reject non-increasing version submissions on an already-published skill, archive attached files per version (not just the SKILL.md text), and let the UI show/download/roll back to any historical version.

**Architecture:** Extend `src/lib/review/service.ts` (the single chokepoint both `POST` and `PATCH /api/skills/[slug]` already funnel through) with a semver-ordering guard and a new `skill_version_files` table populated alongside the existing `skill_versions` archive inside `activateApprovedRequest()`. Add one new read-only route for historical version content, and extend the existing `VersionHistory` component to consume it.

**Tech Stack:** Next.js 16 App Router route handlers, Drizzle schema files (hand-authored, not drizzle-kit), `node:test` via `tsx --test`, React client components, CodeMirror (already a dependency), JSZip (already a dependency).

## Global Constraints

- Every DB schema change must be hand-authored in **both** `src/lib/db/schema.ts` (SQLite) and `src/lib/db/schema.mysql.ts` (MySQL) — `drizzle-kit` only tracks the SQLite file (see root `CLAUDE.md`).
- Migrations are idempotent hand-written scripts (`CREATE TABLE IF NOT EXISTS`), run via `tsx`, always in SQLite/MySQL pairs, added to `package.json` under `migrate:<name>` / `migrate:<name>:mysql`.
- The only automated test suite in the Next.js app is `pnpm test` = `tsx --test src/lib/review/*.test.ts`. No route handler anywhere in `src/app/api/**` currently has a dedicated test file (confirmed: `download/route.ts`, `versions/route.ts`, `files/route.ts` have none) — new routes in this plan follow that existing convention and are verified manually, not with a new test file/pattern.
- Every version submitted for an existing skill must satisfy `X.Y.Z` (semver) — already enforced by `semverOrDefault()` in `service.ts`; this plan adds ordering on top, not format validation.
- `errorResponse()` (`src/app/api/review-requests/route-utils.ts`) maps error status codes by lowercased substring match on `error.message` (`"not found"` → 404, `"invalid"` → 422, etc.). Any new thrown error message must be worded to hit the intended bucket — this plan uses the word "invalida" deliberately so it maps to 422.

---

### Task 1: Semver ordering guard in `createReviewRequest`

**Files:**
- Modify: `src/lib/review/service.ts:110-112` (near `semverOrDefault`) and `src/lib/review/service.ts:318-334` (`createReviewRequest`)
- Test: `src/lib/review/service.test.ts`

**Interfaces:**
- Produces: `compareSemver(a: string, b: string): number` (negative if `a < b`, 0 if equal, positive if `a > b`) and `assertVersionIsGreaterThanPublished(skillId: number, version: string, client: ReviewDatabaseClient): Promise<void>` — both used again in Task 2.

- [ ] **Step 1: Write the failing tests**

Add to `src/lib/review/service.test.ts`. First extend the shared fake client to support a configurable "currently published version" and add three new raw-content fixtures near the existing ones (after `malformedFrontmatterRawContent`, around line 58):

```ts
const higherVersionRawContent = `---
name: demo-skill
description: A complete enough description for the demo review skill.
version: 1.1.0
schema_version: "1.1"
metadata:
  type: code
  triggers:
    - demo
compatibility:
  - claude
---
# Demo Skill

## Descripcion

Demo description.

## Cuando usar

Use this demo.

## Instrucciones

Follow these instructions.`;

const sameVersionRawContent = higherVersionRawContent.replace("version: 1.1.0", "version: 1.0.0");
const lowerVersionRawContent = higherVersionRawContent.replace("version: 1.1.0", "version: 0.9.0");
```

Change the `createFakeClient` signature and body (around line 77-81 and the `execute` function around line 112) to accept a `publishedVersion` option and answer the new query:

```ts
function createFakeClient(
  files: Array<Record<string, unknown>> = [],
  requestOverrides: Partial<Record<string, unknown>> = {},
  options: { existingSkill?: boolean; publishedVersion?: string } = {}
): FakeClient {
```

Inside `execute`, add this branch (placed anywhere among the other `if (sql.includes(...))` branches — order doesn't matter since each checks a distinct substring):

```ts
      if (sql.includes("SELECT version FROM skills WHERE id = ?")) {
        return options.publishedVersion ? { rows: [{ version: options.publishedVersion }] } : { rows: [] };
      }
```

Now add the tests, after the existing `"rejects a new-skill submission when a skill with the same slug already exists"` test:

```ts
test("createReviewRequest rejects a version submission equal to the currently published version", async () => {
  await assert.rejects(
    () => createReviewRequest(
      { rawContent: sameVersionRawContent, files: [], acceptedResponsibility: true, skillId: 7 },
      authorActor,
      createFakeClient([], {}, { publishedVersion: "1.0.0" })
    ),
    /invalida/
  );
});

test("createReviewRequest rejects a version submission lower than the currently published version", async () => {
  await assert.rejects(
    () => createReviewRequest(
      { rawContent: lowerVersionRawContent, files: [], acceptedResponsibility: true, skillId: 7 },
      authorActor,
      createFakeClient([], {}, { publishedVersion: "1.0.0" })
    ),
    /invalida/
  );
});

test("createReviewRequest accepts a version submission greater than the currently published version", async () => {
  const fakeClient = createFakeClient([], {}, { publishedVersion: "1.0.0" });
  const request = await createReviewRequest(
    { rawContent: higherVersionRawContent, files: [], acceptedResponsibility: true, skillId: 7 },
    authorActor,
    fakeClient
  );
  assert.equal(request.status, "pending");
  assert.equal(fakeClient.insertedReviewRequest?.version, "1.1.0");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm exec tsx --test --test-name-pattern="currently published version" src/lib/review/service.test.ts`
Expected: FAIL — `compareSemver`/the new guard don't exist yet, so all three submissions succeed (the two "rejects" tests fail because nothing throws; TypeScript will also complain the `publishedVersion` option and new query branch are unused until Step 3, but the test file itself compiles since `options` is just a plain object).

- [ ] **Step 3: Implement the guard**

In `src/lib/review/service.ts`, add right after `semverOrDefault()` (currently lines 110-112):

```ts
function compareSemver(a: string, b: string): number {
  const [aMaj, aMin, aPatch] = a.split(".").map(Number);
  const [bMaj, bMin, bPatch] = b.split(".").map(Number);
  if (aMaj !== bMaj) return aMaj - bMaj;
  if (aMin !== bMin) return aMin - bMin;
  return aPatch - bPatch;
}

async function assertVersionIsGreaterThanPublished(
  skillId: number,
  version: string,
  client: ReviewDatabaseClient
): Promise<void> {
  const currentSkill = await client.execute({
    sql: "SELECT version FROM skills WHERE id = ?",
    args: [skillId],
  });
  if (currentSkill.rows.length === 0) return;
  const currentVersion = String(currentSkill.rows[0].version);
  if (compareSemver(version, currentVersion) <= 0) {
    throw new Error(`Version invalida: ${version} debe ser mayor a la version publicada actual (${currentVersion})`);
  }
}
```

In `createReviewRequest()` (currently lines 326-334), change:

```ts
  if (!input.skillId) {
    const existingSkill = await client.execute({
      sql: "SELECT id FROM skills WHERE slug = ?",
      args: [frontmatter.name],
    });
    if (existingSkill.rows.length > 0) {
      throw new Error("A skill with this slug already exists — submit a new version instead");
    }
  }
```

to:

```ts
  if (!input.skillId) {
    const existingSkill = await client.execute({
      sql: "SELECT id FROM skills WHERE slug = ?",
      args: [frontmatter.name],
    });
    if (existingSkill.rows.length > 0) {
      throw new Error("A skill with this slug already exists — submit a new version instead");
    }
  } else {
    await assertVersionIsGreaterThanPublished(input.skillId, frontmatter.version, client);
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec tsx --test src/lib/review/service.test.ts`
Expected: PASS — all tests, including the 3 new ones and every pre-existing test (the new fake-client branch and `publishedVersion` option are additive and default to the old behavior when unset).

- [ ] **Step 5: Commit**

```bash
git add src/lib/review/service.ts src/lib/review/service.test.ts
git commit -m "feat: reject new-version submissions that do not increase the published semver"
```

---

### Task 2: Same guard in `updateReviewRequest`

**Files:**
- Modify: `src/lib/review/service.ts:376-406` (`updateReviewRequest`)
- Test: `src/lib/review/service.test.ts`

**Interfaces:**
- Consumes: `assertVersionIsGreaterThanPublished()` from Task 1 (same signature).

**Context:** `updateReviewRequest` is the path taken when an author edits an *already-open* pending/changes_requested request (see `PATCH /api/skills/[slug]route.ts:142-144` — it calls `update` instead of `create` when an open request already exists). If the author changes the version field while iterating on that open request, it must be checked the same way. The request row's own `skillId` (set at creation time, from `getRequestRow`) tells us which skill it targets.

- [ ] **Step 1: Write the failing test**

Add to `src/lib/review/service.test.ts`, after the Task 1 tests:

```ts
test("updateReviewRequest rejects lowering the version below the currently published version", async () => {
  const fakeClient = createFakeClient([], { skill_id: 7 }, { publishedVersion: "1.0.0" });
  await assert.rejects(
    () => updateReviewRequest(1, { rawContent: sameVersionRawContent, files: [] }, authorActor, fakeClient),
    /invalida/
  );
});

test("updateReviewRequest accepts raising the version above the currently published version", async () => {
  const fakeClient = createFakeClient([], { skill_id: 7 }, { publishedVersion: "1.0.0" });
  const request = await updateReviewRequest(1, { rawContent: higherVersionRawContent, files: [] }, authorActor, fakeClient);
  assert.equal(request.status, "pending");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec tsx --test --test-name-pattern="updateReviewRequest" src/lib/review/service.test.ts`
Expected: FAIL — the "rejects lowering" test fails because nothing throws yet.

- [ ] **Step 3: Implement**

In `updateReviewRequest()` (currently lines 376-384), change:

```ts
export async function updateReviewRequest(
  id: number,
  input: UpdateReviewRequestInput,
  actor: ReviewActor,
  client: ReviewDatabaseClient
): Promise<ReviewRequest> {
  const request = await getRequestRow(id, client);
  assertCanEditRequest(actor, request);
  const { frontmatter, files } = relaxedSubmission(input.rawContent, input.files);
```

to:

```ts
export async function updateReviewRequest(
  id: number,
  input: UpdateReviewRequestInput,
  actor: ReviewActor,
  client: ReviewDatabaseClient
): Promise<ReviewRequest> {
  const request = await getRequestRow(id, client);
  assertCanEditRequest(actor, request);
  const { frontmatter, files } = relaxedSubmission(input.rawContent, input.files);
  if (request.skillId) {
    await assertVersionIsGreaterThanPublished(request.skillId, frontmatter.version, client);
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec tsx --test src/lib/review/service.test.ts`
Expected: PASS — all tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/review/service.ts src/lib/review/service.test.ts
git commit -m "feat: apply the semver ordering guard to updateReviewRequest too"
```

---

### Task 3: `skill_version_files` table (schema + migrations)

**Files:**
- Modify: `src/lib/db/schema.ts:36-43` (after `skillFiles`)
- Modify: `src/lib/db/schema.mysql.ts:37-44` (after `skillFiles`)
- Create: `src/lib/db/migrate-skill-version-files.ts`
- Create: `src/lib/db/migrate-skill-version-files-mysql.ts`
- Modify: `package.json` (scripts block)

**Interfaces:**
- Produces: table `skill_version_files(id, skill_version_id, path, file_type, content, created_at)` in both dialects, consumed by Task 4 (writer) and Task 5 (reader).

- [ ] **Step 1: Add the SQLite Drizzle table**

In `src/lib/db/schema.ts`, after the `skillFiles` export (currently ends at line 43), add:

```ts
export const skillVersionFiles = sqliteTable("skill_version_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skillVersionId: integer("skill_version_id").notNull(),
  path: text("path").notNull(),
  fileType: text("file_type").notNull(), // "resource" | "script"
  content: text("content").notNull().default(""),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});
```

- [ ] **Step 2: Add the MySQL Drizzle table**

In `src/lib/db/schema.mysql.ts`, after the `skillFiles` export (currently ends at line 44), add:

```ts
export const skillVersionFiles = mysqlTable("skill_version_files", {
  id: int("id").autoincrement().primaryKey(),
  skillVersionId: int("skill_version_id").notNull(),
  path: varchar("path", { length: 500 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  content: text("content").notNull().default(""),
  createdAt: bigint("created_at", { mode: "number" }).notNull().default(0),
});
```

- [ ] **Step 3: Write the SQLite migration**

Create `src/lib/db/migrate-skill-version-files.ts`:

```ts
import { client } from "./index";

async function migrate() {
  await client.execute(`CREATE TABLE IF NOT EXISTS skill_version_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_version_id INTEGER NOT NULL,
    path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`);

  await client.execute("CREATE INDEX IF NOT EXISTS idx_skill_version_files_skill_version_id ON skill_version_files(skill_version_id)");

  const table = await client.execute({
    sql: `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    args: ["skill_version_files"],
  });
  if (table.rows.length !== 1) {
    throw new Error("skill_version_files table missing");
  }

  console.log("Skill version files SQLite migration complete.");
  await client.close();
}

migrate().catch(async (error) => {
  console.error(error);
  await client.close();
  process.exit(1);
});
```

- [ ] **Step 4: Write the MySQL migration**

Create `src/lib/db/migrate-skill-version-files-mysql.ts`:

```ts
import { client } from "./index";

async function createIndex(sql: string) {
  try {
    await client.execute(sql);
  } catch (error) {
    if ((error as { errno?: number }).errno !== 1061) {
      throw error;
    }
  }
}

async function migrate() {
  await client.execute(`CREATE TABLE IF NOT EXISTS skill_version_files (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    skill_version_id INT NOT NULL,
    path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    content LONGTEXT NOT NULL,
    created_at BIGINT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await createIndex("CREATE INDEX idx_skill_version_files_skill_version_id ON skill_version_files(skill_version_id)");

  console.log("Skill version files MySQL migration complete.");
  await client.close();
}

migrate().catch(async (error) => {
  console.error(error);
  await client.close();
  process.exit(1);
});
```

- [ ] **Step 5: Register the npm scripts**

In `package.json`, in the `scripts` block, add these two lines right after `"migrate:skill-ratings:mysql"`:

```json
    "migrate:skill-version-files": "tsx src/lib/db/migrate-skill-version-files.ts",
    "migrate:skill-version-files:mysql": "tsx src/lib/db/migrate-skill-version-files-mysql.ts",
```

- [ ] **Step 6: Run the migration against the local SQLite DB and verify**

Run: `pnpm run migrate:skill-version-files`
Expected output: `Skill version files SQLite migration complete.`

Verify the table exists:
Run: `pnpm exec tsx -e "import('./src/lib/db/index.js').then(async ({client}) => { const r = await client.execute(\"SELECT name FROM sqlite_master WHERE type='table' AND name='skill_version_files'\"); console.log(r.rows); await client.close(); })"`
Expected: prints one row with `name: 'skill_version_files'`.

(This project's `tsx -e` needs an `import()` wrapper for top-level await — same constraint hit earlier in this project's history; if it errors on ESM/CJS, instead write a throwaway script file, run it with `pnpm exec tsx path/to/script.ts`, and delete it after.)

- [ ] **Step 7: Commit**

```bash
git add src/lib/db/schema.ts src/lib/db/schema.mysql.ts src/lib/db/migrate-skill-version-files.ts src/lib/db/migrate-skill-version-files-mysql.ts package.json
git commit -m "feat: add skill_version_files table (SQLite + MySQL)"
```

---

### Task 4: Archive attached files on every approval

**Files:**
- Modify: `src/lib/review/service.ts` (`activateApprovedRequest`, currently lines 222-316)
- Test: `src/lib/review/service.test.ts`

**Interfaces:**
- Consumes: `skill_version_files` table from Task 3.
- Produces: every call to `activateApprovedRequest()` (reached via `decideReviewRequest(..., { decision: "approve" }, ...)`) now also populates `skill_version_files` for the version it just archived into `skill_versions`.

- [ ] **Step 1: Write the failing test**

Add to `src/lib/review/service.test.ts`. First add `insertedVersionFiles: Array<Record<string, unknown>>` to the `FakeClient` type (next to `insertedFiles`, currently line 68) and initialize it in `createFakeClient` (next to `insertedFiles: []`, currently line 106):

```ts
  insertedVersionFiles: Array<Record<string, unknown>>;
```
```ts
    insertedVersionFiles: [],
```

Add two new branches inside `execute` (near the existing `INSERT INTO skill_versions` branch, currently lines 162-166):

```ts
      if (sql.includes("SELECT id FROM skill_versions WHERE skill_id = ? AND version = ?")) {
        return { rows: [{ id: 42 }] };
      }
      if (sql.includes("INSERT INTO skill_version_files")) {
        fakeClient.insertedVersionFiles.push({ skillVersionId: args[0], path: args[1], fileType: args[2], content: args[3] });
        return { rows: [] };
      }
```

Now the test, after the existing `"approval accepts relaxed draft content and publishes successfully"` test:

```ts
test("approval archives attached files into skill_version_files, excluding deleted ones", async () => {
  const fakeClient = createFakeClient([
    { id: 1, review_request_id: 1, path: "resources/reference.md", file_type: "resource", content: "hello", change_type: "added", created_at: 1 },
    { id: 2, review_request_id: 1, path: "scripts/old.sh", file_type: "script", content: "gone", change_type: "deleted", created_at: 1 },
  ], {
    slug: "draft-skill",
    name: "draft-skill",
    description: "Skill enviado a revision sin descripcion validada.",
    raw_content: relaxedRawContent,
  });

  await decideReviewRequest(1, { decision: "approve" }, reviewerActor, fakeClient);

  assert.equal(fakeClient.insertedVersionFiles.length, 1);
  assert.equal(fakeClient.insertedVersionFiles[0].path, "resources/reference.md");
  assert.equal(fakeClient.insertedVersionFiles[0].skillVersionId, 42);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec tsx --test --test-name-pattern="archives attached files" src/lib/review/service.test.ts`
Expected: FAIL — `insertedVersionFiles` stays empty, `assert.equal(fakeClient.insertedVersionFiles.length, 1)` fails with `0 !== 1`.

- [ ] **Step 3: Implement**

In `src/lib/review/service.ts`, inside `activateApprovedRequest()`, find the existing block (currently lines 305-308):

```ts
  await client.execute({
      sql: "INSERT INTO skill_versions (skill_id, version, raw_content, created_at) VALUES (?, ?, ?, ?)",
      args: [skillId, request.version, request.rawContent, publishedAt],
  });
```

Replace it with:

```ts
  await client.execute({
      sql: "INSERT INTO skill_versions (skill_id, version, raw_content, created_at) VALUES (?, ?, ?, ?)",
      args: [skillId, request.version, request.rawContent, publishedAt],
  });
  const insertedVersion = await client.execute({
      sql: "SELECT id FROM skill_versions WHERE skill_id = ? AND version = ? ORDER BY id DESC LIMIT 1",
      args: [skillId, request.version],
  });
  if (insertedVersion.rows.length === 0) throw new Error("activation failed: skill version was not created");
  const skillVersionId = asNumber(insertedVersion.rows[0].id);
  for (const file of reviewFiles.rows.map(toFile)) {
    if (file.changeType === "deleted") continue;
    await client.execute({
      sql: "INSERT INTO skill_version_files (skill_version_id, path, file_type, content) VALUES (?, ?, ?, ?)",
      args: [skillVersionId, file.path, file.fileType, file.content],
    });
  }
```

Note: `reviewFiles.rows.map(toFile)` is already computed once earlier in the function (used a few lines above for the `skill_files` replace loop) — this reuses that same array, no new query against `skill_review_files`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec tsx --test src/lib/review/service.test.ts`
Expected: PASS — all tests, including every pre-existing approval test (they all still hit the new `SELECT id FROM skill_versions...` / `INSERT INTO skill_version_files` branches harmlessly since those tests pass `files: []` by default, so the loop body never runs for them).

- [ ] **Step 5: Commit**

```bash
git add src/lib/review/service.ts src/lib/review/service.test.ts
git commit -m "feat: archive attached files per version alongside skill_versions"
```

---

### Task 5: Read endpoint for a historical version

**Files:**
- Create: `src/app/api/skills/[slug]/versions/[version]/route.ts`

**Interfaces:**
- Produces: `GET /api/skills/{slug}/versions/{version}` → `200 { version: string, createdAt: number, rawContent: string, files: Array<{ path: string, fileType: string, content: string }> }` or `404 { error: string }`. Consumed by Task 6 (UI).

**Context:** No test file — matches the existing convention that sibling routes (`download/route.ts`, `versions/route.ts`, `files/route.ts`) have none; `pnpm test` only covers `src/lib/review/*.test.ts` (see Global Constraints). Verified manually in Step 2.

- [ ] **Step 1: Implement the route**

Create `src/app/api/skills/[slug]/versions/[version]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/db";
import type { ReviewDatabaseClient } from "@/lib/review/types";

type RouteDependencies = { database: ReviewDatabaseClient };

export function createSkillVersionDetailHandlers(dependencies: Partial<RouteDependencies> = {}) {
  const database = dependencies.database ?? client;

  async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ slug: string; version: string }> }
  ) {
    const { slug, version } = await params;

    const versionRow = await database.execute({
      sql: `SELECT sv.id, sv.version, sv.raw_content, sv.created_at
            FROM skill_versions sv
            JOIN skills s ON s.id = sv.skill_id
            WHERE s.slug = ? AND sv.version = ?
            LIMIT 1`,
      args: [slug, version],
    });
    if (versionRow.rows.length === 0) {
      return NextResponse.json({ error: "Version no encontrada" }, { status: 404 });
    }

    const row = versionRow.rows[0];
    const skillVersionId = row.id as number;

    const filesRow = await database.execute({
      sql: "SELECT path, file_type, content FROM skill_version_files WHERE skill_version_id = ? ORDER BY file_type, path",
      args: [skillVersionId],
    });

    return NextResponse.json({
      version: row.version as string,
      createdAt: Number(row.created_at),
      rawContent: row.raw_content as string,
      files: filesRow.rows.map((f) => ({
        path: f.path as string,
        fileType: f.file_type as string,
        content: f.content as string,
      })),
    });
  }

  return { GET };
}

export const { GET } = createSkillVersionDetailHandlers();
```

- [ ] **Step 2: Manually verify against the local dev server**

Run: `pnpm dev --port 3010` (in a background terminal), then in another terminal, publish at least two versions of a test skill so `skill_versions`/`skill_version_files` are populated (or use `k8s-cluster-diagnostic` / any already-published skill and re-publish a bumped version through `/skills/<slug>/edit` to exercise Task 1-4's new path end to end).

Run: `curl -s http://localhost:3010/api/skills/<slug>/versions/1.0.0`
Expected: `200` with `{ version: "1.0.0", createdAt: <number>, rawContent: "...", files: [...] }`.

Run: `curl -s -w "\n%{http_code}\n" http://localhost:3010/api/skills/<slug>/versions/9.9.9`
Expected: `404` with `{ "error": "Version no encontrada" }`.

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/skills/[slug]/versions/[version]/route.ts"
git commit -m "feat: add read endpoint for a skill's historical version content"
```

---

### Task 6: View and download a historical version in the UI

**Files:**
- Modify: `src/components/dashboard/VersionHistory.tsx`

**Interfaces:**
- Consumes: `GET /api/skills/{slug}/versions/{version}` from Task 5.
- Produces: exported `VersionHistory` gains an internal expand/collapse per row; no prop signature change in this task (Task 7 adds a prop).

**Note on scope:** the design doc suggested reusing the server-side JSZip pattern from `download/route.ts` for per-version downloads. This plan instead builds the zip client-side with the already-installed `jszip` package, directly from the JSON this component already has to fetch anyway — it avoids a second server route for a capability the next spec (zip-download-as-install-alternative) may reshape anyway, and `jszip` works the same in the browser as in a route handler.

- [ ] **Step 1: Add expand state and fetch-on-expand**

In `src/components/dashboard/VersionHistory.tsx`, change the `Version` interface and component state (currently lines 5-17):

```ts
interface Version {
  version: string;
  createdAt: number;
}

interface VersionDetail {
  version: string;
  createdAt: number;
  rawContent: string;
  files: Array<{ path: string; fileType: string; content: string }>;
}

interface Props {
  slug: string;
  refreshKey?: number;
}

export function VersionHistory({ slug, refreshKey }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<VersionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
```

Add this function after the existing `useEffect` that fetches `versions` (currently lines 19-26):

```ts
  async function toggleExpand(version: string) {
    if (expanded === version) {
      setExpanded(null);
      setDetail(null);
      return;
    }
    setExpanded(version);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/skills/${slug}/versions/${version}`);
      const data = await res.json();
      setDetail(res.ok ? data : null);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function downloadVersion() {
    if (!detail) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const folder = zip.folder(`${slug}-${detail.version}`)!;
    folder.file("SKILL.md", detail.rawContent);
    for (const f of detail.files) {
      folder.file(f.path, f.content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-${detail.version}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }
```

- [ ] **Step 2: Wire the expand/download UI into each row**

In the row-rendering `.map()` (currently lines 77-132), make each row clickable and, when `expanded === v.version`, render the fetched detail below it. Replace the row `<div>` (currently lines 78-131) with:

```tsx
          <div key={i}>
            <div
              onClick={() => toggleExpand(v.version)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "9px 16px",
                borderBottom: expanded === v.version ? "none" : (i === versions.length - 1 ? "none" : "1px solid var(--border)"),
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {i === 0 && (
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "9px",
                      letterSpacing: "0.5px",
                      padding: "1px 5px",
                      borderRadius: "3px",
                      border: "1px solid var(--green)",
                      color: "var(--green)",
                      background: "rgba(46,204,138,0.08)",
                    }}
                  >
                    actual
                  </span>
                )}
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "12px",
                    color: i === 0 ? "var(--text)" : "var(--muted)",
                    fontWeight: i === 0 ? 600 : 400,
                  }}
                >
                  v{v.version}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "11px",
                  color: "var(--faint)",
                }}
              >
                {new Date(v.createdAt * 1000).toLocaleDateString("es", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {expanded === v.version && (
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: i === versions.length - 1 ? "none" : "1px solid var(--border)",
                  background: "var(--bg)",
                }}
              >
                {detailLoading && (
                  <div style={{ fontSize: "11px", color: "var(--muted)" }}>Cargando...</div>
                )}
                {!detailLoading && !detail && (
                  <div style={{ fontSize: "11px", color: "var(--red)" }}>No se pudo cargar esta version.</div>
                )}
                {!detailLoading && detail && (
                  <>
                    <pre
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: "11px",
                        color: "var(--text)",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "4px",
                        padding: "10px",
                        maxHeight: "260px",
                        overflow: "auto",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {detail.rawContent}
                    </pre>
                    {detail.files.length > 0 && (
                      <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "6px" }}>
                        {detail.files.length} archivo{detail.files.length > 1 ? "s" : ""} adjunto{detail.files.length > 1 ? "s" : ""}: {detail.files.map((f) => f.path).join(", ")}
                      </div>
                    )}
                    <button
                      onClick={downloadVersion}
                      style={{
                        marginTop: "8px",
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: "11px",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        color: "var(--accent)",
                        cursor: "pointer",
                      }}
                    >
                      Descargar .zip
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
```

- [ ] **Step 3: Manually verify in the browser**

Run: `pnpm dev --port 3010`, open `/skills/<slug-with-2-plus-versions>/edit`, click a version row in "Historial de versiones".
Expected: row expands, shows the `SKILL.md` text and file list for that version, "Descargar .zip" downloads a `.zip` containing `SKILL.md` (and any attached files) for that specific version.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/VersionHistory.tsx
git commit -m "feat: view and download a historical skill version from the UI"
```

---

### Task 7: Rollback — use a historical version as the editor's starting point

**Files:**
- Create: `src/components/dashboard/SkillEditPanel.tsx`
- Modify: `src/components/dashboard/VersionHistory.tsx`
- Modify: `src/app/skills/[slug]/edit/page.tsx:142-143`

**Interfaces:**
- Consumes: `SkillEditor` (`{ slug: string; initialContent: string }`, unchanged) and `VersionHistory` (extended below).
- Produces: `SkillEditPanel({ slug, initialContent }: { slug: string; initialContent: string })` — the new mount point `EditPage` uses instead of rendering `SkillEditor`/`VersionHistory` directly.

- [ ] **Step 1: Add the callback prop to `VersionHistory`**

In `src/components/dashboard/VersionHistory.tsx`, add an optional prop (in the `Props` interface from Task 6):

```ts
interface Props {
  slug: string;
  refreshKey?: number;
  onUseAsBase?: (content: string) => void;
}

export function VersionHistory({ slug, refreshKey, onUseAsBase }: Props) {
```

In the expanded-detail block added in Task 6 (right after the "Descargar .zip" `<button>`), add a second button, only rendered when `onUseAsBase` is provided:

```tsx
                    {onUseAsBase && (
                      <button
                        onClick={() => onUseAsBase(detail.rawContent)}
                        style={{
                          marginTop: "8px",
                          marginLeft: "8px",
                          fontFamily: "var(--font-jetbrains-mono), monospace",
                          fontSize: "11px",
                          padding: "6px 12px",
                          borderRadius: "4px",
                          border: "1px solid var(--accent)",
                          background: "none",
                          color: "var(--accent)",
                          cursor: "pointer",
                        }}
                      >
                        Usar esta version como base
                      </button>
                    )}
```

- [ ] **Step 2: Create the wrapper that lifts shared state**

Create `src/components/dashboard/SkillEditPanel.tsx`:

```tsx
"use client";

import { useState } from "react";
import { SkillEditor } from "./SkillEditor";
import { VersionHistory } from "./VersionHistory";

interface Props {
  slug: string;
  initialContent: string;
}

export function SkillEditPanel({ slug, initialContent }: Props) {
  const [override, setOverride] = useState<{ key: number; content: string } | null>(null);

  return (
    <>
      <SkillEditor
        key={override?.key ?? "current"}
        slug={slug}
        initialContent={override?.content ?? initialContent}
      />
      <VersionHistory
        slug={slug}
        onUseAsBase={(content) => setOverride({ key: Date.now(), content })}
      />
    </>
  );
}
```

`SkillEditor` bootstraps its CodeMirror instance from `initialContent` only once on mount (see `SkillEditor.tsx:105-120`, effect dependency array `[]`) — changing the `key` forces React to unmount and remount it fresh with the new `initialContent` instead of requiring changes inside `SkillEditor` itself.

- [ ] **Step 3: Use the wrapper from the edit page**

In `src/app/skills/[slug]/edit/page.tsx`, replace (currently lines 1-6 imports and line 142-143 usage):

```ts
import { SkillEditor } from "@/components/dashboard/SkillEditor";
import { VersionHistory } from "@/components/dashboard/VersionHistory";
```

with:

```ts
import { SkillEditPanel } from "@/components/dashboard/SkillEditPanel";
```

and replace:

```tsx
        <SkillEditor slug={skill.slug} initialContent={skill.rawContent} />
        <VersionHistory slug={skill.slug} />
```

with:

```tsx
        <SkillEditPanel slug={skill.slug} initialContent={skill.rawContent} />
```

- [ ] **Step 4: Manually verify in the browser**

Run: `pnpm dev --port 3010`, open `/skills/<slug-with-2-plus-versions>/edit`, expand an older version, click "Usar esta version como base".
Expected: the editor above resets to that version's content (CodeMirror remounts — cursor/undo history clears, which is expected for a full content swap), `dirty` state in `SkillEditor` becomes true (since the new content differs from what's saved), and the "cambios sin guardar" indicator appears. Bump the version field manually and confirm "Enviar a revision" now goes through Task 1's guard normally (rejects if not bumped, per Task 1's test coverage — no need to retest that here).

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/SkillEditPanel.tsx src/components/dashboard/VersionHistory.tsx "src/app/skills/[slug]/edit/page.tsx"
git commit -m "feat: roll back by reusing a historical version as the editor's base"
```

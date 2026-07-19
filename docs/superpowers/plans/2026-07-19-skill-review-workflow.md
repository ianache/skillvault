# Skill Review Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a version-based review workflow where every new skill and every new skill version is reviewed before becoming public, while the currently approved version remains installable.

**Architecture:** Keep `skills` and `skill_files` as the published source of truth. Add review-request tables plus a service layer that validates submissions, enforces ownership/roles, records comments, and atomically activates approved requests into the published tables. UI routes call the new review APIs; public catalog/download/install continue to read only published rows.

**Tech Stack:** Next.js 16 App Router, React 19, Auth.js/Keycloak roles, Drizzle schema definitions for SQLite/MySQL, `@libsql/client` normalized SQL client, `gray-matter`, existing `skill-schema` validators, Node test runner where route/service tests are added.

## Global Constraints

- Both new skills and new versions of existing skills must be reviewed before they become publicly available.
- Published skills remain available while a new version is under review.
- Review scope includes `SKILL.md` plus attached files.
- Review outcomes are `approve`, `reject`, and `request_changes`.
- Comments are general plus per-file, not line-level.
- Notifications are dashboard-only in the first version.
- Only the original author can modify a proposal after changes are requested.
- Approval activates the proposed version immediately.
- Public catalog, download, install, and CLI flows must read only approved published rows.
- Existing published skills remain published; do not convert them into review requests.
- SQLite and MySQL schemas must stay aligned.

---

## File Structure

Create:

- `src/lib/review/types.ts`: shared review status, decision, DTO, file, and comment types.
- `src/lib/review/auth.ts`: role/ownership helpers for API routes.
- `src/lib/review/files.ts`: attached-file path validation and file-change classification helpers.
- `src/lib/review/service.ts`: review request creation, update, listing, comment, decision, and activation logic.
- `src/app/api/review-requests/route.ts`: list/create review requests.
- `src/app/api/review-requests/[id]/route.ts`: detail/update review request.
- `src/app/api/review-requests/[id]/comments/route.ts`: add general or per-file comment.
- `src/app/api/review-requests/[id]/decision/route.ts`: approve/reject/request-changes endpoint.
- `src/app/dashboard/review/page.tsx`: reviewer queue page.
- `src/app/dashboard/review/[id]/page.tsx`: reviewer detail page.
- `src/app/dashboard/proposals/page.tsx`: author proposal list.
- `src/app/dashboard/proposals/[id]/page.tsx`: author proposal detail/edit page.
- `src/components/review/ReviewRequestList.tsx`: reusable list/table for author and reviewer queues.
- `src/components/review/ReviewRequestDetail.tsx`: detail tabs for `SKILL.md`, attached files, comments, metadata, and actions.
- `src/components/review/ReviewCommentForm.tsx`: general/per-file comment form.
- `src/lib/db/migrate-review-workflow.ts`: SQLite migration for review tables.
- `src/lib/db/migrate-review-workflow-mysql.ts`: MySQL migration for review tables.
- `src/lib/review/service.test.ts`: service-level tests with a fake SQL client.
- `src/lib/review/files.test.ts`: path validation and change classification tests.

Modify:

- `src/lib/db/schema.ts`: add SQLite review tables.
- `src/lib/db/schema.mysql.ts`: add MySQL review tables.
- `src/auth.ts`: ensure stable session user id/handle fields are available to review helpers.
- `src/types/next-auth.d.ts`: add session user id/roles/handle typing if missing.
- `src/app/api/skills/route.ts`: `POST` creates review request instead of publishing directly.
- `src/app/api/skills/[slug]/route.ts`: `PATCH` creates or updates a review request instead of mutating published content.
- `src/app/api/skills/[slug]/files/route.ts`: keep public file behavior; review-file writes move to review APIs.
- `src/app/publish/page.tsx`: final action submits to review.
- `src/app/publish/success/page.tsx`: show pending review state and link to proposal.
- `src/components/dashboard/SkillEditor.tsx`: submit new version to review instead of patching published skill.
- `src/components/NavLinks.tsx`: add author/reviewer dashboard links.
- `src/app/dashboard/page.tsx`: keep published skills dashboard and add navigation affordance to proposals/review.
- `package.json`: add migration scripts and test script if absent.

---

## Task 1: Review Schema And Migrations

**Files:**

- Modify: `src/lib/db/schema.ts`
- Modify: `src/lib/db/schema.mysql.ts`
- Create: `src/lib/db/migrate-review-workflow.ts`
- Create: `src/lib/db/migrate-review-workflow-mysql.ts`
- Modify: `package.json`

**Interfaces:**

- Produces SQLite/MySQL tables named `skill_review_requests`, `skill_review_files`, and `skill_review_comments`.
- Produces scripts:
  - `pnpm migrate:review-workflow`
  - `pnpm migrate:review-workflow:mysql`

- [ ] **Step 1: Write failing migration/schema verification**

Create a temporary verification script while implementing, or add a permanent test if a root test runner is introduced in Task 2. The check must query SQLite table creation:

```ts
const tables = await client.execute(`
  SELECT name FROM sqlite_master
  WHERE type = 'table'
  AND name IN ('skill_review_requests', 'skill_review_files', 'skill_review_comments')
`);
if (tables.rows.length !== 3) throw new Error("review tables missing");
```

- [ ] **Step 2: Run verification and confirm failure**

Run:

```bash
pnpm tsx src/lib/db/migrate-review-workflow.ts
```

Expected before implementation: failure because the migration file does not exist.

- [ ] **Step 3: Add schema definitions**

In `src/lib/db/schema.ts`, add:

```ts
export const skillReviewRequests = sqliteTable("skill_review_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skillId: integer("skill_id"),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  version: text("version").notNull(),
  schemaVersion: text("schema_version").notNull().default("1.1"),
  authorId: text("author_id").notNull(),
  authorHandle: text("author_handle"),
  rawContent: text("raw_content").notNull(),
  status: text("status").notNull().default("pending"),
  reviewerId: text("reviewer_id"),
  reviewerHandle: text("reviewer_handle"),
  generalComment: text("general_comment"),
  submittedAt: integer("submitted_at").notNull().default(sql`(unixepoch())`),
  reviewedAt: integer("reviewed_at"),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});
```

In `src/lib/db/schema.mysql.ts`, add the same logical fields with `int`, `varchar`, `text`, and `bigint` types.

Add `skillReviewFiles` and `skillReviewComments` with the fields from the design spec.

- [ ] **Step 4: Add migrations**

Create SQLite migration using `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` for all indexes listed in the spec. Create MySQL migration using `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX` statements guarded by MySQL-compatible checks or idempotent error handling.

- [ ] **Step 5: Add package scripts**

Add:

```json
"migrate:review-workflow": "tsx src/lib/db/migrate-review-workflow.ts",
"migrate:review-workflow:mysql": "tsx src/lib/db/migrate-review-workflow-mysql.ts"
```

- [ ] **Step 6: Run migration verification**

Run:

```bash
pnpm migrate:review-workflow
```

Expected: exit 0 and review tables exist in the configured SQLite database.

- [ ] **Step 7: Commit**

```bash
git add src/lib/db/schema.ts src/lib/db/schema.mysql.ts src/lib/db/migrate-review-workflow.ts src/lib/db/migrate-review-workflow-mysql.ts package.json
git commit -m "feat: add review workflow schema"
```

---

## Task 2: Review Domain Helpers And Service

**Files:**

- Create: `src/lib/review/types.ts`
- Create: `src/lib/review/auth.ts`
- Create: `src/lib/review/files.ts`
- Create: `src/lib/review/service.ts`
- Create: `src/lib/review/files.test.ts`
- Create: `src/lib/review/service.test.ts`
- Modify: `package.json`

**Interfaces:**

- Produces `ReviewStatus = "pending" | "changes_requested" | "approved" | "rejected"`.
- Produces `ReviewDecision = "approve" | "reject" | "request_changes"`.
- Produces `createReviewRequest(input, actor, client)`.
- Produces `updateReviewRequest(id, input, actor, client)`.
- Produces `listReviewRequests(query, actor, client)`.
- Produces `getReviewRequest(id, actor, client)`.
- Produces `addReviewComment(id, input, actor, client)`.
- Produces `decideReviewRequest(id, input, actor, client)`.

- [ ] **Step 1: Add failing file validation tests**

Create `src/lib/review/files.test.ts`:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { validateReviewFilePath } from "./files";

test("rejects absolute paths", () => {
  assert.throws(() => validateReviewFilePath("C:\\\\temp\\\\x.md"), /relative/);
  assert.throws(() => validateReviewFilePath("/tmp/x.md"), /relative/);
});

test("rejects traversal paths", () => {
  assert.throws(() => validateReviewFilePath("../secret.md"), /traversal/);
  assert.throws(() => validateReviewFilePath("docs/../../secret.md"), /traversal/);
});

test("accepts nested relative paths", () => {
  assert.equal(validateReviewFilePath("resources/reference.md"), "resources/reference.md");
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run:

```bash
node --test src/lib/review/files.test.ts
```

Expected: fails because `src/lib/review/files.ts` does not exist.

- [ ] **Step 3: Implement `files.ts`**

Implement:

```ts
export function validateReviewFilePath(path: string): string {
  const normalized = path.replace(/\\/g, "/").trim();
  if (!normalized) throw new Error("File path is required");
  if (normalized.startsWith("/") || /^[a-zA-Z]:\//.test(normalized)) {
    throw new Error("File path must be relative");
  }
  if (normalized.split("/").includes("..")) {
    throw new Error("File path must not contain traversal");
  }
  return normalized;
}
```

- [ ] **Step 4: Add service tests**

Create `src/lib/review/service.test.ts` with a fake client that records SQL calls. Cover:

```ts
test("author creates pending request for a new skill", async () => {
  const request = await createReviewRequest({
    rawContent: validRawContent,
    files: [],
  }, authorActor, fakeClient);
  assert.equal(request.status, "pending");
  assert.equal(request.slug, "demo-skill");
});

test("author cannot approve own request", async () => {
  await assert.rejects(
    () => decideReviewRequest(1, { decision: "approve" }, authorActor, fakeClient),
    /cannot approve own request/
  );
});

test("request_changes requires comment", async () => {
  await assert.rejects(
    () => decideReviewRequest(1, { decision: "request_changes" }, reviewerActor, fakeClient),
    /comment required/
  );
});
```

- [ ] **Step 5: Run service tests and confirm failure**

Run:

```bash
node --test src/lib/review/service.test.ts
```

Expected: fails because service functions do not exist.

- [ ] **Step 6: Implement types/auth/service**

Implement `types.ts` with actor, request, file, comment, input, and decision types.

Implement `auth.ts`:

```ts
export function hasRole(actor: ReviewActor, role: string): boolean {
  return actor.roles.includes(role);
}

export function canReview(actor: ReviewActor): boolean {
  return hasRole(actor, "reviewer") || hasRole(actor, "admin");
}

export function assertCanEditRequest(actor: ReviewActor, request: { authorId: string; status: ReviewStatus }) {
  if (request.status !== "pending" && request.status !== "changes_requested") {
    throw new Error("Request is not editable");
  }
  if (!hasRole(actor, "admin") && request.authorId !== actor.id) {
    throw new Error("Only the author can edit this request");
  }
}
```

Implement `service.ts` using existing `validateSkillFrontmatter`, `validateBodySections`, `matter`, and `client.execute`.

- [ ] **Step 7: Run domain tests**

Run:

```bash
node --test src/lib/review/*.test.ts
```

Expected: all review domain tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib/review package.json
git commit -m "feat: add review workflow service"
```

---

## Task 3: Review API Routes

**Files:**

- Create: `src/app/api/review-requests/route.ts`
- Create: `src/app/api/review-requests/[id]/route.ts`
- Create: `src/app/api/review-requests/[id]/comments/route.ts`
- Create: `src/app/api/review-requests/[id]/decision/route.ts`
- Modify: `src/auth.ts`
- Modify: `src/types/next-auth.d.ts`

**Interfaces:**

- Consumes service functions from Task 2.
- Produces REST routes described in the design spec.
- Produces `actorFromSession(session)` helper or equivalent route-local actor mapping.

- [ ] **Step 1: Write failing route-level tests or request harness**

If the repo still has no app route test harness, add `src/lib/review/api-contract.test.ts` testing the route handlers as functions with mocked service dependencies only where unavoidable. Cover:

```ts
test("unauthenticated create returns 401", async () => {
  const response = await POST(new NextRequest("http://test/api/review-requests", { method: "POST" }));
  assert.equal(response.status, 401);
});
```

- [ ] **Step 2: Run and confirm failure**

Run:

```bash
node --test src/lib/review/api-contract.test.ts
```

Expected: fails because API routes do not exist or auth mapping is missing.

- [ ] **Step 3: Add actor mapping**

Ensure session includes stable:

```ts
session.user.id
session.user.name
session.user.email
session.user.roles
```

Use token `sub` for `id`, and existing `roles` claim for roles.

- [ ] **Step 4: Implement route handlers**

Each route must:

1. Call `auth()`.
2. Return `401` if no session.
3. Convert session to `ReviewActor`.
4. Call the service function.
5. Map domain errors to `403`, `404`, `409`, `422`, or `500`.

- [ ] **Step 5: Run route tests and TypeScript check**

Run:

```bash
node --test src/lib/review/api-contract.test.ts
pnpm lint
```

Expected: tests pass and lint reports no new errors from review route files.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/review-requests src/auth.ts src/types/next-auth.d.ts src/lib/review/api-contract.test.ts
git commit -m "feat: expose review request api"
```

---

## Task 4: Convert Publish And Edit To Review Requests

**Files:**

- Modify: `src/app/api/skills/route.ts`
- Modify: `src/app/api/skills/[slug]/route.ts`
- Modify: `src/app/api/skills/[slug]/files/route.ts`
- Modify: `src/app/publish/page.tsx`
- Modify: `src/app/publish/success/page.tsx`
- Modify: `src/components/dashboard/SkillEditor.tsx`

**Interfaces:**

- Consumes `POST /api/review-requests`.
- Produces response `{ reviewRequestId: number, slug: string, status: "pending" }` from publishing actions.
- Preserves public `GET` behavior for published skills.

- [ ] **Step 1: Write failing API behavior tests**

Add tests proving:

```ts
test("POST /api/skills creates review request instead of published skill", async () => {
  const response = await postSkill(validRawContent, authorSession);
  assert.equal(response.status, 201);
  assert.equal(await publicCatalogContains("demo-skill"), false);
});

test("PATCH /api/skills/:slug creates version request and preserves published rawContent", async () => {
  await patchSkill("demo-skill", updatedRawContent, authorSession);
  assert.equal(await publishedRawContent("demo-skill"), originalRawContent);
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run:

```bash
node --test src/lib/review/api-contract.test.ts
```

Expected: fails because existing APIs publish/patch directly.

- [ ] **Step 3: Update `POST /api/skills`**

Replace direct insert with `createReviewRequest`. Keep frontmatter validation through the service. Return:

```ts
return NextResponse.json(
  { slug: request.slug, reviewRequestId: request.id, status: request.status },
  { status: 201 }
);
```

- [ ] **Step 4: Update `PATCH /api/skills/:slug`**

Create or update an open review request for the current author and skill. Do not update the published `skills` row.

- [ ] **Step 5: Update publish UI**

Change copy:

- Button: `Enviar a revision`
- Success: `Pendiente de revision`
- Route to `/dashboard/proposals/${reviewRequestId}` after submission or show a direct link on success.

- [ ] **Step 6: Update skill editor**

Change `handleSave` to call review request creation/update and show `Enviado a revision` instead of `Guardado correctamente`.

- [ ] **Step 7: Run verification**

Run:

```bash
pnpm lint
node --test src/lib/review/*.test.ts
```

Expected: lint and tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/app/api/skills src/app/publish src/components/dashboard/SkillEditor.tsx src/lib/review
git commit -m "feat: route publishing through review requests"
```

---

## Task 5: Reviewer And Author Dashboards

**Files:**

- Create: `src/components/review/ReviewRequestList.tsx`
- Create: `src/components/review/ReviewRequestDetail.tsx`
- Create: `src/components/review/ReviewCommentForm.tsx`
- Create: `src/app/dashboard/review/page.tsx`
- Create: `src/app/dashboard/review/[id]/page.tsx`
- Create: `src/app/dashboard/proposals/page.tsx`
- Create: `src/app/dashboard/proposals/[id]/page.tsx`
- Modify: `src/components/NavLinks.tsx`
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**

- Consumes review request API routes from Task 3.
- Produces author proposal views and reviewer queue/detail views.

- [ ] **Step 1: Write failing UI smoke checks**

If Playwright is already configured, add route smoke tests. If not, use server-render checks where possible:

```ts
test("review queue page exports default component", async () => {
  const mod = await import("@/app/dashboard/review/page");
  assert.equal(typeof mod.default, "function");
});
```

- [ ] **Step 2: Run and confirm failure**

Run:

```bash
node --test src/lib/review/ui-smoke.test.ts
```

Expected: fails because pages/components do not exist.

- [ ] **Step 3: Build reusable list component**

`ReviewRequestList` props:

```ts
type Props = {
  requests: ReviewRequestSummary[];
  mode: "author" | "reviewer";
};
```

Render status, slug, version, author, reviewer, updated date, and link to detail.

- [ ] **Step 4: Build detail component**

`ReviewRequestDetail` props:

```ts
type Props = {
  request: ReviewRequestDetailDto;
  viewerMode: "author" | "reviewer";
};
```

Render tabs for `SKILL.md`, `Adjuntos`, `Comentarios`, and `Metadata`. Reviewer mode shows decision buttons. Author mode shows edit/resubmit controls when `status === "changes_requested"`.

- [ ] **Step 5: Add pages**

Author pages fetch:

```ts
GET /api/review-requests?mine=1
GET /api/review-requests/:id
```

Reviewer pages fetch:

```ts
GET /api/review-requests?status=pending
GET /api/review-requests/:id
```

- [ ] **Step 6: Add navigation**

Add links:

- `/dashboard/proposals`: `Mis propuestas`
- `/dashboard/review`: `Revision`

Show reviewer link only when client session roles include `reviewer` or `admin`, or show it and let the page return a permission state if role-gated client state is not already available.

- [ ] **Step 7: Run verification**

Run:

```bash
pnpm lint
pnpm build
```

Expected: Next.js build succeeds and pages type-check.

- [ ] **Step 8: Commit**

```bash
git add src/components/review src/app/dashboard/review src/app/dashboard/proposals src/components/NavLinks.tsx src/app/dashboard/page.tsx
git commit -m "feat: add review dashboards"
```

---

## Task 6: Approval Activation And Public Regression Coverage

**Files:**

- Modify: `src/lib/review/service.ts`
- Modify: `src/app/api/skills/route.ts`
- Modify: `src/app/api/skills/[slug]/route.ts`
- Modify: `src/app/api/skills/[slug]/download/route.ts`
- Modify: `src/app/api/skills/[slug]/install/route.ts`
- Modify: `src/app/api/skills/[slug]/versions/route.ts`
- Modify: `src/lib/review/service.test.ts`

**Interfaces:**

- Consumes review request service from Task 2.
- Produces `approveReviewRequest` behavior inside `decideReviewRequest`.
- Preserves public endpoint semantics for active published versions.

- [ ] **Step 1: Write failing activation tests**

Add service tests:

```ts
test("approving new skill creates published skill and files", async () => {
  await decideReviewRequest(1, { decision: "approve" }, reviewerActor, fakeClient);
  assert.equal(fakeClient.insertedSkill.slug, "demo-skill");
  assert.equal(fakeClient.updatedRequest.status, "approved");
});

test("approval failure leaves request pending", async () => {
  fakeClient.failOnSkillInsert = true;
  await assert.rejects(
    () => decideReviewRequest(1, { decision: "approve" }, reviewerActor, fakeClient),
    /activation failed/
  );
  assert.notEqual(fakeClient.updatedRequest?.status, "approved");
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run:

```bash
node --test src/lib/review/service.test.ts
```

Expected: fails because approval activation is incomplete.

- [ ] **Step 3: Implement activation**

Inside `decideReviewRequest`:

- Load request and files.
- Reject self-approval unless actor is operational admin and the chosen rule allows admin bypass.
- For new skill, insert into `skills`.
- For existing skill, update `skills`.
- Delete existing `skill_files` for the skill and insert proposed files except `changeType = "deleted"`.
- Insert `skill_versions` snapshot.
- Update request to `approved` only after published writes succeed.

- [ ] **Step 4: Verify public endpoints**

Add tests or manual checks proving:

- Catalog excludes pending requests.
- Skill detail returns published raw content while pending version exists.
- Download zip includes only published `SKILL.md` and files.
- Install count increments against published skill.

- [ ] **Step 5: Run verification**

Run:

```bash
node --test src/lib/review/*.test.ts
pnpm lint
pnpm build
```

Expected: tests pass, lint passes, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/lib/review src/app/api/skills
git commit -m "feat: activate approved skill versions"
```

---

## Task 7: End-To-End Manual QA And Documentation

**Files:**

- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-07-19-skill-review-workflow-design.md` only if implementation diverged from the approved spec.
- Create: `docs/review-workflow.md`

**Interfaces:**

- Produces user-facing documentation for authors, reviewers, and admins.

- [ ] **Step 1: Add workflow docs**

Create `docs/review-workflow.md` with:

- Roles and permissions.
- Author submission flow.
- Reviewer decision flow.
- Published-version behavior while pending.
- Migration commands.
- Known non-goals: email, webhook, line comments, scheduled publication.

- [ ] **Step 2: Update README**

Add a short section linking to `docs/review-workflow.md` and explaining that `POST /api/skills` now submits for review.

- [ ] **Step 3: Run full verification**

Run:

```bash
pnpm migrate:review-workflow
node --test src/lib/review/*.test.ts
pnpm lint
pnpm build
```

Expected:

- Migration exits 0.
- Review tests pass.
- Lint exits 0.
- Build exits 0.

- [ ] **Step 4: Manual QA**

Start local app:

```bash
pnpm dev
```

Verify in browser:

- Author submits new skill and sees pending proposal.
- Public catalog does not show pending skill.
- Reviewer opens queue and requests changes with general comment and per-file comment.
- Author edits proposal and resubmits.
- Reviewer approves.
- Public catalog shows approved skill.
- Existing skill remains installable while a newer version is pending.

- [ ] **Step 5: Commit docs and QA fixes**

```bash
git add README.md docs/review-workflow.md docs/superpowers/specs/2026-07-19-skill-review-workflow-design.md
git commit -m "docs: document review workflow"
```

---

## Self-Review

Spec coverage:

- Version-based review for new skills and new versions: Tasks 1, 2, 4, 6.
- Ownership roles: Tasks 2 and 3.
- `SKILL.md` plus attached files: Tasks 2, 3, 5, 6.
- General and per-file comments: Tasks 1, 2, 3, 5.
- Dashboard-only notifications: Task 5.
- Author-only edits after changes requested: Tasks 2, 3, 5.
- Immediate activation on approval: Task 6.
- Public endpoints serve only approved content: Tasks 4 and 6.
- SQLite/MySQL migration alignment: Task 1.
- Tests and docs: Tasks 2 through 7.

Placeholder scan:

- This plan contains no `TBD`, `TODO`, or unspecified implementation slots.
- Each task has exact files, interfaces, commands, expected outcomes, and commit boundaries.

Type consistency:

- `ReviewStatus`, `ReviewDecision`, `ReviewActor`, `ReviewRequestSummary`, and `ReviewRequestDetailDto` are introduced in Task 2 and consumed by later tasks.
- Route paths and dashboard paths match the approved design.
- `skill_review_requests`, `skill_review_files`, and `skill_review_comments` names are consistent across schema, migrations, service, and tests.

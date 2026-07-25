# Publish Step 4 Relaxed Submission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow the publish wizard Step 4 to submit incomplete skills to review when the user accepted responsibility and the content is 300 lines or fewer.

**Architecture:** Keep strict validation for approval/activation, but add a relaxed initial submission path used only by `/api/skills`. The publish page forwards the existing Step 2 consent to the API, the route validates request shape and consent, and the review service extracts best-effort metadata with deterministic fallbacks for pending review records.

**Tech Stack:** Next.js App Router, TypeScript, `gray-matter`, `zod`, Node test runner via `tsx --test`.

---

## File Structure

- Modify `src/components/wizard/Step3Review.tsx`: add an `acceptedResponsibility` prop and keep the submit button gated by that prop.
- Modify `src/app/publish/page.tsx`: track responsibility acceptance across Step 2/Step 4 and send `acceptedResponsibility: true` to `/api/skills`.
- Modify `src/components/wizard/Step2Editor.tsx`: expose acceptance state to the parent without changing the visible Step 2 behavior.
- Modify `src/app/api/skills/route.ts`: parse and require `acceptedResponsibility` for POST submissions.
- Modify `src/lib/review/types.ts`: add `acceptedResponsibility?: boolean` to `CreateReviewRequestInput`.
- Modify `src/lib/review/service.ts`: split strict validation from relaxed create validation.
- Modify `src/lib/review/api-contract.test.ts`: add API tests for relaxed submission acceptance and consent/line-count rejection.
- Modify `src/lib/review/service.test.ts`: add service-level tests that approval remains strict.
- Modify `src/lib/review/ui-smoke.test.ts`: assert Step 4 request includes `acceptedResponsibility` and Step 2 reports acceptance upward.

---

### Task 1: Add API Contract Tests For Relaxed Submission

**Files:**
- Modify: `src/lib/review/api-contract.test.ts`

- [ ] **Step 1: Add test fixtures near `validRawContent`**

Add this fixture after `validRawContent`:

```ts
const relaxedRawContent = `# Draft Skill

This draft intentionally omits strict frontmatter metadata and required body sections.`;

const overLineLimitRawContent = Array.from({ length: 301 }, (_, index) => `line ${index + 1}`).join("\n");
```

- [ ] **Step 2: Add a failing acceptance test after `POST /api/skills creates a review request instead of a published skill`**

```ts
test("POST /api/skills accepts relaxed draft submissions with responsibility consent", async () => {
  let createInput: unknown;
  const { POST } = createSkillHandlers({
    getSession: async () => authorSession as never,
    database,
    create: async (input) => {
      createInput = input;
      return reviewRequest({
        slug: "draft-skill",
        name: "draft-skill",
        description: "Skill enviado a revision sin descripcion validada.",
        rawContent: relaxedRawContent,
      });
    },
  });

  const response = await POST(new NextRequest("http://test/api/skills", {
    method: "POST",
    body: JSON.stringify({
      rawContent: relaxedRawContent,
      files: [],
      acceptedResponsibility: true,
    }),
  }));

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { slug: "draft-skill", reviewRequestId: 9, status: "pending" });
  assert.deepEqual(createInput, {
    rawContent: relaxedRawContent,
    files: [],
    acceptedResponsibility: true,
  });
});
```

- [ ] **Step 3: Add failing rejection tests**

```ts
test("POST /api/skills rejects relaxed submissions without responsibility consent", async () => {
  let called = false;
  const { POST } = createSkillHandlers({
    getSession: async () => authorSession as never,
    database,
    create: async () => {
      called = true;
      return reviewRequest();
    },
  });

  const response = await POST(new NextRequest("http://test/api/skills", {
    method: "POST",
    body: JSON.stringify({ rawContent: relaxedRawContent, files: [] }),
  }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Debes aceptar continuar con la publicacion" });
  assert.equal(called, false);
});

test("POST /api/skills rejects submissions over 300 lines", async () => {
  let called = false;
  const { POST } = createSkillHandlers({
    getSession: async () => authorSession as never,
    database,
    create: async () => {
      called = true;
      return reviewRequest();
    },
  });

  const response = await POST(new NextRequest("http://test/api/skills", {
    method: "POST",
    body: JSON.stringify({
      rawContent: overLineLimitRawContent,
      files: [],
      acceptedResponsibility: true,
    }),
  }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Maximo 300 lineas" });
  assert.equal(called, false);
});
```

- [ ] **Step 4: Run the focused tests and verify failure**

Run:

```bash
pnpm exec tsx --test src/lib/review/api-contract.test.ts
```

Expected: fails because `acceptedResponsibility` is not parsed or enforced yet.

- [ ] **Step 5: Commit the failing tests**

```bash
git add src/lib/review/api-contract.test.ts
git commit -m "test: cover relaxed publish submission api contract"
```

---

### Task 2: Parse Responsibility Consent In `/api/skills`

**Files:**
- Modify: `src/lib/review/types.ts`
- Modify: `src/app/api/skills/route.ts`

- [ ] **Step 1: Extend `CreateReviewRequestInput`**

In `src/lib/review/types.ts`, replace:

```ts
export type CreateReviewRequestInput = {
  rawContent: string;
  files?: ReviewFileInput[];
  skillId?: number | null;
};
```

with:

```ts
export type CreateReviewRequestInput = {
  rawContent: string;
  files?: ReviewFileInput[];
  skillId?: number | null;
  acceptedResponsibility?: boolean;
};
```

- [ ] **Step 2: Add a line-count helper in `src/app/api/skills/route.ts`**

Place it after `parseFiles()`:

```ts
const MAX_SKILL_LINES = 300;

function countLines(value: string): number {
  return value.split(/\r\n|\r|\n/).length;
}
```

- [ ] **Step 3: Update `skillSubmissionBody()`**

Replace this block:

```ts
  const { rawContent, files } = body as Record<string, unknown>;
  const parsedFiles = parseFiles(files);
  if (typeof rawContent !== "string" || !rawContent || parsedFiles === null) return null;
  return {
    rawContent,
    ...(parsedFiles === undefined ? {} : { files: parsedFiles }),
  };
```

with:

```ts
  const { rawContent, files, acceptedResponsibility } = body as Record<string, unknown>;
  const parsedFiles = parseFiles(files);
  if (typeof rawContent !== "string" || !rawContent.trim() || parsedFiles === null) return null;
  if (countLines(rawContent) > MAX_SKILL_LINES) {
    throw new Error("Maximo 300 lineas");
  }
  if (acceptedResponsibility !== true) {
    throw new Error("Debes aceptar continuar con la publicacion");
  }
  return {
    rawContent,
    acceptedResponsibility: true,
    ...(parsedFiles === undefined ? {} : { files: parsedFiles }),
  };
```

- [ ] **Step 4: Update `POST()` to handle parser errors as `400`**

Replace:

```ts
    const input = await skillSubmissionBody(req);
    if (!input) return NextResponse.json({ error: "rawContent y files[] invÃ¡lidos" }, { status: 400 });
```

with:

```ts
    let input: CreateReviewRequestInput | null;
    try {
      input = await skillSubmissionBody(req);
    } catch (error) {
      const message = error instanceof Error ? error.message : "rawContent y files[] invalidos";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    if (!input) return NextResponse.json({ error: "rawContent y files[] invalidos" }, { status: 400 });
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm exec tsx --test src/lib/review/api-contract.test.ts
```

Expected: the new API contract tests pass through route parsing but may fail later because service still validates strictly when not mocked.

- [ ] **Step 6: Commit**

```bash
git add src/lib/review/types.ts src/app/api/skills/route.ts
git commit -m "feat: require publish responsibility consent"
```

---

### Task 3: Add Relaxed Review Request Creation

**Files:**
- Modify: `src/lib/review/service.ts`
- Modify: `src/lib/review/service.test.ts`

- [ ] **Step 1: Add service tests**

In `src/lib/review/service.test.ts`, add imports if missing:

```ts
import { createReviewRequest, decideReviewRequest } from "./service";
```

Add these fixtures near existing test helpers:

```ts
const relaxedRawContent = `# Draft Skill

This draft intentionally omits strict frontmatter metadata and required body sections.`;

const overLineLimitRawContent = Array.from({ length: 301 }, (_, index) => `line ${index + 1}`).join("\n");
```

Add this test:

```ts
test("createReviewRequest stores relaxed draft metadata when responsibility is accepted", async () => {
  const executed: { sql: string; args?: unknown[] }[] = [];
  const database: ReviewDatabaseClient = {
    async execute(input) {
      const query = typeof input === "string" ? { sql: input } : input;
      executed.push(query);
      if (query.sql.includes("SELECT id FROM skills")) return { rows: [] };
      if (query.sql.includes("SELECT id FROM skill_review_requests")) return { rows: [] };
      if (query.sql.includes("INSERT INTO skill_review_requests")) return { rows: [] };
      if (query.sql.includes("SELECT * FROM skill_review_requests")) {
        return {
          rows: [{
            id: 12,
            skill_id: null,
            slug: "draft-skill",
            name: "draft-skill",
            description: "Skill enviado a revision sin descripcion validada.",
            type: "code",
            version: "1.0.0",
            schema_version: "1.1",
            author_id: "author-1",
            author_handle: "Author",
            raw_content: relaxedRawContent,
            status: "pending",
            reviewer_id: null,
            reviewer_handle: null,
            general_comment: null,
            submitted_at: 1,
            reviewed_at: null,
            updated_at: 1,
          }],
        };
      }
      if (query.sql.includes("DELETE FROM skill_review_files")) return { rows: [] };
      throw new Error(`Unexpected query: ${query.sql}`);
    },
  };

  const request = await createReviewRequest(
    { rawContent: relaxedRawContent, files: [], acceptedResponsibility: true },
    { id: "author-1", handle: "Author", roles: ["author"] },
    database
  );

  assert.equal(request.slug, "draft-skill");
  const insert = executed.find((query) => query.sql.includes("INSERT INTO skill_review_requests"));
  assert.ok(insert);
  assert.equal(insert.args?.[1], "draft-skill");
  assert.equal(insert.args?.[3], "Skill enviado a revision sin descripcion validada.");
});
```

Add this test:

```ts
test("createReviewRequest rejects relaxed drafts over 300 lines", async () => {
  await assert.rejects(
    () => createReviewRequest(
      { rawContent: overLineLimitRawContent, files: [], acceptedResponsibility: true },
      { id: "author-1", handle: "Author", roles: ["author"] },
      { async execute() { return { rows: [] }; } }
    ),
    /Maximo 300 lineas/
  );
});
```

Add this test if an approval strictness test is not already present:

```ts
test("approval still rejects malformed relaxed draft content", async () => {
  const malformedRequest = {
    id: 12,
    skillId: null,
    slug: "draft-skill",
    name: "draft-skill",
    description: "Skill enviado a revision sin descripcion validada.",
    type: "code",
    version: "1.0.0",
    schemaVersion: "1.1",
    authorId: "author-1",
    authorHandle: "Author",
    rawContent: relaxedRawContent,
    status: "pending" as const,
    reviewerId: null,
    reviewerHandle: null,
    generalComment: null,
    submittedAt: 1,
    reviewedAt: null,
    updatedAt: 1,
  };
  const database: ReviewDatabaseClient = {
    async execute(input) {
      const sql = typeof input === "string" ? input : input.sql;
      if (sql.includes("SELECT * FROM skill_review_requests")) return { rows: [{
        id: malformedRequest.id,
        skill_id: malformedRequest.skillId,
        slug: malformedRequest.slug,
        name: malformedRequest.name,
        description: malformedRequest.description,
        type: malformedRequest.type,
        version: malformedRequest.version,
        schema_version: malformedRequest.schemaVersion,
        author_id: malformedRequest.authorId,
        author_handle: malformedRequest.authorHandle,
        raw_content: malformedRequest.rawContent,
        status: malformedRequest.status,
        reviewer_id: malformedRequest.reviewerId,
        reviewer_handle: malformedRequest.reviewerHandle,
        general_comment: malformedRequest.generalComment,
        submitted_at: malformedRequest.submittedAt,
        reviewed_at: malformedRequest.reviewedAt,
        updated_at: malformedRequest.updatedAt,
      }] };
      if (sql.includes("SELECT * FROM skill_review_files")) return { rows: [] };
      throw new Error(`Unexpected query: ${sql}`);
    },
    async transaction(fn) {
      return fn(this);
    },
  };

  await assert.rejects(
    () => decideReviewRequest(12, { decision: "approve" }, { id: "reviewer-1", handle: "Reviewer", roles: ["reviewer"] }, database),
    /metadata|Seccion requerida|expected object/
  );
});
```

- [ ] **Step 2: Run service tests and verify failure**

Run:

```bash
pnpm exec tsx --test src/lib/review/service.test.ts
```

Expected: relaxed draft creation fails under current strict `validateSubmission()`.

- [ ] **Step 3: Add helpers in `service.ts`**

Add below `asNullableString()`:

```ts
const MAX_SKILL_LINES = 300;
const DEFAULT_RELAXED_DESCRIPTION = "Skill enviado a revision sin descripcion validada.";

function countLines(value: string): number {
  return value.split(/\r\n|\r|\n/).length;
}

function slugifyDraftName(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug || "draft-skill";
}

function firstHeading(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || null;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function semverOrDefault(value: unknown): string {
  return typeof value === "string" && /^\d+\.\d+\.\d+$/.test(value) ? value : "1.0.0";
}
```

- [ ] **Step 4: Add relaxed parser in `service.ts`**

Place below `validateSubmission()`:

```ts
function relaxedSubmission(rawContent: string, files: ReviewFileInput[] = []) {
  if (!rawContent.trim()) throw new Error("SKILL.md content is required");
  if (countLines(rawContent) > MAX_SKILL_LINES) throw new Error("Maximo 300 lineas");

  const parsed = matter(rawContent);
  const data = parsed.data as Record<string, unknown>;
  const metadata = data.metadata && typeof data.metadata === "object"
    ? data.metadata as Record<string, unknown>
    : {};

  const requestedName = typeof data.name === "string" && /^[a-z0-9-]{3,64}$/.test(data.name)
    ? data.name
    : slugifyDraftName(firstHeading(parsed.content) ?? "draft-skill");
  const description = typeof data.description === "string" && data.description.trim().length > 0 && data.description.length <= 280
    ? data.description
    : DEFAULT_RELAXED_DESCRIPTION;
  const type = typeof metadata.type === "string" && metadata.type.trim().length > 0 ? metadata.type : "code";
  const triggers = stringArray(metadata.triggers);

  const normalizedFiles = normalizeReviewFiles(files);

  return {
    frontmatter: {
      name: requestedName,
      description,
      version: semverOrDefault(data.version),
      schema_version: typeof data.schema_version === "string" ? data.schema_version : "1.1",
      author: typeof data.author === "string" ? data.author : undefined,
      metadata: {
        type,
        triggers: triggers.length > 0 ? triggers : [requestedName],
        tools: stringArray(metadata.tools),
        ...(typeof metadata.subagent_type === "string" ? { subagent_type: metadata.subagent_type } : {}),
      },
      compatibility: stringArray(data.compatibility).length > 0 ? stringArray(data.compatibility) : ["claude"],
      dependencies: stringArray(data.dependencies),
      resources: stringArray(data.resources),
      scripts: stringArray(data.scripts),
      config_requirements: Array.isArray(data.config_requirements) ? data.config_requirements : [],
    },
    files: normalizedFiles,
  };
}
```

- [ ] **Step 5: Extract file normalization from strict validation**

Before `validateSubmission()`, add:

```ts
function normalizeReviewFiles(files: ReviewFileInput[] = []) {
  const paths = new Set<string>();
  return files.map((file) => {
    const path = validateReviewFilePath(file.path);
    if (paths.has(path)) throw new Error("Review file paths must be unique");
    paths.add(path);
    return { ...file, path, content: file.content ?? "", changeType: file.changeType ?? "added" };
  });
}
```

Then replace this block inside `validateSubmission()`:

```ts
  const paths = new Set<string>();
  const normalizedFiles = files.map((file) => {
    const path = validateReviewFilePath(file.path);
    if (paths.has(path)) throw new Error("Review file paths must be unique");
    paths.add(path);
    return { ...file, path, content: file.content ?? "", changeType: file.changeType ?? "added" };
  });
```

with:

```ts
  const normalizedFiles = normalizeReviewFiles(files);
```

- [ ] **Step 6: Use relaxed parser only in `createReviewRequest()`**

Replace:

```ts
  const { frontmatter, files } = validateSubmission(input.rawContent, input.files);
```

at the start of `createReviewRequest()` with:

```ts
  if (input.acceptedResponsibility !== true) throw new Error("Debes aceptar continuar con la publicacion");
  const { frontmatter, files } = relaxedSubmission(input.rawContent, input.files);
```

Do not change `updateReviewRequest()` or `activateApprovedRequest()`: both must keep strict `validateSubmission()`.

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm exec tsx --test src/lib/review/service.test.ts src/lib/review/api-contract.test.ts
```

Expected: all tests in those files pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib/review/service.ts src/lib/review/service.test.ts
git commit -m "feat: create relaxed publish review requests"
```

---

### Task 4: Wire Responsibility Consent From UI To API

**Files:**
- Modify: `src/components/wizard/Step2Editor.tsx`
- Modify: `src/components/wizard/Step3Review.tsx`
- Modify: `src/app/publish/page.tsx`
- Modify: `src/lib/review/ui-smoke.test.ts`

- [ ] **Step 1: Add UI smoke assertions**

Append to `src/lib/review/ui-smoke.test.ts`:

```ts
test("publish wizard forwards responsibility acceptance to final submission", async () => {
  const [pageSource, step2Source, step4Source] = await Promise.all([
    source("../../app/publish/page.tsx"),
    source("../../components/wizard/Step2Editor.tsx"),
    source("../../components/wizard/Step3Review.tsx"),
  ]);

  assert.match(step2Source, /onAcceptanceChange\?: \(accepted: boolean\) => void/);
  assert.match(step2Source, /onAcceptanceChange\?\.\\(nextAccepted\\)/);
  assert.match(pageSource, /acceptedResponsibility/);
  assert.match(pageSource, /body: JSON\.stringify\(\{ rawContent: content, files: attachedFiles, acceptedResponsibility \}\)/);
  assert.match(step4Source, /acceptedResponsibility/);
});
```

- [ ] **Step 2: Run smoke test and verify failure**

Run:

```bash
pnpm exec tsx --test src/lib/review/ui-smoke.test.ts
```

Expected: fails because UI does not forward acceptance yet.

- [ ] **Step 3: Update `Step2Editor` props and checkbox handler**

In `src/components/wizard/Step2Editor.tsx`, extend props:

```ts
interface Props {
  content: string;
  onChange: (content: string) => void;
  onNext: () => void;
  onBack: () => void;
  onAcceptanceChange?: (accepted: boolean) => void;
}
```

Update the function signature:

```ts
export function Step2Editor({ content, onChange, onNext, onBack, onAcceptanceChange }: Props) {
```

Find the checkbox `onChange` for `acceptedResponsibility` and replace it with:

```tsx
onChange={(event) => {
  const nextAccepted = event.target.checked;
  setAcceptedResponsibility(nextAccepted);
  onAcceptanceChange?.(nextAccepted);
}}
```

- [ ] **Step 4: Update `Step3Review` props**

In `src/components/wizard/Step3Review.tsx`, add prop:

```ts
  acceptedResponsibility: boolean;
```

Update the function signature:

```ts
export function Step3Review({ content, attachedFiles = [], acceptedResponsibility, onBack, onPublish }: Props) {
```

Update the publish button:

```tsx
disabled={publishing || !acceptedResponsibility}
```

Update cursor:

```tsx
cursor: publishing || !acceptedResponsibility ? "not-allowed" : "pointer",
```

- [ ] **Step 5: Update `src/app/publish/page.tsx`**

Add state:

```ts
  const [acceptedResponsibility, setAcceptedResponsibility] = useState(false);
```

In `handleLoaded()`, reset it:

```ts
    setAcceptedResponsibility(false);
```

In `handleMetaNext()`, reset it before `setStep(2)`:

```ts
    setAcceptedResponsibility(false);
```

Update the POST body:

```ts
        body: JSON.stringify({ rawContent: content, files: attachedFiles, acceptedResponsibility }),
```

Pass the handler to `Step2Editor`:

```tsx
            onAcceptanceChange={setAcceptedResponsibility}
```

Pass the flag to `Step3Review`:

```tsx
          acceptedResponsibility={acceptedResponsibility}
```

- [ ] **Step 6: Run UI smoke test**

Run:

```bash
pnpm exec tsx --test src/lib/review/ui-smoke.test.ts
```

Expected: pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/wizard/Step2Editor.tsx src/components/wizard/Step3Review.tsx src/app/publish/page.tsx src/lib/review/ui-smoke.test.ts
git commit -m "feat: forward publish responsibility consent"
```

---

### Task 5: Full Verification And Final Commit Hygiene

**Files:**
- Verify all changed files

- [ ] **Step 1: Run full review test suite**

Run:

```bash
pnpm test
```

Expected: all review tests pass with no failures.

- [ ] **Step 2: Run lint**

Run:

```bash
pnpm lint
```

Expected: no lint errors. If existing unrelated lint errors appear, capture them exactly and do not hide them.

- [ ] **Step 3: Inspect git status**

Run:

```bash
git status --short --branch
```

Expected: only intentional committed changes plus the pre-existing unrelated `.superpowers/sdd/progress.md` modification, if it still exists.

- [ ] **Step 4: Review final behavior manually at source level**

Confirm these facts by reading the files:

```bash
rg -n "acceptedResponsibility|Maximo 300 lineas|relaxedSubmission|validateSubmission\\(" src/app/publish/page.tsx src/app/api/skills/route.ts src/lib/review/service.ts src/components/wizard
```

Expected:

- `acceptedResponsibility` appears in Step 2, Step 4, publish page, route parsing, and `createReviewRequest()`.
- `Maximo 300 lineas` appears in route parsing and service relaxed parser.
- `activateApprovedRequest()` still calls strict `validateSubmission()`.
- `updateReviewRequest()` still calls strict `validateSubmission()`.

---

## Self-Review

- Spec coverage: The plan covers UI consent forwarding, route-level consent and line-count validation, relaxed review request creation, strict approval preservation, and test coverage for all specified behaviors.
- Red-flag scan: No vague implementation gaps remain. Each code-changing step includes exact snippets and paths.
- Type consistency: `acceptedResponsibility?: boolean` is introduced in `CreateReviewRequestInput`, parsed in `/api/skills`, passed from the publish page, and consumed by `createReviewRequest()`.

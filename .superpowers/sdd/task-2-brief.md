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

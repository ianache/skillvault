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

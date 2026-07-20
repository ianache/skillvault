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

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

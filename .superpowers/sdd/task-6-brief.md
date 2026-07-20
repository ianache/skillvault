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

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

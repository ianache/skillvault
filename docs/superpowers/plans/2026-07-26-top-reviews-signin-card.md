# Top 5 Reviews Signin Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish and commit a previously-uncommitted star-rating feature, then add a "Top 5 Skills · Reviews" card to `/signin` that ranks published skills by average rating.

**Architecture:** Part A (Tasks 1-2) commits code that already exists correctly in the working tree (schema, migrations, API route, UI wiring) with no new logic — the work is precise git staging (some files are committed as-is, one file only partially) plus running the DB migration and verifying nothing regressed. Part B (Task 3) adds one new SQL query and one new entry to `/signin`'s existing `topLists` array, reusing its existing `rankRows()` helper and card-rendering markup — no new component.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM schema definitions (SQLite + MySQL dual dialect, hand-written migrations, no drizzle-kit), raw SQL via `client.execute()`.

## Global Constraints

- Every file in Part A already has correct, working content sitting in the repo's working tree (verified against `git diff`/`ls` before this plan was written) — do not rewrite or "improve" any of it, only stage and commit exactly what's there, except where a task explicitly says to construct a partial version of a file.
- `package.json`'s current uncommitted state mixes two things: (1) the two new `migrate:skill-ratings`/`migrate:skill-ratings:mysql` script lines (intended, part of this feature), and (2) an unrelated `"version": "0.1.0"` → `"0.4.0"` bump (NOT part of this feature, origin unknown — likely external deploy tooling). Commit only (1). Leave (2) as a still-uncommitted, untouched local change on disk afterward — do not discard it and do not guess whether it should be committed.
- The working tree also currently has an unrelated, separately-modified `.env` (pre-existing local dev config change, unrelated to any of this) — never stage or touch it.
- No automated tests apply to any part of this plan (Part A has no new logic beyond what a prior session's manual verification already covered; Part B is a display-only SQL query + markup addition). This repo's only test suite (`pnpm test`) covers unrelated review-workflow business logic. Verification throughout is `pnpm lint`, `pnpm run migrate:skill-ratings`, and manual checks against a running `pnpm dev` server.

---

### Task 1: Commit the ratings feature's backend (schema, migration, API) and run the migration

**Files:**
- Modify (commit as-is, already correct): `src/lib/db/schema.ts`
- Modify (commit as-is, already correct): `src/lib/db/schema.mysql.ts`
- Create (already exists on disk, untracked — commit as-is): `src/lib/db/migrate-skill-ratings.ts`
- Create (already exists on disk, untracked — commit as-is): `src/lib/db/migrate-skill-ratings-mysql.ts`
- Modify (partial — see Step 1): `package.json`
- Create (already exists on disk, untracked — commit as-is): `src/app/api/skills/[slug]/rating/route.ts`
- Modify (commit as-is, already correct): `src/lib/types.ts`

**Interfaces:**
- Consumes: nothing — first task.
- Produces: `skills.avg_rating`/`skills.rating_count` columns and the `skill_ratings` table exist in the local dev DB after this task; `POST /api/skills/[slug]/rating` is live; `SkillRow` (in `src/lib/types.ts`) has `avgRating: number`, `ratingCount: number`, `userRating: number | null` — Task 2 and Task 3 both rely on these column/field names existing exactly as spelled here.

- [ ] **Step 1: Verify each file's current content matches what's expected, then stage precisely**

Run `git diff --stat src/lib/db/schema.ts src/lib/db/schema.mysql.ts src/lib/types.ts` and confirm it shows changes (not empty) — if any of these three show no diff, STOP and report NEEDS_CONTEXT (something already committed this, don't proceed blind).

Run `git status --short src/lib/db/migrate-skill-ratings.ts src/lib/db/migrate-skill-ratings-mysql.ts src/app/api/skills/[slug]/rating/route.ts` and confirm all three show as `??` (untracked). If any is missing, STOP and report BLOCKED.

For `package.json`, the current working-tree file mixes an intended change with an unrelated one. Overwrite `package.json` with EXACTLY this content (this is the current file with `"version"` reverted to `"0.1.0"` — its state immediately before both this feature's scripts and the unrelated bump — plus the two new script lines added):

```json
{
    "name": "02-skills-portal",
    "version": "0.1.0",
    "private": true,
    "packageManager": "pnpm@9.15.9",
    "scripts": {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "eslint",
        "migrate:requirements": "tsx src/lib/db/migrate-requirements.ts",
        "migrate:timestamps": "tsx src/lib/db/migrate-timestamps.ts",
        "migrate:mysql": "tsx src/lib/db/migrate-mysql-init.ts",
        "migrate:review-workflow": "tsx src/lib/db/migrate-review-workflow.ts",
        "migrate:review-workflow:mysql": "tsx src/lib/db/migrate-review-workflow-mysql.ts",
        "migrate:users": "tsx src/lib/db/migrate-users.ts",
        "migrate:users:mysql": "tsx src/lib/db/migrate-users-mysql.ts",
        "migrate:skill-ratings": "tsx src/lib/db/migrate-skill-ratings.ts",
        "migrate:skill-ratings:mysql": "tsx src/lib/db/migrate-skill-ratings-mysql.ts",
        "test": "pnpm run test:review",
        "test:review": "tsx --test src/lib/review/*.test.ts"
    },
    "dependencies": {
        "@codemirror/commands": "^6.10.4",
        "@codemirror/lang-markdown": "^6.5.1",
        "@codemirror/language": "^6.12.4",
        "@codemirror/state": "^6.7.1",
        "@codemirror/theme-one-dark": "^6.1.3",
        "@codemirror/view": "^6.43.6",
        "@libsql/client": "^0.17.4",
        "@types/jszip": "^3.4.1",
        "drizzle-orm": "^0.45.2",
        "gray-matter": "^4.0.3",
        "jszip": "^3.10.1",
        "mysql2": "^3.23.0",
        "next": "16.2.10",
        "next-auth": "5.0.0-beta.31",
        "react": "19.2.4",
        "react-dom": "19.2.4",
        "zod": "^4.4.3",
        "zustand": "^5.0.14"
    },
    "devDependencies": {
        "@tailwindcss/postcss": "^4",
        "@types/better-sqlite3": "^7.6.13",
        "@types/node": "^20.19.43",
        "@types/react": "^19",
        "@types/react-dom": "^19",
        "drizzle-kit": "^0.31.10",
        "eslint": "^9",
        "eslint-config-next": "16.2.10",
        "tailwindcss": "^4",
        "tsx": "^4.23.1",
        "typescript": "^5"
    },
    "pnpm": {
        "onlyBuiltDependencies": [
            "sharp",
            "unrs-resolver"
        ]
    }
}
```

- [ ] **Step 2: Commit the backend files**

```bash
git add src/lib/db/schema.ts src/lib/db/schema.mysql.ts src/lib/db/migrate-skill-ratings.ts src/lib/db/migrate-skill-ratings-mysql.ts package.json src/app/api/skills/[slug]/rating/route.ts src/lib/types.ts
git status --short
```
Confirm the staged list is EXACTLY these 7 files (`git status --short` output lines starting with `A ` or `M ` for these paths only) — if `.env` or anything else appears staged, unstage with `git restore --staged <path>` before committing. Then:
```bash
git commit -m "feat: add skill ratings backend (schema, migration, API)

Adds a skill_ratings table and avg_rating/rating_count aggregate columns
on skills, a migration pair for both dialects, and POST
/api/skills/[slug]/rating to submit/update a rating."
```

- [ ] **Step 3: Restore the unrelated version bump to the working tree, uncommitted**

`package.json` on disk right now has `"version": "0.1.0"` (from your Step-1 overwrite, now committed). Restore it to `"version": "0.4.0"` (uncommitted) so that unrelated pre-existing change isn't lost:
```bash
git diff package.json
```
Expected: no output yet (file matches HEAD). Now edit just the version line back to `"0.4.0"`, save, then:
```bash
git diff package.json
```
Expected: a single-line diff, `-    "version": "0.1.0",` / `+    "version": "0.4.0",`, nothing else. Do NOT stage or commit this — leave it as an unstaged modification.

- [ ] **Step 4: Run the migration against the local dev database**

```bash
pnpm run migrate:skill-ratings
```
Expected: exits 0, logs confirming `skill_ratings` table and `avg_rating`/`rating_count` columns were created (or already exist, if this was run in an earlier session — safe either way, the migration is idempotent).

- [ ] **Step 5: Lint check**

```bash
pnpm lint
```
Expected: no new errors attributable to any of the 7 files from Step 2 (this repo has pre-existing, unrelated lint errors in other files).

- [ ] **Step 6: Commit report**

No separate report file needed for this task — its own git history is the record. Note in your final status message: the migration output from Step 4, and confirmation that Step 3 left `package.json`'s version bump as an unstaged, uncommitted change (not lost, not committed).

---

### Task 2: Commit the ratings feature's frontend wiring and verify it renders

**Files:**
- Create (already exists on disk, untracked — commit as-is): `src/components/SkillRating.tsx`
- Modify (commit as-is, already correct): `src/components/SkillCard.tsx`
- Modify (commit as-is, already correct): `src/app/api/skills/route.ts`
- Modify (commit as-is, already correct): `src/app/page.tsx`

**Interfaces:**
- Consumes: `SkillRow.avgRating`/`ratingCount`/`userRating` and `POST /api/skills/[slug]/rating` from Task 1.
- Produces: the catalog page (`/`) renders a 5-star rating widget on every skill card, reading/writing through Task 1's API. Task 3 does not depend on anything from this task directly (it queries `skills.avg_rating`/`rating_count` straight from the DB), but this task's manual verification is what confirms Task 1's backend actually works end-to-end before Task 3 builds a ranking on top of it.

- [ ] **Step 1: Verify current state, then stage precisely**

```bash
git status --short src/components/SkillRating.tsx src/components/SkillCard.tsx src/app/api/skills/route.ts src/app/page.tsx
```
Expected: `SkillRating.tsx` shows `??`; the other three show `M`. If any is missing or already committed, STOP and report NEEDS_CONTEXT.

- [ ] **Step 2: Commit**

```bash
git add src/components/SkillRating.tsx src/components/SkillCard.tsx src/app/api/skills/route.ts src/app/page.tsx
git status --short
```
Confirm exactly these 4 files are staged — if `.env` or any other file (e.g. anything under `src/lib/db/`, `src/lib/types.ts`, `package.json`) appears, unstage it with `git restore --staged <path>` before committing; those belong to Task 1 and should already be committed by now, so seeing them staged again here would mean something is wrong (re-verify against Task 1's commit before proceeding). Then:
```bash
git commit -m "feat: wire skill ratings into the catalog UI

Adds the SkillRating star widget to SkillCard, and threads
avgRating/ratingCount/the viewer's own userRating through the
catalog's server-rendered list and its client-side search API."
```

- [ ] **Step 3: Lint check**

```bash
pnpm lint
```
Expected: no new errors on the 4 files touched.

- [ ] **Step 4: Manual verification — catalog page renders stars**

```bash
pnpm dev --port 3010
```
Visit `http://localhost:3010/`. Confirm:
- Every skill card shows a row of 5 star icons below its trigger chip, with a label reading "Sin calificaciones" (since no ratings exist yet after a fresh migration) or an existing average if ratings were left over from earlier testing.
- No console/server error about `skill_ratings` or a missing column — this would indicate Task 1's migration didn't actually apply (re-run `pnpm run migrate:skill-ratings` if so).
- Sign in, click a star on any card, confirm the label updates to "Tu calificación: N/5" without a page reload.

Stop the dev server after confirming (`Ctrl+C`, or note the PID if run in background — Task 3 will need a dev server again).

---

### Task 3: Add the "Top 5 Skills · Reviews" card to `/signin`

**Files:**
- Modify: `src/app/signin/page.tsx`

**Interfaces:**
- Consumes: `skills.avg_rating`, `skills.rating_count` columns from Task 1 (queried directly via SQL, no TypeScript-level dependency on `SkillRow`).
- Produces: nothing consumed by a later task — this is the plan's last task.

- [ ] **Step 1: Add the `topRatings` query to `getStats()`**

In `src/app/signin/page.tsx`, find the `Promise.all([...])` call inside `getStats()`:
```tsx
    const [skills, installs, authors, topInstalls, topContributors, topCategories, topRecent] = await Promise.all([
      client.execute({ sql: "SELECT COUNT(*) as n FROM skills WHERE status = 'published'" }),
      client.execute({ sql: "SELECT COALESCE(SUM(install_count), 0) as n FROM skills WHERE status = 'published'" }),
      client.execute({ sql: "SELECT COUNT(DISTINCT author_handle) as n FROM skills WHERE author_handle IS NOT NULL" }),
      client.execute({ sql: "SELECT name, install_count FROM skills WHERE status = 'published' ORDER BY install_count DESC LIMIT 5" }),
      client.execute({ sql: "SELECT author_handle, COUNT(*) as n FROM skills WHERE status = 'published' AND author_handle IS NOT NULL GROUP BY author_handle ORDER BY n DESC LIMIT 5" }),
      client.execute({
        sql: `SELECT c.label, COUNT(s.id) as n FROM categories c
              LEFT JOIN skills s ON s.type = c.slug AND s.status = 'published'
              GROUP BY c.slug, c.label ORDER BY n DESC LIMIT 5`,
      }),
      client.execute({ sql: "SELECT name, created_at FROM skills WHERE status = 'published' ORDER BY created_at DESC LIMIT 5" }),
    ]);
```
Replace with (adds one query, `topRatings`, at the end):
```tsx
    const [skills, installs, authors, topInstalls, topContributors, topCategories, topRecent, topRatings] = await Promise.all([
      client.execute({ sql: "SELECT COUNT(*) as n FROM skills WHERE status = 'published'" }),
      client.execute({ sql: "SELECT COALESCE(SUM(install_count), 0) as n FROM skills WHERE status = 'published'" }),
      client.execute({ sql: "SELECT COUNT(DISTINCT author_handle) as n FROM skills WHERE author_handle IS NOT NULL" }),
      client.execute({ sql: "SELECT name, install_count FROM skills WHERE status = 'published' ORDER BY install_count DESC LIMIT 5" }),
      client.execute({ sql: "SELECT author_handle, COUNT(*) as n FROM skills WHERE status = 'published' AND author_handle IS NOT NULL GROUP BY author_handle ORDER BY n DESC LIMIT 5" }),
      client.execute({
        sql: `SELECT c.label, COUNT(s.id) as n FROM categories c
              LEFT JOIN skills s ON s.type = c.slug AND s.status = 'published'
              GROUP BY c.slug, c.label ORDER BY n DESC LIMIT 5`,
      }),
      client.execute({ sql: "SELECT name, created_at FROM skills WHERE status = 'published' ORDER BY created_at DESC LIMIT 5" }),
      client.execute({
        sql: `SELECT name, avg_rating, rating_count FROM skills
              WHERE status = 'published' AND rating_count >= 1
              ORDER BY avg_rating DESC, rating_count DESC
              LIMIT 5`,
      }),
    ]);
```

- [ ] **Step 2: Map the query result and return it from `getStats()`**

Find the `return { ... }` block inside `getStats()`:
```tsx
    return {
      published: row(skills),
      installs: row(installs),
      contributors: row(authors),
      topInstalls: topInstalls.rows.map((r) => ({
        name: String(r.name),
        value: fmt(Number(r.install_count)),
        raw: Number(r.install_count),
      })),
      topContributors: topContributors.rows.map((r) => ({
        name: String(r.author_handle),
        value: `${r.n} skill${Number(r.n) > 1 ? "s" : ""}`,
        raw: Number(r.n),
      })),
      topCategories: topCategories.rows
        .filter((r) => Number(r.n) > 0)
        .map((r) => ({
          name: String(r.label),
          value: `${r.n} skill${Number(r.n) > 1 ? "s" : ""}`,
          raw: Number(r.n),
        })),
      topRecent: recentWithAge.map((r) => ({
        name: r.name,
        value: daysAgoLabel(r.daysAgo),
        raw: maxDaysAgo - r.daysAgo + 1,
      })),
    };
```
Replace with (adds `topRatings` to the returned object):
```tsx
    return {
      published: row(skills),
      installs: row(installs),
      contributors: row(authors),
      topInstalls: topInstalls.rows.map((r) => ({
        name: String(r.name),
        value: fmt(Number(r.install_count)),
        raw: Number(r.install_count),
      })),
      topContributors: topContributors.rows.map((r) => ({
        name: String(r.author_handle),
        value: `${r.n} skill${Number(r.n) > 1 ? "s" : ""}`,
        raw: Number(r.n),
      })),
      topCategories: topCategories.rows
        .filter((r) => Number(r.n) > 0)
        .map((r) => ({
          name: String(r.label),
          value: `${r.n} skill${Number(r.n) > 1 ? "s" : ""}`,
          raw: Number(r.n),
        })),
      topRecent: recentWithAge.map((r) => ({
        name: r.name,
        value: daysAgoLabel(r.daysAgo),
        raw: maxDaysAgo - r.daysAgo + 1,
      })),
      topRatings: topRatings.rows.map((r) => ({
        name: String(r.name),
        value: `${Number(r.avg_rating).toFixed(1)} ★ · ${r.rating_count}`,
        raw: Number(r.avg_rating),
      })),
    };
```

- [ ] **Step 3: Update the catch-block fallback**

Find:
```tsx
  } catch {
    return { published: 0, installs: 0, contributors: 0, topInstalls: [], topContributors: [], topCategories: [], topRecent: [] };
  }
```
Replace with:
```tsx
  } catch {
    return { published: 0, installs: 0, contributors: 0, topInstalls: [], topContributors: [], topCategories: [], topRecent: [], topRatings: [] };
  }
```
(This keeps the function's two return paths structurally identical — required since both are used as the return type of the same async function.)

- [ ] **Step 4: Add the card to `topLists`**

Find:
```tsx
  const topLists = [
    { title: "Top 5 Skills · instalaciones", barColor: "var(--green)", rows: rankRows(stats.topInstalls) },
    { title: "Top 5 Skills · recientes", barColor: "var(--accent)", rows: rankRows(stats.topRecent) },
    { title: "Top 5 Contribuyentes", barColor: "var(--accent-indigo)", rows: rankRows(stats.topContributors) },
    { title: "Top 5 Categorías", barColor: "#c46a3f", rows: rankRows(stats.topCategories) },
  ].filter((l) => l.rows.length > 0);
```
Replace with (adds one entry):
```tsx
  const topLists = [
    { title: "Top 5 Skills · instalaciones", barColor: "var(--green)", rows: rankRows(stats.topInstalls) },
    { title: "Top 5 Skills · recientes", barColor: "var(--accent)", rows: rankRows(stats.topRecent) },
    { title: "Top 5 Skills · Reviews", barColor: "var(--amber)", rows: rankRows(stats.topRatings) },
    { title: "Top 5 Contribuyentes", barColor: "var(--accent-indigo)", rows: rankRows(stats.topContributors) },
    { title: "Top 5 Categorías", barColor: "#c46a3f", rows: rankRows(stats.topCategories) },
  ].filter((l) => l.rows.length > 0);
```
No other part of the file changes — the existing `.map((col) => ...)` render block already handles any entry in `topLists` generically (title, barColor, rows), so the new card renders through the same code path as the other four with zero additional markup.

- [ ] **Step 5: Verify `var(--amber)` exists**

```bash
grep -n "\-\-amber" src/app/globals.css
```
Expected: at least one match (both light and dark theme blocks). If no match, STOP and report NEEDS_CONTEXT — do not invent a hex value; the color must come from an existing CSS variable used elsewhere in this codebase (it's already referenced by review-status badges).

- [ ] **Step 6: Lint check**

```bash
pnpm lint
```
Expected: no new errors on `src/app/signin/page.tsx`.

- [ ] **Step 7: Commit**

```bash
git add src/app/signin/page.tsx
git status --short
```
Confirm only this one file is staged. Then:
```bash
git commit -m "feat: add Top 5 Skills · Reviews card to /signin

Ranks published skills by average star rating (min. 1 rating to
qualify), reusing the page's existing ranked-list card pattern."
```

- [ ] **Step 8: Full manual verification (per the design spec)**

```bash
pnpm dev --port 3010
```
1. Sign out (or open a private/incognito window), visit `http://localhost:3010/signin`. With zero ratings in the database (fresh migration, nobody has rated anything yet), confirm the "Top 5 Skills · Reviews" card does NOT render, and the other 4 cards render normally.
2. Sign in, visit `/`, click stars to rate at least one published skill 4 or 5 stars.
3. Sign out, revisit `/signin`. Confirm the "Top 5 Skills · Reviews" card now appears, showing that skill with the correct `"X.X ★ · N"` text and a bar filled proportional to its rating relative to the top entry (if it's the only rated skill, its bar should be 100%).
4. Sign in again, rate 2-3 more skills with different star values. Sign out, revisit `/signin` once more. Confirm the list is sorted highest-average-first, caps at 5 rows, and the bar percentages are relative to the current top entry's average.

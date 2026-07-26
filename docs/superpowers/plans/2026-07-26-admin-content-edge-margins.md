# Admin Content Edge Margins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the left margin (to sidebar), right margin (to browser edge), and top margin (below top bar) on four admin pages constant at any window width, instead of growing/shrinking together via CSS auto-centering.

**Architecture:** Each affected page renders a single content wrapper `<div>`/`<main>` directly inside `AppShell`'s content column, styled with `maxWidth: "<N>px", margin: "0 auto", padding: "<Y>px <X>px"`. Removing `maxWidth` and `margin` from that one inline style object — leaving `padding` untouched — makes the wrapper stretch to the full available width, so its own padding becomes the permanent, fixed left/right/top gap. No component structure changes, no new props, no changes to child components (`UsersManager`, category list, review list) — they already render at `width: 100%` or fill their parent naturally.

**Tech Stack:** Next.js 16 App Router, React inline `style={{}}` objects (no Tailwind classes used in these files, no CSS modules).

## Global Constraints

- Scope is exactly 4 files: `src/app/users/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/review/page.tsx`, `src/app/categories/page.tsx`. Do not touch any other page that shares the same centered pattern (e.g. `proposals`, `skills/[slug]`, `publish`, `WizardLayout`, `loading.tsx` skeletons) — out of scope per the design spec.
- Each edit removes exactly two style keys (`maxWidth`, `margin`) and must not change the `padding` value already present on that wrapper.
- No other props, children, or surrounding markup on these lines may change.

---

### Task 1: Remove centering from the four admin page content wrappers

**Files:**
- Modify: `src/app/users/page.tsx` (line ~31)
- Modify: `src/app/dashboard/page.tsx` (line ~49)
- Modify: `src/app/review/page.tsx` (line ~28)
- Modify: `src/app/categories/page.tsx` (line ~48)

**Interfaces:**
- Consumes: nothing — pure inline-style edit, no new imports or exports.
- Produces: nothing consumed by later tasks — this is the only task in this plan.

- [ ] **Step 1: Confirm the exact current line in each file**

Run, from the repo root:
```bash
grep -n 'maxWidth.*margin: "0 auto"' src/app/users/page.tsx src/app/dashboard/page.tsx src/app/review/page.tsx src/app/categories/page.tsx
```
Expected output (one match per file):
```
src/app/users/page.tsx:31:      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
src/app/dashboard/page.tsx:49:      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
src/app/review/page.tsx:28:      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
src/app/categories/page.tsx:48:      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 24px" }}>
```
If any line differs from this (different padding value, different tag, different line number), use the actual current content of that line as the starting point for Step 2 instead of the text shown above — the padding value must be preserved exactly as found, only `maxWidth` and `margin` are removed.

- [ ] **Step 2: Edit each of the four lines**

In `src/app/users/page.tsx`, change:
```tsx
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
```
to:
```tsx
      <div style={{ padding: "32px 24px" }}>
```

In `src/app/dashboard/page.tsx`, change:
```tsx
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
```
to:
```tsx
      <main style={{ padding: "32px 24px" }}>
```

In `src/app/review/page.tsx`, change:
```tsx
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
```
to:
```tsx
      <main style={{ padding: "32px 24px" }}>
```

In `src/app/categories/page.tsx`, change:
```tsx
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 24px" }}>
```
to:
```tsx
      <div style={{ padding: "32px 24px" }}>
```

- [ ] **Step 3: Verify no other occurrences of `maxWidth`/`margin: "0 auto"` remain on these four wrappers**

Run:
```bash
grep -n 'maxWidth.*margin: "0 auto"' src/app/users/page.tsx src/app/dashboard/page.tsx src/app/review/page.tsx src/app/categories/page.tsx
```
Expected: no output (all four matches from Step 1 are gone). If any line still matches, you edited the wrong line or missed a file — go back to Step 2.

- [ ] **Step 4: Lint check**

Run:
```bash
pnpm lint
```
Expected: the same set of pre-existing errors/warnings as on `master` (this repo has 22 pre-existing lint errors and 8 warnings in unrelated files as of this plan's writing) — no *new* errors introduced by this change. If you see a new error pointing at one of the 4 edited lines, re-check the edit for a syntax mistake (e.g. a stray trailing comma or unbalanced brace).

- [ ] **Step 5: Manual visual verification**

There is no automated test harness for layout/CSS in this repo (`pnpm test` only covers `src/lib/review/*.test.ts`, unrelated business logic) — verify visually:

1. Run `pnpm dev --port 3010`.
2. Sign in with an account that has the `admin` role (needed to reach `/dashboard/categories` and `/dashboard/review` per the route guards in `src/proxy.ts`; `/users` needs `admin` too).
3. Open each of: `http://localhost:3010/users`, `http://localhost:3010/dashboard`, `http://localhost:3010/review`, `http://localhost:3010/categories`.
4. On each page, resize the browser window from narrow to very wide (or use devtools' responsive mode dragging the width slider).
5. Confirm the gap between the sidebar's right edge and the content's left edge stays visually constant (equal to 24px) at every width tested, and the gap between the content's right edge and the browser's right edge also stays visually constant (equal to 24px) — neither should grow as the window widens (this was the bug: both used to grow together via `margin: 0 auto` centering).
6. Confirm the gap between the top bar's bottom edge and the content's top edge stays at 32px, unchanged from before (this was never actually broken, but confirm no regression).

- [ ] **Step 6: Commit**

```bash
git add src/app/users/page.tsx src/app/dashboard/page.tsx src/app/review/page.tsx src/app/categories/page.tsx
git commit -m "fix: preserve fixed content margins on admin pages instead of centering

Sidebar-left, browser-right, and topbar-top gaps now stay constant at any
window width on /users, /dashboard, /review, and /categories, instead of
growing together via margin: 0 auto centering."
```

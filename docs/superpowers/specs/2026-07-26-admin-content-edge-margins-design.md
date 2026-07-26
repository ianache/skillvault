# Admin content edge margins — design

## Context

A design mockup for "Gestión de Roles" (imported from Claude's Design tool, project `Catálogo de Skills`, file `Gestión de Roles.dc.html` + its shared `App Shell.dc.html`) specifies that the content area's spacing to the sidebar (left), browser viewport edge (right), and top bar (top) must be **preserved** — i.e. constant, regardless of window width.

The real `/users` ("Gestión de Roles") page does not behave this way today. Its content wrapper centers itself:
```tsx
<div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
```
`margin: "0 auto"` makes the left and right gaps grow together as the browser window widens — they are not fixed/preserved. The top gap (from `padding`, not `margin`) was already constant and is not affected.

Three other admin pages sharing the exact same shell (`AppShell` → sidebar + top bar) use the identical centered pattern and have the identical bug: `dashboard`, `review`, and `categories`. Per user decision, this fix is extended to all four pages for immediate consistency. The visual system itself (dark theme, `AppShell`/`AppSidebar`/`AppTopBar`) is explicitly out of scope — this is a spacing-only fix, not an adoption of the new design's visual style.

## Approach

Remove `maxWidth` and `margin: "0 auto"` from each page's content wrapper, keeping its existing `padding` unchanged. The wrapper then stretches to the full width available between the sidebar and the browser's right edge, so:
- left margin (sidebar → content) = the wrapper's own left padding, constant at any window width
- right margin (content → browser edge) = the wrapper's own right padding, constant at any window width
- top margin (top bar → content) = the wrapper's own top padding, constant (unchanged — this was never actually broken)

No changes to `UsersManager.tsx` or any other inner content component — each already renders at `width: 100%` (or fills the wrapper naturally), so it stretches into the freed-up space with no further edits.

**Alternatives considered and rejected:**
- Keeping a `max-width` cap but dropping only `margin: auto` (left-anchored instead of centered) — still lets the right margin grow unbounded on very wide monitors once the cap is hit, so "preserved" would only hold below a certain width. Rejected.
- A responsive breakpoint hybrid (full-width below some threshold, centered/capped above it) — solves a problem nobody raised and adds a media-query complexity the task doesn't call for. Rejected (YAGNI).

## Files to change

Each is a one-line style-object edit — drop two keys (`maxWidth`, `margin`), keep `padding` as-is:

- `src/app/users/page.tsx` (line ~31): `<div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>` → `<div style={{ padding: "32px 24px" }}>`
- `src/app/dashboard/page.tsx` (line ~49): `<main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>` → `<main style={{ padding: "32px 24px" }}>`
- `src/app/review/page.tsx` (line ~28): `<main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>` → `<main style={{ padding: "32px 24px" }}>`
- `src/app/categories/page.tsx` (line ~48): `<div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 24px" }}>` → `<div style={{ padding: "32px 24px" }}>`

Out of scope (same centered pattern exists here too, but not part of this request): `src/app/proposals/page.tsx`, `src/app/proposals/[id]/page.tsx`, `src/app/review/[id]/page.tsx`, `src/app/skills/[slug]/page.tsx`, `src/app/skills/[slug]/edit/page.tsx`, `src/app/publish/page.tsx`, `src/components/wizard/WizardLayout.tsx`, `src/app/dashboard/loading.tsx`, `src/app/loading.tsx`.

## Verification

Visual only — no logic changes, no new tests warranted. Run `pnpm dev`, open each of the 4 pages, resize the browser window wider and narrower, and confirm the left gap (to sidebar) and right gap (to viewport edge) stay visually constant (equal to the page's padding value) at every width, instead of growing/shrinking together as before.

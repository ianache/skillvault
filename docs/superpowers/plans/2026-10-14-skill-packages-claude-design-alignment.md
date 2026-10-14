# Skill Packages Claude Design Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the package navigation and the FLW-001 maintenance screens with the approved Claude Design direction, and expose the public package catalog required by US-002 while keeping installation CLI-owned.

**Architecture:** Keep public discovery at `/packages/public` and administrative maintenance at `/packages`. Add a public shell navigation item without changing RBAC. Improve package UI states and public discovery using existing package services; do not invent browser installation or filesystem progress. Keep `SCR-006` out of this implementation increment.

**Tech Stack:** Next.js App Router, React, TypeScript, inline CSS custom properties, Node test runner via `tsx --test`, Docker Compose for browser verification.

**Spec:** `docs/superpowers/specs/2026-10-14-skill-packages-claude-design-alignment.md`

## Global Constraints

- `Paquetes` routes to `/packages/public`; `Gestionar paquetes` routes to `/packages`.
- Public users must not be routed to `/packages/{slug}/edit` from the consumption flow.
- Installation remains CLI-owned for this increment.
- Do not change authentication/RBAC contracts.
- Do not claim browser installation or fabricate `SCR-006` progress/rollback.
- Preserve unrelated dirty-worktree changes.
- Use semantic design tokens and preserve WCAG 2.2 AA behavior.

## Review Focus

- Public navigation must be visible to users without `content:manage`; test in `navigation-policy.test.ts`.
- Administrative navigation must remain capability-gated; test the same policy module.
- Public package cards must link only to `/packages/public/{slug}`; test `PublicPackageCatalogClient` source/route behavior.
- Draft/retired package visibility must remain non-operable; test public listing filtering and route behavior.
- Package detail must expose download/CLI handoff without claiming local installation; test `SCR-005` source smoke coverage.

### Task 1: Public package navigation

**Files:**
- Modify: `src/components/shell/navigation.ts`
- Test: `src/lib/review/navigation-policy.test.ts`
- Test: `src/lib/review/ui-smoke.test.ts`

**Interfaces:**
- Consumes: `getNavigationGroups(roles)` and existing `SkillVaultCapability` values.
- Produces: a public navigation item `{ label: "Paquetes", href: "/packages/public", iconPath: ... }` without a capability; existing `Gestionar paquetes` remains `content:manage` protected.

- [ ] **Step 1: Write failing policy assertions** for an unauthenticated/public role set containing `Paquetes` and not containing `Gestionar paquetes`.
- [ ] **Step 2: Run the focused navigation tests** and confirm the new assertions fail.
- [ ] **Step 3: Add the public `Paquetes` item** to the exploration/content navigation group, preserving the existing administrative item and SVG path conventions.
- [ ] **Step 4: Run the focused navigation and smoke tests** and confirm both public and administrative expectations pass.

### Task 2: SCR-001 maintenance catalog fidelity

**Files:**
- Modify: `src/app/packages/page.tsx`
- Modify: `src/components/packages/PackageCatalogClient.tsx`
- Test: `src/lib/review/ui-smoke.test.ts`

**Interfaces:**
- Consumes: `listPackages(client)` and existing `PackageSummary` fields.
- Produces: permission-aware maintenance catalog with Claude Design table structure, explicit loading/empty/error/access-denied semantics, and action labels consistent with `SCR-001`.

- [ ] **Step 1: Add failing smoke assertions** for package page title, create action, package table semantics, and explicit access-denied copy.
- [ ] **Step 2: Run the focused smoke test** and confirm the missing assertions fail.
- [ ] **Step 3: Align the catalog markup and copy** with the Claude Design table while preserving search, role/status filters, and existing mutation actions.
- [ ] **Step 4: Add a visible retry/error state** that does not discard the current filter state.
- [ ] **Step 5: Run the focused smoke test** and verify no regression in existing package actions.

### Task 3: SCR-004 public catalog entry and filtering

**Files:**
- Modify: `src/components/packages/PublicPackageCatalogClient.tsx`
- Modify: `src/lib/packages/ui.ts` only if a pure public-card formatting helper is required.
- Test: `src/lib/packages/ui.test.ts`
- Test: `src/lib/review/ui-smoke.test.ts`

**Interfaces:**
- Consumes: `PackageSummary[]` from `listPackages(client, true)`.
- Produces: public package cards linking to `/packages/public/{slug}`, with published-only behavior and explicit empty/result states.

- [ ] **Step 1: Add failing tests** for public card links, published status text, role/version/Skill count rendering when available, and no edit-route links.
- [ ] **Step 2: Run focused package/UI tests** and confirm failure.
- [ ] **Step 3: Align card layout and copy** with Claude Design using only persisted fields; show a neutral unavailable state for data not provided by the current contract instead of inventing harness/policy values.
- [ ] **Step 4: Add the public result-state behavior** for empty results and no matching filters.
- [ ] **Step 5: Run focused tests** and verify the public catalog remains independent of administrative permissions.

### Task 4: SCR-002 editor state communication

**Files:**
- Modify: `src/components/packages/PackageEditorClient.tsx`
- Test: `src/lib/review/ui-smoke.test.ts`

**Interfaces:**
- Consumes: existing editor state (`message`, `error`, draft/version state, selected Skills).
- Produces: accessible UI communication for `Edición`, `Validación`, `Conflicto` and permission/error conditions without adding prototype-only state controls.

- [ ] **Step 1: Add failing assertions** for draft status, validation error summary, `aria-invalid` on invalid fields, and preserved valid input.
- [ ] **Step 2: Run the focused smoke test** and confirm failure.
- [ ] **Step 3: Add semantic status/summary regions** and field error mapping to the existing editor state.
- [ ] **Step 4: Verify loading/disabled behavior** for save/version/review actions without changing API contracts.
- [ ] **Step 5: Run focused tests** and manually inspect keyboard focus order in the browser.

### Task 5: SCR-003 review state and publication handoff

**Files:**
- Modify: `src/components/packages/PackageReviewClient.tsx`
- Modify: `src/app/packages/[slug]/review/page.tsx` only if required to pass additional existing review data.
- Test: `src/lib/review/ui-smoke.test.ts`

**Interfaces:**
- Consumes: existing `PackageSummary`, `PackageManifest`, version and review-request API.
- Produces: review screen with explicit validation summary, warnings, disabled/available publication handoff, and a clear return-to-editor path.

- [ ] **Step 1: Add failing assertions** for version transition, blocking/non-blocking warning semantics, review action state, and `role="alert"` behavior.
- [ ] **Step 2: Run the focused smoke test** and confirm failure.
- [ ] **Step 3: Align review markup and copy** with Claude Design using currently available data; do not fabricate audit events or direct publication if the API only supports review requests.
- [ ] **Step 4: Keep the existing review request route** and make the handoff explicit in the UI.
- [ ] **Step 5: Run focused tests** and verify review submission remains permission-protected.

### Task 6: SCR-005 CLI handoff and download fidelity

**Files:**
- Modify: `src/app/packages/public/[slug]/page.tsx`
- Test: `src/lib/review/ui-smoke.test.ts`
- Test: `src/lib/packages/serializer.test.ts` only if download content assertions need extension.

**Interfaces:**
- Consumes: `getPackage`, `getPublishedManifest`, `packageWarning`, and existing package download route.
- Produces: public detail with installable/omitted groups, version policy, ZIP/manifest downloads and an explicit CLI-only installation handoff.

- [ ] **Step 1: Add failing assertions** for public detail headings, omitted Skill warning, CLI command, manifest/ZIP links, and absence of package execution controls.
- [ ] **Step 2: Run focused UI/download tests** and confirm failure.
- [ ] **Step 3: Align detail grouping and copy** with Claude Design while stating that browser download is not local installation.
- [ ] **Step 4: Verify both downloads** against a published package and inspect ZIP entries.
- [ ] **Step 5: Run focused tests** and browser verification at `/packages/public/{slug}`.

### Task 7: Full verification and traceability update

**Files:**
- Modify: `knowledge-base/changelog.md` only after human-approved artifact changes are agreed.
- Modify: `knowledge-base/index.md` only if new canonical artifacts are added.

- [ ] **Step 1: Run focused package tests.**
- [ ] **Step 2: Run the repository review suite:** `pnpm test`.
- [ ] **Step 3: Start/refresh Docker Compose and verify public/admin navigation and downloads in Edge.**
- [ ] **Step 4: Compare implemented screens against the authenticated Claude Design prototype and record remaining gaps.**
- [ ] **Step 5: Run `graphify update .` after code changes.**
- [ ] **Step 6: Report changed files, tests, visual evidence and unresolved `SCR-006` decision.**


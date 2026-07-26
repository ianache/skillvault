# Shared PageHeader Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the catalog page's light-background title strip into a reusable `PageHeader` component and apply it consistently to every management/detail page in the app (except the deliberately-excluded centered state screens and the login page).

**Architecture:** One new presentational component (`src/components/PageHeader.tsx`) with three props (`title`, optional `description` as `React.ReactNode`, optional `actions` as `React.ReactNode`), rendered in one of two positions depending on the page: full-bleed directly under the top bar for section-title pages, or nested in place (same light band, same typography, just width-constrained to the existing content column) for record/detail pages that already have their own breadcrumb/back-link above. No new state, no new data fetching — every prop value already exists in the page that renders it today; this is a pure markup swap.

**Tech Stack:** Next.js 16 App Router, React inline `style={{}}` objects (no Tailwind classes, no CSS modules — matches every file this plan touches).

## Global Constraints

- `PageHeader` props: `{ title: string; description?: React.ReactNode; actions?: React.ReactNode }`. `description` is `React.ReactNode`, not `string`, because two consumers pass a small metadata row instead of a sentence.
- Visual spec (exact, copied from the catalog's current hero strip — do not alter any of these values): wrapper `borderBottom: "1px solid var(--border)", padding: "16px 24px", background: "var(--surface)"`, no `maxWidth`/`margin: auto`; layout `display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap"`; title `fontFamily: "var(--font-geist), sans-serif", fontSize: "18px", fontWeight: 700, color: "var(--text)"` with `marginBottom: "2px"` when a description is present else `0`; description (when a plain string is passed by a caller) `fontSize: "13px", color: "var(--muted)", margin: 0`; actions wrapper `display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", flexShrink: 0`.
- In scope: `src/app/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/users/page.tsx`, `src/app/categories/page.tsx`, `src/app/proposals/page.tsx`, `src/app/review/page.tsx`, `src/app/publish/page.tsx` (step-0 loader screen only), `src/app/skills/[slug]/page.tsx`, `src/app/skills/[slug]/edit/page.tsx`, `src/components/review/ReviewRequestDetail.tsx`.
- Out of scope — do not touch: `src/app/unauthorized/page.tsx`, `src/app/not-found.tsx`, `src/app/error.tsx`, `src/app/publish/success/page.tsx`, `src/components/wizard/WizardLayout.tsx` (publish steps 1-4), `src/app/review/[id]/page.tsx`, `src/app/proposals/[id]/page.tsx` (both get the new header for free through `ReviewRequestDetail.tsx` — do not edit these two page files directly).
- Every existing piece of information currently shown in a page's header (badges, stat boxes, metadata, link text) must still be shown after the change — nothing gets deleted, only relocated into `description`/`actions`.
- No automated tests exist or are to be added for this change — it is a pure markup/CSS change with no logic, matching the precedent set by the margins-fix plan earlier in this repo's history (`docs/superpowers/plans/2026-07-26-admin-content-edge-margins.md`). Verification is manual, in the browser.

---

### Task 1: Create the `PageHeader` component

**Files:**
- Create: `src/components/PageHeader.tsx`

**Interfaces:**
- Consumes: nothing — no dependencies on other tasks.
- Produces: `export function PageHeader({ title, description, actions }: PageHeaderProps)`, `PageHeaderProps` exported alongside it, for Tasks 2 and 3 to import as `import { PageHeader } from "@/components/PageHeader";` (or a relative `../components/PageHeader` / `../../components/PageHeader` depending on the consuming file's depth).

- [ ] **Step 1: Write the component**

Create `src/components/PageHeader.tsx` with exactly this content:

```tsx
interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div
      style={{
        borderBottom: "1px solid var(--border)",
        padding: "16px 24px",
        background: "var(--surface)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      <div>
        <h1
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: description ? "2px" : 0,
          }}
        >
          {title}
        </h1>
        {description && (
          <div style={{ fontSize: "13px", color: "var(--muted)" }}>{description}</div>
        )}
      </div>
      {actions && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  );
}
```

Note: the description wrapper is a `<div>`, not a `<p>` — the catalog's original used `<p>`, but two consumers in Task 3 pass a `<div>` (a metadata row) as `description`, and a `<div>` cannot legally nest inside a `<p>`. A `<div>` wrapper works correctly for both plain-string and rich-node callers.

- [ ] **Step 2: Lint check**

Run: `pnpm lint`
Expected: no new errors attributable to `src/components/PageHeader.tsx` (this repo has pre-existing, unrelated lint errors in other files — compare the file list in the output against `src/components/PageHeader.tsx` specifically; that file should not appear).

- [ ] **Step 3: Commit**

```bash
git add src/components/PageHeader.tsx
git commit -m "feat: add shared PageHeader component

Extracts the catalog page's light-background title strip into a reusable
component for use across the app's management and detail pages."
```

---

### Task 2: Full-bleed rollout (7 files)

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/app/users/page.tsx`
- Modify: `src/app/categories/page.tsx`
- Modify: `src/app/proposals/page.tsx`
- Modify: `src/app/review/page.tsx`
- Modify: `src/app/publish/page.tsx`

**Interfaces:**
- Consumes: `PageHeader` from Task 1 (`src/components/PageHeader.tsx`), props `{ title, description?, actions? }`.
- Produces: nothing consumed by Task 3 — these two tasks are independent and can be done in either order.

- [ ] **Step 1: `src/app/page.tsx` — replace the hero strip**

Find this block (currently right after `<AppHeader />` and before the "CLI download banner" comment):

```tsx
      {/* Hero strip */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "16px 24px",
          background: "var(--surface)",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "2px",
          }}
        >
          {q ? `Resultados para "${q}"` : "Catálogo de Skills"}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--muted)" }}>
          Skills reutilizables para Claude Code y otros harnesses compatibles con el estándar SKILL.md de Anthropic.
        </p>
      </div>
```

Replace it with:

```tsx
      <PageHeader
        title={q ? `Resultados para "${q}"` : "Catálogo de Skills"}
        description="Skills reutilizables para Claude Code y otros harnesses compatibles con el estándar SKILL.md de Anthropic."
      />
```

Add the import near the top of the file, alongside the other component imports:

```tsx
import { PageHeader } from "@/components/PageHeader";
```

- [ ] **Step 2: `src/app/dashboard/page.tsx` — replace the page header block**

Find (the `{/* Page header */}` block, currently the first thing inside `<main>`):

```tsx
        {/* Page header */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <h1
              style={{
                fontFamily: "var(--font-geist), sans-serif",
                fontSize: "24px",
                fontWeight: 700,
                color: "var(--text)",
                margin: 0,
              }}
            >
              Mis Skills
            </h1>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>
              Gestiona, edita y monitorea tus skills creados y reutilizables en SkillVault.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Link
              href="/publish"
              style={{
                fontFamily: "var(--font-geist), sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                padding: "9px 20px",
                borderRadius: "8px",
                background: "var(--accent)",
                color: "#fff",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              + Publicar nuevo skill
            </Link>
          </div>
        </div>
```

Move this out of `<main>` entirely and replace with (note: `<main>` no longer contains this block — everything else inside `<main>`, starting with the "Stats row" comment, is untouched):

```tsx
      <PageHeader
        title="Mis Skills"
        description="Gestiona, edita y monitorea tus skills creados y reutilizables en SkillVault."
        actions={
          <Link
            href="/publish"
            style={{
              fontFamily: "var(--font-geist), sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              padding: "9px 20px",
              borderRadius: "8px",
              background: "var(--accent)",
              color: "#fff",
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            + Publicar nuevo skill
          </Link>
        }
      />
      <main style={{ padding: "32px 24px" }}>
```

So the surrounding structure becomes:

```tsx
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <PageHeader ... actions={...} />
      <main style={{ padding: "32px 24px" }}>
        {/* Stats row */}
        ...unchanged...
      </main>
    </div>
  );
```

Add the import: `import { PageHeader } from "@/components/PageHeader";`

- [ ] **Step 3: `src/app/users/page.tsx` — replace the header, drop `AppHeader`**

Find:

```tsx
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <AppHeader />
      <div style={{ padding: "32px 24px" }}>
        <div style={{ marginBottom: "28px" }}>
          <h1
            style={{
              fontFamily: "var(--font-geist), sans-serif",
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "4px",
            }}
          >
            Gestión de roles
          </h1>
          <p style={{ fontSize: "13px", color: "var(--muted)", maxWidth: "62ch" }}>
            Los usuarios provienen de Keycloak y ya existen en el sistema. Aquí solo se asignan o revocan sus roles dentro de SkillVault.
          </p>
        </div>
        <UsersManager initialUsers={users} />
      </div>
    </div>
  );
```

Replace with:

```tsx
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <PageHeader
        title="Gestión de roles"
        description="Los usuarios provienen de Keycloak y ya existen en el sistema. Aquí solo se asignan o revocan sus roles dentro de SkillVault."
      />
      <div style={{ padding: "32px 24px" }}>
        <UsersManager initialUsers={users} />
      </div>
    </div>
  );
```

Remove the `import { AppHeader } from "@/components/AppHeader";` line and add `import { PageHeader } from "@/components/PageHeader";` in its place.

- [ ] **Step 4: `src/app/categories/page.tsx` — replace the header, drop `AppHeader`**

Find:

```tsx
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <AppHeader />
      <div style={{ padding: "32px 24px" }}>
        <div style={{ marginBottom: "28px" }}>
          <h1
            style={{
              fontFamily: "var(--font-geist), sans-serif",
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "4px",
            }}
          >
            Gestión de categorías
          </h1>
          <p style={{ fontSize: "13px", color: "var(--muted)" }}>
            Las categorías organizan el catálogo. Solo administradores pueden gestionarlas.
          </p>
        </div>
        <CategoriesManager initialCategories={categories} skillCounts={skillCounts} />
      </div>
    </div>
  );
```

Replace with:

```tsx
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <PageHeader
        title="Gestión de categorías"
        description="Las categorías organizan el catálogo. Solo administradores pueden gestionarlas."
      />
      <div style={{ padding: "32px 24px" }}>
        <CategoriesManager initialCategories={categories} skillCounts={skillCounts} />
      </div>
    </div>
  );
```

Remove the `AppHeader` import, add the `PageHeader` import (same as Step 3).

- [ ] **Step 5: `src/app/proposals/page.tsx` — replace the header, drop `AppHeader`, delete unused style constants**

Find:

```tsx
export default async function ProposalsPage() {
  const session = await auth();
  const data = session ? await fetchReviewRequests("?mine=1") : null;
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <AppHeader />
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
        <h1 style={headingStyle}>Mis propuestas</h1>
        <p style={descriptionStyle}>Estado y comentarios de los skills enviados a revision.</p>
        {data ? (
          <ReviewFilterableList initialRequests={data.requests} counts={data.counts} mode="author" />
        ) : (
          <State message="Inicia sesion para ver tus propuestas." />
        )}
      </main>
    </div>
  );
}

function State({ message }: { message: string }) {
  return (
    <div style={{ padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--muted)", fontSize: "13px" }}>
      {message}
    </div>
  );
}

const headingStyle: React.CSSProperties = { fontFamily: "var(--font-geist), sans-serif", fontSize: "24px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px" };
const descriptionStyle: React.CSSProperties = { fontSize: "13px", color: "var(--muted)", margin: "0 0 24px" };
```

Replace with:

```tsx
export default async function ProposalsPage() {
  const session = await auth();
  const data = session ? await fetchReviewRequests("?mine=1") : null;
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <PageHeader title="Mis propuestas" description="Estado y comentarios de los skills enviados a revision." />
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
        {data ? (
          <ReviewFilterableList initialRequests={data.requests} counts={data.counts} mode="author" />
        ) : (
          <State message="Inicia sesion para ver tus propuestas." />
        )}
      </main>
    </div>
  );
}

function State({ message }: { message: string }) {
  return (
    <div style={{ padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--muted)", fontSize: "13px" }}>
      {message}
    </div>
  );
}
```

(`headingStyle`/`descriptionStyle` are deleted entirely — nothing else in this file uses them.) Remove the `AppHeader` import, add the `PageHeader` import. Note: this page's own `<main>` keeps its `maxWidth: "1100px", margin: "0 auto"` — that is a pre-existing, separate concern out of scope for this plan (unlike `dashboard`/`users`/`review`/`categories`, this file was not touched by the earlier margins-fix plan).

- [ ] **Step 6: `src/app/review/page.tsx` — replace the header inside `PageShell`, drop `AppHeader`, delete unused style constants**

Find:

```tsx
function PageShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <AppHeader />
      <main style={{ padding: "32px 24px" }}>
        <h1 style={headingStyle}>{title}</h1>
        <p style={descriptionStyle}>{description}</p>
        {children}
      </main>
    </div>
  );
}

function State({ message }: { message: string }) {
  return (
    <div style={{ padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--muted)", fontSize: "13px" }}>
      {message}
    </div>
  );
}

const headingStyle: React.CSSProperties = { fontFamily: "var(--font-geist), sans-serif", fontSize: "24px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px" };
const descriptionStyle: React.CSSProperties = { fontSize: "13px", color: "var(--muted)", margin: "0 0 24px" };
```

Replace with:

```tsx
function PageShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <PageHeader title={title} description={description} />
      <main style={{ padding: "32px 24px" }}>
        {children}
      </main>
    </div>
  );
}

function State({ message }: { message: string }) {
  return (
    <div style={{ padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--muted)", fontSize: "13px" }}>
      {message}
    </div>
  );
}
```

`ReviewQueuePage` itself and its `<PageShell title="Cola de revision" description="...">` call site are unchanged — `PageShell`'s external interface (props) is identical. Remove the `AppHeader` import, add the `PageHeader` import.

- [ ] **Step 7: `src/app/publish/page.tsx` — add the header above the step-0 breadcrumb**

Find (the start of the `step === 0` branch):

```tsx
  // Step 0: loader screen (outside WizardLayout)
  if (step === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        {/* Header navigation bar styled like AppTopBar */}
        <header
```

Replace with:

```tsx
  // Step 0: loader screen (outside WizardLayout)
  if (step === 0) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <PageHeader title="Publicar skill" description="Carga un SKILL.md local o crea uno nuevo desde cero." />
        {/* Header navigation bar styled like AppTopBar */}
        <header
```

(Everything else in this file — the breadcrumb `<header>`, the wizard steps 1-4 rendered via `WizardLayout`, all state/handlers — is unchanged.) Add the import: `import { PageHeader } from "@/components/PageHeader";` (this file is a `"use client"` component; the import goes with the other imports at the top, e.g. alongside `import { WizardLayout } from "@/components/wizard/WizardLayout";`).

- [ ] **Step 8: Verify no old header markup remains**

Run:
```bash
grep -rn "Hero strip\|Page header\|Gestión de roles</\|Gestión de categorías</\|Mis propuestas</h1" src/app/page.tsx src/app/dashboard/page.tsx src/app/users/page.tsx src/app/categories/page.tsx src/app/proposals/page.tsx
```
Expected: no output (all the replaced `<h1>` text now lives inside `<PageHeader title="...">` prop values, not as literal `<h1>...</h1>` JSX in these files anymore).

Run:
```bash
grep -n "AppHeader" src/app/users/page.tsx src/app/categories/page.tsx src/app/proposals/page.tsx src/app/review/page.tsx
```
Expected: no output (import removed from all four).

- [ ] **Step 9: Lint check**

Run: `pnpm lint`
Expected: no new errors on any of the 7 files touched in this task (compare against the pre-existing baseline noted in Task 1's Global Constraints — same repo, same known-unrelated errors).

- [ ] **Step 10: Commit**

```bash
git add src/app/page.tsx src/app/dashboard/page.tsx src/app/users/page.tsx src/app/categories/page.tsx src/app/proposals/page.tsx src/app/review/page.tsx src/app/publish/page.tsx
git commit -m "feat: roll out PageHeader to full-bleed section pages

Replaces each page's own h1/p header block with the shared PageHeader
component, full-bleed under the top bar, matching the catalog's existing
hero-strip pattern. Drops the dead AppHeader import from the four pages
that still had it."
```

---

### Task 3: Nested rollout (3 files)

**Files:**
- Modify: `src/app/skills/[slug]/page.tsx`
- Modify: `src/app/skills/[slug]/edit/page.tsx`
- Modify: `src/components/review/ReviewRequestDetail.tsx`

**Interfaces:**
- Consumes: `PageHeader` from Task 1, same props.
- Produces: nothing — this is the plan's last task.

- [ ] **Step 1: `src/app/skills/[slug]/page.tsx` — replace the bordered header card**

Find (the entire `{/* Header */}` div, from its opening through the closing `</div>` right before the `{/* Left column */}`/grid div — i.e. everything between the "← Catálogo" back-nav strip's closing `</div>` and the `<div style={{ display: "grid", ...}}>` grid):

```tsx
        {/* Header */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "24px",
            marginBottom: "20px",
            borderTop: `3px solid ${meta.color}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                <h1
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "var(--text)",
                    margin: 0,
                  }}
                >
                  {skill.name}
                </h1>
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "12px",
                    color: "var(--muted)",
                    padding: "2px 8px",
                    border: "1px solid var(--border)",
                    borderRadius: "3px",
                  }}
                >
                  v{skill.version}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "9px",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    padding: "2px 7px",
                    borderRadius: "3px",
                    border: `1px solid ${meta.color}`,
                    color: meta.color,
                    background: `${meta.color}18`,
                  }}
                >
                  {meta.icon} {meta.label}
                </span>
                {skill.authorHandle && (
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>{skill.authorHandle}</span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              <StatBox label="instalaciones" value={skill.installCount.toLocaleString()} />
              {skill.publishedAt && !isNaN(skill.publishedAt) && (() => {
                const d = new Date(skill.publishedAt! * 1000);
                return isNaN(d.getTime()) ? null : (
                  <StatBox label="publicado" value={d.toLocaleDateString("es-ES", { month: "short", year: "numeric" })} />
                );
              })()}
            </div>
          </div>

          <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, marginTop: "16px", marginBottom: 0 }}>
            {skill.description}
          </p>
        </div>
```

Replace with:

```tsx
        <PageHeader
          title={skill.name}
          description={skill.description}
          actions={
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "12px",
                  color: "var(--muted)",
                  padding: "2px 8px",
                  border: "1px solid var(--border)",
                  borderRadius: "3px",
                }}
              >
                v{skill.version}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "9px",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                  padding: "2px 7px",
                  borderRadius: "3px",
                  border: `1px solid ${meta.color}`,
                  color: meta.color,
                  background: `${meta.color}18`,
                }}
              >
                {meta.icon} {meta.label}
              </span>
              {skill.authorHandle && (
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>{skill.authorHandle}</span>
              )}
              <StatBox label="instalaciones" value={skill.installCount.toLocaleString()} />
              {skill.publishedAt && !isNaN(skill.publishedAt) && (() => {
                const d = new Date(skill.publishedAt! * 1000);
                return isNaN(d.getTime()) ? null : (
                  <StatBox label="publicado" value={d.toLocaleDateString("es-ES", { month: "short", year: "numeric" })} />
                );
              })()}
            </div>
          }
        />
```

This stays inside the `<div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 24px" }}>` wrapper, in the exact same position (immediately followed by the grid div) — only the header markup itself changes. Add the import: `import { PageHeader } from "@/components/PageHeader";` (alongside the existing `import { FileTree } from "@/components/FileTree";`).

- [ ] **Step 2: `src/app/skills/[slug]/edit/page.tsx` — replace the header, drop `AppHeader`**

Find (the `{/* Header */}` div, between the breadcrumb `<nav>` and `<SkillEditor .../>`):

```tsx
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h1
              style={{
                fontFamily: "var(--font-geist), sans-serif",
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--text)",
                margin: 0,
              }}
            >
              Editar skill
            </h1>
            <div style={{ display: "flex", gap: "12px", marginTop: "6px", alignItems: "center" }}>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "13px",
                  color: "var(--accent)",
                }}
              >
                {skill.name}
              </span>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", color: "var(--faint)" }}>
                v{skill.version}
              </span>
              <span style={{ fontSize: "11px", color: "var(--faint)" }}>
                {skill.installCount} installs
              </span>
            </div>
          </div>
          <Link
            href={`/skills/${skill.slug}`}
            style={{
              fontSize: "12px",
              color: "var(--muted)",
              textDecoration: "none",
              padding: "6px 12px",
              border: "1px solid var(--border)",
              borderRadius: "4px",
            }}
          >
            ↗ Ver en catálogo
          </Link>
        </div>
```

Replace with:

```tsx
        <PageHeader
          title="Editar skill"
          description={
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "13px", color: "var(--accent)" }}>
                {skill.name}
              </span>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", color: "var(--faint)" }}>
                v{skill.version}
              </span>
              <span style={{ fontSize: "11px", color: "var(--faint)" }}>
                {skill.installCount} installs
              </span>
            </div>
          }
          actions={
            <Link
              href={`/skills/${skill.slug}`}
              style={{
                fontSize: "12px",
                color: "var(--muted)",
                textDecoration: "none",
                padding: "6px 12px",
                border: "1px solid var(--border)",
                borderRadius: "4px",
              }}
            >
              ↗ Ver en catálogo
            </Link>
          }
        />
```

This stays inside `<main style={{ maxWidth: "1000px", margin: "0 auto", padding: "28px 24px" }}>`, in the same position (right after the breadcrumb `<nav>`, right before `<SkillEditor .../>`). Remove the `import { AppHeader } from "@/components/AppHeader";` line (this file's only other use of `AppHeader` — confirm by checking the rest of the file does not reference `<AppHeader`). Add `import { PageHeader } from "@/components/PageHeader";`.

- [ ] **Step 3: `src/components/review/ReviewRequestDetail.tsx` — replace the header row**

Find this exact substring (it is on one long line in the current file — match it precisely):

```tsx
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}><div><Link href={viewerMode === "author" ? "/proposals" : "/review"} style={{ fontSize: "12px", color: "var(--muted)", textDecoration: "none" }}>Volver a solicitudes</Link><h1 style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: "22px", margin: "8px 0 4px", color: "var(--text)" }}>{request.name}</h1><p style={{ margin: 0, fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", color: "var(--muted)" }}>{request.slug} · v{request.version}</p></div><span style={{ fontSize: "12px", color: "var(--amber)", border: "1px solid var(--amber)", borderRadius: "3px", padding: "4px 7px" }}>{request.status.replaceAll("_", " ")}</span></div>
```

Replace it with:

```tsx
<div style={{ marginBottom: "12px" }}><Link href={viewerMode === "author" ? "/proposals" : "/review"} style={{ fontSize: "12px", color: "var(--muted)", textDecoration: "none" }}>Volver a solicitudes</Link></div>
<PageHeader
  title={request.name}
  description={`${request.slug} · v${request.version}`}
  actions={<span style={{ fontSize: "12px", color: "var(--amber)", border: "1px solid var(--amber)", borderRadius: "3px", padding: "4px 7px" }}>{request.status.replaceAll("_", " ")}</span>}
/>
```

Add the import at the top of the file, alongside the existing imports: `import { PageHeader } from "@/components/PageHeader";`. Nothing else in this component (the `generalComment` aside, the decision/resubmit action panels, the tabs, the content sections, `ReviewTimeline`) changes. Because `review/[id]/page.tsx` and `proposals/[id]/page.tsx` both render `<ReviewRequestDetail>`, this one file change updates both routes — do not edit those two page files.

- [ ] **Step 4: Verify old header markup is gone**

Run:
```bash
grep -n "borderTop: \`3px solid" src/app/skills/\[slug\]/page.tsx
```
Expected: no output (the category-color card border is gone from the header; if `meta.color` is still used elsewhere in the file for the category badge inside `actions`, that's expected and fine — this check is only for the old card's `borderTop`).

Run:
```bash
grep -n "AppHeader" src/app/skills/\[slug\]/edit/page.tsx
```
Expected: no output.

Run:
```bash
grep -n "PageHeader" src/app/skills/\[slug\]/page.tsx src/app/skills/\[slug\]/edit/page.tsx src/components/review/ReviewRequestDetail.tsx
```
Expected: 2 matches per file (the import line and the usage) for all three files.

- [ ] **Step 5: Lint check**

Run: `pnpm lint`
Expected: no new errors on the 3 files touched in this task.

- [ ] **Step 6: Commit**

```bash
git add "src/app/skills/[slug]/page.tsx" "src/app/skills/[slug]/edit/page.tsx" src/components/review/ReviewRequestDetail.tsx
git commit -m "feat: roll out PageHeader to skill and request detail pages

Replaces the bordered skill-detail header card and the plain edit-page
and request-detail headers with the shared PageHeader component, nested
inside their existing content columns. Preserves every existing badge,
stat, and metadata value by moving it into PageHeader's actions or
description slot. review/[id] and proposals/[id] both pick this up
automatically via the shared ReviewRequestDetail component."
```

---

## Final Verification (manual, after both Task 2 and Task 3 are committed)

No automated test harness applies to this change. Run `pnpm dev`, sign in with an account that has `admin`/`reviewer`/`author` roles as needed, and visit every page below, confirming a light-background title band appears in the right position with no missing information compared to before:

1. `/` — full-bleed header, title changes to `Resultados para "..."` when searching.
2. `/dashboard` — full-bleed header with the "+ Publicar nuevo skill" button in `actions`.
3. `/users` — full-bleed header, no actions.
4. `/categories` — full-bleed header, no actions.
5. `/proposals` — full-bleed header, no actions.
6. `/review` — full-bleed header (via `PageShell`), no actions.
7. `/publish` (step 0, before picking a loading option) — full-bleed header above the breadcrumb bar.
8. `/skills/<any published slug>` — nested header inside the content column; confirm version badge, category badge, author handle (if any), and both stat boxes still render, now inside the header's `actions` area to the right of the title/description.
9. `/skills/<slug>/edit` — nested header; confirm skill name/version/install-count row still renders under the title, and the "↗ Ver en catálogo" link still renders on the right.
10. `/review/<id of an existing review request>` and `/proposals/<id of one of your own requests>` — nested header; confirm the status badge still renders on the right and the "Volver a solicitudes" link still renders above the header, linking to the correct page for each viewer mode.
11. Confirm `/unauthorized`, `/not-found` (visit any nonexistent skill slug), and `/publish/success` (complete or fake a publish) are visually unchanged — still fully centered, no `PageHeader` present.

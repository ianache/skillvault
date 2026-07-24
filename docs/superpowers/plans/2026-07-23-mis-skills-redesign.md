# Mis Skills Page & Top Bar Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the Top Bar navigation with Home icon `🏠` and updated breadcrumbs, and redesign the "Mis Skills" dashboard page (`/dashboard`) with updated page header, metric cards, and skills table controls based on `Mis Skills.dc.html`.

**Tech Stack:** Next.js (App Router), React, TypeScript, Vanilla CSS, Vitest.

---

### Task 1: Update Top Bar Home Icon & Breadcrumbs (`src/components/shell/`)

**Files:**
- Modify: `src/components/shell/Breadcrumbs.tsx`
- Modify: `src/components/shell/AppTopBar.tsx`
- Test: `src/lib/review/ui-smoke.test.ts`

- [ ] **Step 1: Update `src/components/shell/Breadcrumbs.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Mis Skills",
  proposals: "Mis propuestas",
  review: "Revisión",
  categories: "Categorías",
  users: "Usuarios y roles",
  publish: "Publicar skill",
  skills: "Skills",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}>
      <Link href="/" title="Inicio" style={{ color: "var(--muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
        <span>🏠</span>
        <span>Inicio</span>
      </Link>
      {segments.map((seg, idx) => {
        const isLast = idx === segments.length - 1;
        const label = ROUTE_LABELS[seg] ?? seg;
        const path = "/" + segments.slice(0, idx + 1).join("/");

        return (
          <span key={path} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "var(--faint)" }}>/</span>
            {isLast ? (
              <span style={{ fontWeight: 600, color: "var(--text)" }}>{label}</span>
            ) : (
              <Link href={path} style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500 }}>
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Update `src/components/shell/AppTopBar.tsx`**

Add prominent `☰` hamburger button and `🏠` Home icon link in `AppTopBar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { SearchBar } from "../SearchBar";
import { ThemeToggle } from "../ThemeToggle";
import { UserMenu } from "../UserMenu";
import { Breadcrumbs } from "./Breadcrumbs";

type Props = {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  onOpenMobileDrawer: () => void;
};

export function AppTopBar({ user, onOpenMobileDrawer }: Props) {
  return (
    <header
      style={{
        height: "56px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: "14px",
        position: "sticky",
        top: 0,
        background: "var(--bg)",
        zIndex: 20,
      }}
    >
      <button
        type="button"
        onClick={onOpenMobileDrawer}
        style={{
          background: "transparent",
          border: "none",
          fontSize: "18px",
          color: "var(--text)",
          cursor: "pointer",
          padding: "4px 8px",
          borderRadius: "4px",
        }}
        className="mobile-menu-btn"
        title="Menú / Opciones"
      >
        ☰
      </button>

      <Link
        href="/"
        title="Inicio"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          textDecoration: "none",
          padding: "4px 6px",
          borderRadius: "4px",
          color: "var(--text)",
        }}
      >
        🏠
      </Link>

      <Breadcrumbs />

      <div style={{ flex: 1, maxWidth: "420px", marginLeft: "auto" }}>
        <SearchBar />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit changes**

```bash
git add src/components/shell/Breadcrumbs.tsx src/components/shell/AppTopBar.tsx
git commit -m "feat(ui): add Home icon and update breadcrumbs labels in AppTopBar"
```

---

### Task 2: Refactor "Mis Skills" Page Layout & Dashboard Table

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/components/dashboard/DashboardClient.tsx`
- Test: `src/lib/review/ui-smoke.test.ts`

- [ ] **Step 1: Update `src/app/dashboard/page.tsx`**

Refactor page title to "Mis Skills", subtext, action button, and metric cards:

```tsx
export const metadata = { title: "Mis Skills" };

export default async function DashboardPage() {
  const [stats, skills] = await Promise.all([getStats(), getSkills()]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
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

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          <StatCard label="Skills publicados" value={stats.totalSkills} accent="var(--accent)" />
          <StatCard label="Total installs" value={stats.totalInstalls.toLocaleString()} accent="var(--green)" />
          <StatCard label="Categorías activas" value={stats.byType.length} accent="var(--amber)" />
          <StatCard
            label="Categoría top"
            value={stats.byType[0]?.type ?? "—"}
            accent="var(--text)"
            mono
          />
        </div>

        {/* Skills table */}
        <DashboardClient initialSkills={skills} />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Run verification suite**

Run: `npx tsc --noEmit && pnpm test`
Expected: PASS

- [ ] **Step 3: Commit changes**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat(ui): redesign Mis Skills page title, action button, and stats layout"
```

---

### Task 3: UI Smoke Tests & End-to-End Verification

**Files:**
- Modify: `src/lib/review/ui-smoke.test.ts`

- [ ] **Step 1: Update `src/lib/review/ui-smoke.test.ts`**

Add test verifying Home icon and breadcrumbs label `Mis Skills`.

- [ ] **Step 2: Run full verification suite**

Run: `npx tsc --noEmit && pnpm test`
Expected: PASS (47+ tests passing)

- [ ] **Step 3: Commit changes**

```bash
git add src/lib/review/ui-smoke.test.ts
git commit -m "test(ui): add smoke tests for Home icon and Mis Skills breadcrumbs"
```

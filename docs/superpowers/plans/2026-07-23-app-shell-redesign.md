# App Shell Layout Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a modern App Shell navigation framework featuring a collapsible left sidebar (`AppSidebar.tsx`), a sticky top header with dynamic breadcrumbs (`AppTopBar.tsx`), and a responsive main layout wrapper (`AppShell.tsx`).

**Architecture:** Create modular shell components in `src/components/shell/` and integrate `AppShell` into `src/app/layout.tsx`, replacing the legacy top header with an integrated sidebar layout.

**Tech Stack:** Next.js (App Router), TypeScript, React, Vanilla CSS / inline styles, Vitest.

## Global Constraints

- Support desktop sidebar collapse/expand (`240px` / `64px`) persisted in `localStorage`.
- Support mobile drawer navigation (`< 768px`) with hamburger toggle and backdrop overlay.
- All code changes must pass TypeScript type checking (`npx tsc --noEmit`) and tests (`pnpm test`).

---

### Task 1: Build `AppSidebar`, `AppTopBar`, `Breadcrumbs`, and `AppShell` Components (`src/components/shell/`)

**Files:**
- Create: `src/components/shell/Breadcrumbs.tsx`
- Create: `src/components/shell/AppSidebar.tsx`
- Create: `src/components/shell/AppTopBar.tsx`
- Create: `src/components/shell/AppShell.tsx`
- Test: `src/lib/review/ui-smoke.test.ts`

**Interfaces:**
- Consumes: Next.js router (`usePathname()`), NextAuth session (`useSession()` or auth props).
- Produces: `AppShell` layout container.

- [ ] **Step 1: Create `src/components/shell/Breadcrumbs.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
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

  if (segments.length === 0) {
    return (
      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
        Catálogo
      </span>
    );
  }

  let accum = "";
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}>
      <Link href="/" style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500 }}>
        Inicio
      </Link>
      {segments.map((seg, idx) => {
        accum += `/${seg}`;
        const isLast = idx === segments.length - 1;
        const label = ROUTE_LABELS[seg] ?? seg;

        return (
          <span key={accum} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "var(--faint)" }}>/</span>
            {isLast ? (
              <span style={{ fontWeight: 600, color: "var(--text)" }}>{label}</span>
            ) : (
              <Link href={accum} style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500 }}>
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

- [ ] **Step 2: Create `src/components/shell/AppSidebar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  userRoles?: string[];
};

export function AppSidebar({ collapsed, onToggleCollapse, userRoles = [] }: Props) {
  const pathname = usePathname();
  const isAdmin = userRoles.includes("admin");
  const isReviewer = userRoles.includes("reviewer") || isAdmin;

  const navGroups = [
    {
      title: "Exploración",
      items: [
        { label: "Catálogo", href: "/", icon: "🔍" },
        { label: "Publicar skill", href: "/publish", icon: "➕" },
      ],
    },
    {
      title: "Mi Contenido",
      items: [
        { label: "Mis Skills", href: "/dashboard", icon: "📦" },
        { label: "Mis propuestas", href: "/dashboard/proposals", icon: "📝" },
      ],
    },
    ...(isReviewer
      ? [
          {
            title: "Revisión",
            items: [
              { label: "Cola de revisión", href: "/dashboard/review", icon: "🛡️" },
              { label: "Categorías", href: "/dashboard/categories", icon: "🏷️" },
            ],
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            title: "Administración",
            items: [{ label: "Usuarios y roles", href: "/dashboard/users", icon: "👥" }],
          },
        ]
      : []),
  ];

  return (
    <aside
      style={{
        width: collapsed ? "64px" : "240px",
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        zIndex: 30,
        userSelect: "none",
      }}
    >
      {/* Brand Header */}
      <div style={{ height: "56px", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <span style={{ width: "28px", height: "28px", background: "var(--accent)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "12px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
            SV
          </span>
          {!collapsed && <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--text)", letterSpacing: "-0.3px" }}>SkillVault</span>}
        </Link>
        <button
          type="button"
          onClick={onToggleCollapse}
          style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px", borderRadius: "4px" }}
          title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {collapsed ? "❯" : "❮"}
        </button>
      </div>

      {/* Navigation Groups */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 8px" }}>
        {navGroups.map((group) => (
          <div key={group.title} style={{ marginBottom: "20px" }}>
            {!collapsed && (
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "0 12px 6px" }}>
                {group.title}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: collapsed ? "10px 0" : "8px 12px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "var(--accent)" : "var(--text)",
                    background: isActive ? "var(--accent-muted)" : "transparent",
                    transition: "all 0.15s ease",
                    marginBottom: "2px",
                  }}
                >
                  <span style={{ fontSize: "15px" }}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Version */}
      {!collapsed && (
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", fontSize: "11px", color: "var(--faint)", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
          SkillVault v0.3.0
        </div>
      )}
    </aside>
  );
}
```

- [ ] **Step 3: Create `src/components/shell/AppTopBar.tsx`**

```tsx
"use client";

import { SearchBar } from "../SearchBar";
import { ThemeToggle } from "../ThemeToggle";
import { UserMenu } from "../UserMenu";
import { Breadcrumbs } from "./Breadcrumbs";

type Props = {
  onOpenMobileDrawer: () => void;
};

export function AppTopBar({ onOpenMobileDrawer }: Props) {
  return (
    <header
      style={{
        height: "56px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: "16px",
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
          display: "none",
          background: "transparent",
          border: "none",
          fontSize: "18px",
          color: "var(--text)",
          cursor: "pointer",
          padding: "4px",
        }}
        className="mobile-menu-btn"
      >
        ☰
      </button>

      <Breadcrumbs />

      <div style={{ flex: 1, maxWidth: "420px", marginLeft: "auto" }}>
        <SearchBar />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
```

- [ ] **Step 4: Create `src/components/shell/AppShell.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppTopBar } from "./AppTopBar";

type Props = {
  children: React.ReactNode;
  userRoles?: string[];
};

export function AppShell({ children, userRoles = [] }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("skillvault_sidebar_collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("skillvault_sidebar_collapsed", String(next));
      return next;
    });
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <AppSidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} userRoles={userRoles} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <AppTopBar onOpenMobileDrawer={() => setMobileOpen(true)} />
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit changes**

```bash
git add src/components/shell/
git commit -m "feat(ui): add AppShell, AppSidebar, AppTopBar, and Breadcrumbs components"
```

---

### Task 2: Integrate `AppShell` in `src/app/layout.tsx` & Refactor Header Layout

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/AppHeader.tsx`
- Test: `src/lib/review/ui-smoke.test.ts`

- [ ] **Step 1: Update `src/app/layout.tsx`**

Wrap `{children}` in `src/app/layout.tsx` with `<AppShell>`:

```tsx
import { AppShell } from "@/components/shell/AppShell";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        style={{ fontFamily: `var(--font-ibm-plex-sans), system-ui, sans-serif` }}
        className={`${geist.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable} min-h-screen`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Update `AppHeader.tsx` for legacy page compatibility**

In pages that explicitly render `<AppHeader />`, update `AppHeader` to act as a lightweight breadcrumb bar or pass through clean styling.

- [ ] **Step 3: Run full test suite**

Run: `npx tsc --noEmit && pnpm test`
Expected: PASS

- [ ] **Step 4: Commit changes**

```bash
git add src/app/layout.tsx src/components/AppHeader.tsx
git commit -m "feat(ui): integrate AppShell into RootLayout"
```

---

### Task 3: UI Smoke Tests & End-to-End Verification

**Files:**
- Modify: `src/lib/review/ui-smoke.test.ts`

- [ ] **Step 1: Update `src/lib/review/ui-smoke.test.ts` with App Shell assertions**

Add assertions verifying `AppShell`, `AppSidebar`, `AppTopBar`, and `Breadcrumbs` exports and rendering.

- [ ] **Step 2: Run verification suite**

Run: `npx tsc --noEmit && pnpm test`
Expected: PASS (46+ tests passing)

- [ ] **Step 3: Commit changes**

```bash
git add src/lib/review/ui-smoke.test.ts
git commit -m "test(ui): add smoke tests for AppShell navigation framework"
```

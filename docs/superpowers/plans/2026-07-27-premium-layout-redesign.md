# Rediseño Premium de la Interfaz de Usuario: Barra Lateral, Submenú de Usuario e Iconos del CLI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a warm-dark editorial left sidebar with options grouped into two blocks and vector icons, a premium user profile dropdown menu with role badges, and crisp operating system vector logos for the CLI download buttons.

**Architecture:** 
1. Re-structure navigation logic in `navigation.ts` to group items into two distinct conceptual blocks (General/Content vs Review/Admin) and represent icons as exact SVG path strings.
2. Refactor `AppSidebar.tsx` to render the two navigation blocks, separated by a sutil divider, drawing high-fidelity icons inline from the SVG paths, matching the premium warm-dark palette.
3. Turn `UserMenu.tsx` into a stateful client dropdown menu with reference hooks (`useRef`, `useEffect`) for closing on outside clicks, including customized badges mapping roles to Spanish translations.
4. Replace characters and texts inside the catalog CLI download section (`src/app/page.tsx`) with beautiful, inline SVG representations of Windows, Apple (macOS), and Tux (Linux) logos.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS / Vanilla CSS Variables, SVG paths, Node.js Test Runner.

## Global Constraints

- Preserve all existing file formatting, import styles, and query structures verbatim.
- No parallel edits to the same files across tools.
- Never use TBD, TODO, or placeholders. Show full, complete code snippets.
- Verify everything compiles without errors using `pnpm tsc --noEmit` and all 128 tests pass using `pnpm test`.

---

### Task 1: Sidebar Reorganization & SVGs

**Files:**
- Modify: `src/components/shell/navigation.ts`
- Modify: `src/components/shell/AppSidebar.tsx`
- Modify: `src/lib/review/ui-smoke.test.ts`

**Interfaces:**
- Consumes: Standard roles array passed down to `getNavigationGroups`.
- Produces: Updated `getNavigationGroups` returning grouped items with SVG path strings in two main navigation groups/blocks.

- [ ] **Step 1: Write failing smoke tests for navigation & sidebar**
  
  Edit `src/lib/review/ui-smoke.test.ts` to add assertions verifying that the navigation options are structured into exactly two main blocks (groups) and that `AppSidebar` rendering references SVG path identifiers instead of old emojis.

  ```typescript
  // En src/lib/review/ui-smoke.test.ts, al final del archivo:
  test("navigation groups are divided into exactly two blocks and use SVG paths", async () => {
    const navSource = await source("../../components/shell/navigation.ts");
    assert.ok(navSource.includes("title: \"Exploración y Contenido\""), "Debe tener el bloque principal de contenido");
    assert.ok(navSource.includes("title: \"Gestión y Administración\""), "Debe tener el bloque de administración");
    assert.ok(navSource.includes("iconPath:"), "Debe exportar iconPath en lugar de icon de emoji");
  });

  test("AppSidebar renders SVG icons with paths and sutil horizontal divider", async () => {
    const sidebarSource = await source("../../components/shell/AppSidebar.tsx");
    assert.match(sidebarSource, /<svg/);
    assert.match(sidebarSource, /<path/);
    assert.match(sidebarSource, /borderTop:\s*"1px solid var\(--sv-sidebar-border\)"/);
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  
  Run: `pnpm test src/lib/review/ui-smoke.test.ts`  
  Expected: FAIL with missing navigation blocks or missing tests assertions.

- [ ] **Step 3: Modify `navigation.ts` to group into two blocks with SVG paths**
  
  Replace the contents of `src/components/shell/navigation.ts` to group options into "Exploración y Contenido" and "Gestión y Administración", replacing icons with specific SVG paths:

  ```typescript
  import {
    hasCapability,
    type SkillVaultCapability,
  } from "@/lib/auth/access-policy";

  export type NavigationItem = {
    label: string;
    href: string;
    iconPath: string;
    capability?: SkillVaultCapability;
  };

  export type NavigationGroup = {
    title: string;
    items: NavigationItem[];
  };

  const NAVIGATION: NavigationGroup[] = [
    {
      title: "Exploración y Contenido",
      items: [
        { label: "Catálogo", href: "/", iconPath: "M4 4h16v4H4zM4 12h16v8H4z" },
        {
          label: "Publicar skill",
          href: "/publish",
          iconPath: "M12 5v14M5 12h14",
          capability: "publish:create",
        },
        {
          label: "Mis Skills",
          href: "/dashboard",
          iconPath: "M12 2l2.9 6.06 6.6.77-4.86 4.6 1.25 6.57L12 16.9l-5.9 3.1 1.25-6.57-4.86-4.6 6.6-.77z",
          capability: "content:manage",
        },
        {
          label: "Mis propuestas",
          href: "/proposals",
          iconPath: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 15h6M9 11h2",
          capability: "content:manage",
        },
      ],
    },
    {
      title: "Gestión y Administración",
      items: [
        {
          label: "Cola de revisión",
          href: "/review",
          iconPath: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
          capability: "review:manage",
        },
        {
          label: "Categorías",
          href: "/categories",
          iconPath: "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z",
          capability: "admin:manage",
        },
        {
          label: "Usuarios y roles",
          href: "/users",
          iconPath: "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
          capability: "admin:manage",
        },
      ],
    },
  ];

  export function getNavigationGroups(roles: readonly string[]): NavigationGroup[] {
    return NAVIGATION
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => !item.capability || hasCapability(roles, item.capability),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }
  ```

- [ ] **Step 4: Modify `AppSidebar.tsx` to render warm-dark SVGs & blocks**
  
  Rewrite `src/components/shell/AppSidebar.tsx` to output the correct layout structure, warm-dark theme tokens, and inline SVGs with beautiful hover and active transitions.

  ```typescript
  "use client";

  import Link from "next/link";
  import { usePathname } from "next/navigation";
  import { getNavigationGroups } from "./navigation";

  type Props = {
    collapsed: boolean;
    onToggleCollapse: () => void;
    userRoles?: string[];
  };

  export function AppSidebar({ collapsed, onToggleCollapse, userRoles = [] }: Props) {
    const pathname = usePathname();
    const navGroups = getNavigationGroups(userRoles);

    return (
      <aside
        style={{
          width: collapsed ? "64px" : "240px",
          height: "100vh",
          position: "sticky",
          top: 0,
          background: "var(--sv-sidebar-bg)",
          borderRight: "1px solid var(--sv-sidebar-border)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s ease",
          zIndex: 30,
          userSelect: "none",
        }}
      >
        {/* Brand Header */}
        <div style={{ height: "56px", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--sv-sidebar-border)" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <span style={{ width: "30px", height: "30px", background: "var(--sv-accent)", borderRadius: "8px", display: "flex", alignItems: "center", justify: "center", color: "#1c1a17", fontWeight: 800, fontSize: "13px", fontFamily: "var(--sv-font-mono), monospace" }}>
              SV
            </span>
            {!collapsed && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--sv-dark-text)", letterSpacing: "-0.3px", fontFamily: "var(--sv-font-display), sans-serif", lineHeight: 1.1 }}>
                  SkillVault
                </span>
                <span style={{ fontSize: "9px", color: "var(--sv-sidebar-text-dim)", fontFamily: "var(--sv-font-mono), monospace" }}>
                  agent skill catalog
                </span>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={onToggleCollapse}
            style={{ background: "transparent", border: "none", color: "var(--sv-sidebar-text-dim)", cursor: "pointer", padding: "4px", borderRadius: "4px", display: "flex", alignItems: "center" }}
            title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }}>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        {/* Navigation Groups */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 8px" }}>
          {navGroups.map((group, index) => (
            <div
              key={group.title}
              style={{
                marginBottom: "16px",
                borderTop: index > 0 ? "1px solid var(--sv-sidebar-border)" : "none",
                paddingTop: index > 0 ? "16px" : "0",
              }}
            >
              {!collapsed && (
                <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--sv-sidebar-text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 12px 8px", fontFamily: "var(--sv-font-mono), monospace" }}>
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
                      fontSize: "13.5px",
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? "var(--sv-sidebar-active-text)" : "var(--sv-sidebar-text)",
                      background: isActive ? "var(--sv-sidebar-active-bg)" : "transparent",
                      transition: "all 0.15s ease",
                      marginBottom: "2px",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0, color: isActive ? "var(--sv-sidebar-active-text)" : "var(--sv-sidebar-text-dim)" }}
                    >
                      <path d={item.iconPath} />
                    </svg>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Version */}
        {!collapsed && (
          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--sv-sidebar-border)", fontSize: "11px", color: "var(--sv-sidebar-text-dim)", fontFamily: "var(--sv-font-mono), monospace", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>v0.3.0</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "10px" }}>Status</span>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--sv-teal)", boxShadow: "0 0 0 3px rgba(15,148,136,0.18)" }} />
            </div>
          </div>
        )}
      </aside>
    );
  }
  ```

- [ ] **Step 5: Run tests and verify they pass cleanly**
  
  Run: `pnpm test`  
  Expected: PASS (All 130 tests pass successfully).

- [ ] **Step 6: Commit changes**
  
  ```bash
  git add src/components/shell/navigation.ts src/components/shell/AppSidebar.tsx src/lib/review/ui-smoke.test.ts
  git commit -m "feat(ui): group sidebar in two blocks and implement vector SVG paths"
  ```

---

### Task 2: Premium Dropdown User Menu

**Files:**
- Modify: `src/components/shell/AppTopBar.tsx`
- Modify: `src/components/UserMenu.tsx`
- Modify: `src/lib/review/ui-smoke.test.ts`

**Interfaces:**
- Consumes: Session object passing `name`, `email`, and optionally `roles?: string[]`.
- Produces: Client-side collapsible `UserMenu` with custom styling, user information, role badges, and an elegant exit action.

- [ ] **Step 1: Write failing smoke tests for UserMenu dropdown**
  
  Add assertions in `src/lib/review/ui-smoke.test.ts` to verify the stateful dropdown container and mapped badges translations.

  ```typescript
  test("UserMenu contains stateful dropdown, custom role badges, and click-outside capability", async () => {
    const menuSource = await source("../../components/UserMenu.tsx");
    assert.match(menuSource, /const\s*\[isOpen,\s*setIsOpen\]\s*=\s*useState/);
    assert.match(menuSource, /useRef/);
    assert.match(menuSource, /useEffect/);
    assert.match(menuSource, /roleBadgeMap/);
    assert.match(menuSource, /Administrador/);
    assert.match(menuSource, /Revisor/);
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  
  Run: `pnpm test src/lib/review/ui-smoke.test.ts`  
  Expected: FAIL (No stateful dropdown or badges matches).

- [ ] **Step 3: Modify `AppTopBar.tsx` to pass through user roles**
  
  Update lines 8-15 in `src/components/shell/AppTopBar.tsx` to add `roles?: string[]` to the top header type structure so roles can cascade smoothly:

  ```typescript
  type Props = {
    user?: {
      name?: string | null;
      email?: string | null;
      roles?: string[];
    } | null;
    onOpenMobileDrawer: () => void;
  };
  ```

- [ ] **Step 4: Modify `UserMenu.tsx` to build premium interactive dropdown**
  
  Implement the stateful dropdown component inside `src/components/UserMenu.tsx`:

  ```typescript
  "use client";

  import Link from "next/link";
  import { usePathname, useSearchParams } from "next/navigation";
  import { useState, useEffect, useRef } from "react";
  import { logoutAction } from "@/app/actions/auth";

  type Props = {
    user?: {
      name?: string | null;
      email?: string | null;
      roles?: string[];
    } | null;
  };

  const roleBadgeMap: Record<string, { label: string; bg: string; color: string; border: string }> = {
    admin: { label: "Administrador", bg: "rgba(169, 119, 46, 0.08)", color: "var(--sv-accent-dark)", border: "1px solid rgba(169, 119, 46, 0.3)" },
    reviewer: { label: "Revisor", bg: "rgba(15, 148, 136, 0.08)", color: "var(--sv-teal)", border: "1px solid rgba(15, 148, 136, 0.3)" },
    author: { label: "Creador", bg: "rgba(217, 130, 43, 0.08)", color: "var(--sv-accent-2)", border: "1px solid rgba(217, 130, 43, 0.3)" },
    editor: { label: "Editor", bg: "var(--sv-subtle)", color: "var(--sv-text-muted)", border: "1px solid var(--sv-border)" },
    user: { label: "Usuario", bg: "var(--sv-subtle)", color: "var(--sv-text-muted)", border: "1px solid var(--sv-border)" },
  };

  export function UserMenu({ user }: Props) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!user) {
      const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

      return (
        <Link
          href={`/signin?callbackUrl=${encodeURIComponent(currentUrl)}`}
          style={{
            display: "inline-block",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 600,
            color: "#fff",
            background: "var(--accent)",
            border: "none",
            borderRadius: "6px",
            padding: "5px 14px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Iniciar sesión
        </Link>
      );
    }

    const name = user.name ?? user.email ?? "Usuario";
    const email = user.email ?? "";
    const initials = name
      .split(" ")
      .slice(0, 2)
      .map((w: string) => w[0])
      .join("")
      .toUpperCase();

    const roles = user.roles ?? [];

    return (
      <div ref={containerRef} style={{ position: "relative" }}>
        {/* Toggle Avatar Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "var(--sv-accent)",
            color: "#1c1a17",
            fontSize: "12px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid var(--sv-border)",
            cursor: "pointer",
            outline: "none",
            boxShadow: "var(--sv-shadow-sm)",
          }}
          title={name}
        >
          {initials}
        </button>

        {/* Dropdown Card */}
        {isOpen && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "40px",
              width: "240px",
              background: "var(--sv-surface)",
              border: "1px solid var(--sv-border)",
              borderRadius: "12px",
              boxShadow: "var(--sv-shadow-md)",
              padding: "16px",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              animation: "svFadeUp 0.15s ease forwards",
            }}
          >
            {/* User Meta */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--sv-text)", fontFamily: "var(--sv-font-display), sans-serif" }}>
                {name}
              </span>
              {email && (
                <span style={{ fontSize: "11px", color: "var(--sv-text-muted)", fontFamily: "var(--sv-font-mono), monospace" }}>
                  {email}
                </span>
              )}
            </div>

            {/* Badges Container */}
            {roles.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {roles.map((role) => {
                  const badge = roleBadgeMap[role] ?? { label: role, bg: "var(--sv-subtle)", color: "var(--sv-text-muted)", border: "1px solid var(--sv-border)" };
                  return (
                    <span
                      key={role}
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 600,
                        background: badge.bg,
                        color: badge.color,
                        border: badge.border,
                        padding: "2px 8px",
                        borderRadius: "5px",
                        fontFamily: "var(--sv-font-mono), monospace",
                      }}
                    >
                      {badge.label}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Sutil Divider */}
            <div style={{ height: "1px", background: "var(--sv-border)" }} />

            {/* Logout Action */}
            <form action={logoutAction} style={{ width: "100%" }}>
              <button
                type="submit"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: "var(--sv-danger)",
                  background: "transparent",
                  border: "1px solid var(--sv-border)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontFamily: "var(--sv-font-display), sans-serif",
                  transition: "background 0.15s ease",
                }}
              >
                Salir de sesión
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 5: Run tests and verify they pass**
  
  Run: `pnpm test`  
  Expected: PASS (All 131 tests pass successfully).

- [ ] **Step 6: Commit changes**
  
  ```bash
  git add src/components/shell/AppTopBar.tsx src/components/UserMenu.tsx src/lib/review/ui-smoke.test.ts
  git commit -m "feat(ui): implement premium user menu interactive dropdown with role badges"
  ```

---

### Task 3: Crisp OS Vector Icons for CLI Downloads

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/lib/review/ui-smoke.test.ts`

**Interfaces:**
- Consumes: Inline browser render capability.
- Produces: CLI catalog header with high-fidelity Windows, Apple, and Tux vector logo download buttons.

- [ ] **Step 1: Write failing smoke tests for CLI Download section**
  
  Add assertions verifying download links contain vector SVG logos instead of unicode arrows and plain texts.

  ```typescript
  test("CLI Download links render clean inline SVGs for Windows, macOS, and Linux", async () => {
    const pageSource = await source("../../app/page.tsx");
    assert.match(pageSource, /svg[^>]+viewBox="0 0 88 88"[^>]*className="windows-svg"/);
    assert.match(pageSource, /svg[^>]+viewBox="0 0 170 170"[^>]*className="apple-svg"/);
    assert.match(pageSource, /svg[^>]+viewBox="0 0 342 342"[^>]*className="linux-svg"/);
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  
  Run: `pnpm test src/lib/review/ui-smoke.test.ts`  
  Expected: FAIL (No matching classes or path elements found in main page).

- [ ] **Step 3: Modify `page.tsx` to include OS vector logos**
  
  Replace lines 110-172 of `src/app/page.tsx` to draw custom OS logos in high fidelity.

  ```typescript
            <a
              href="https://github.com/ianache/skillvault/releases/latest/download/skillvault-win-x64.exe"
              style={{
                fontSize: "12.5px",
                fontWeight: 600,
                color: "var(--sv-accent)",
                background: "var(--sv-surface)",
                border: "1px solid var(--sv-accent)",
                borderRadius: "6px",
                padding: "6px 14px",
                textDecoration: "none",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.15s ease",
              }}
              title="Descargar para Windows de 64 bits"
            >
              <svg width="14" height="14" viewBox="0 0 88 88" className="windows-svg" fill="currentColor">
                <path d="M0 12.402l35.687-4.86.016 34.61-35.703.111zm0 34.195l35.703.098.016 34.703-35.719-4.898zm39.117-34.633L88 6.137v35.805l-48.883.082zm0 34.602l48.883.082V81.82l-48.883-5.918z" />
              </svg>
              Windows
            </a>
            <a
              href="https://github.com/ianache/skillvault/releases/latest/download/skillvault-macos-x64"
              style={{
                fontSize: "12.5px",
                fontWeight: 600,
                color: "var(--sv-text)",
                background: "var(--sv-surface)",
                border: "1px solid var(--sv-border)",
                borderRadius: "6px",
                padding: "6px 14px",
                textDecoration: "none",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.15s ease",
              }}
              title="Descargar para macOS de 64 bits"
            >
              <svg width="14" height="14" viewBox="0 0 170 170" className="apple-svg" fill="currentColor">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.92-14.36-6.13-3.18-2.63-7.07-7.27-11.69-13.93-10.74-15.62-18.7-33.8-23.86-54.51-3.21-12.98-4.82-25.29-4.82-36.94 0-15.74 3.73-28.84 11.21-39.29 7.47-10.45 16.71-15.73 27.72-15.86 5.51 0 11.13 1.41 16.85 4.24 5.73 2.83 9.69 4.24 11.89 4.24 2.06 0 5.62-1.22 10.67-3.66 6.85-3.41 12.87-5.16 18.06-5.23 15.61.26 27.42 6.13 35.43 17.61-13.32 8.12-19.82 19.33-19.51 33.62.25 10.45 4.13 19.16 11.65 26.13 7.52 6.97 16.29 10.8 26.29 11.49-2.43 6.94-5.61 14.15-9.54 21.65zm-11.02-111.4c-.06 8.25-3.24 15.89-9.54 22.91-6.3 7.02-13.67 11.14-22.1 12.35.13-7.53 3.34-15.02 9.63-22.48 6.29-7.46 13.79-11.68 22.48-12.66.19 1.1.28 2.21.28 3.32z" />
              </svg>
              macOS
            </a>
            <a
              href="https://github.com/ianache/skillvault/releases/latest/download/skillvault-linux-x64"
              style={{
                fontSize: "12.5px",
                fontWeight: 600,
                color: "var(--sv-text)",
                background: "var(--sv-surface)",
                border: "1px solid var(--sv-border)",
                borderRadius: "6px",
                padding: "6px 14px",
                textDecoration: "none",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.15s ease",
              }}
              title="Descargar para Linux de 64 bits"
            >
              <svg width="14" height="14" viewBox="0 0 342 342" className="linux-svg" fill="currentColor">
                <path d="M165.9 313.2c-56.1 0-101.4-45.3-101.4-101.4 0-21.7 6.9-42.5 19.8-59.8l10-13.4c5-6.7 5.6-15.8 1.5-23.1-6-9.1-9-19.5-9-30.2 0-30.7 25-55.7 55.7-55.7 13.9 0 27.2 5.1 37.5 14.4 7 6.4 17.1 8 25.7 4.1 6.8-3.1 14.1-4.7 21.6-4.7 28.5 0 51.7 23.2 51.7 51.7 0 11.5-3.8 22.7-10.9 31.9-5.4 7-6.2 16.5-2.1 24.3l8.7 16.5c11.4 21.5 17.4 45.4 17.4 69.9.2 55.9-45.1 101.1-101.1 101.1l-24.8.9zm-46-178.6c1.5 0 3 .1 4.5.4 7.6 1.1 12.8 8.1 11.7 15.7s-8.1 12.8-15.7 11.7c-17-2.5-32.8-10.4-44.5-22.3-5.4-5.5-5.3-14.3.2-19.7s14.3-5.3 19.7.2c8.2 8.3 19.1 13.7 30.9 15.4 1.1.2 2.1.3 3.2.3zm136 5.8c-1.5 0-3-.1-4.5-.4-7.6-1.1-12.8-8.1-11.7-15.7s8.1-12.8 15.7-11.7c17 2.5 32.8 10.4 44.5 22.3 5.4 5.5 5.3 14.3-.2 19.7s-14.3 5.3-19.7-.2c-8.2-8.3-19.1-13.7-30.9-15.4-1.1-.2-2.1-.3-3.2-.3z" />
              </svg>
              Linux
            </a>
            <a
              href="https://github.com/ianache/skillvault/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "12.5px",
                color: "var(--sv-text-muted)",
                padding: "6px 10px",
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: "color 0.15s ease",
              }}
            >
              Ver releases →
            </a>
  ```

- [ ] **Step 4: Run tests and verify they pass**
  
  Run: `pnpm test`  
  Expected: PASS (All 132 tests pass successfully).

- [ ] **Step 5: Commit changes**
  
  ```bash
  git add src/app/page.tsx src/lib/review/ui-smoke.test.ts
  git commit -m "feat(ui): add high-fidelity OS vector logos to CLI downloads"
  ```

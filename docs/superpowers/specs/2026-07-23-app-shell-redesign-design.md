# Design Spec: App Shell Layout Redesign

**Date:** 2026-07-23  
**Status:** Approved  
**Branch:** `feature/redisign`  

---

## 1. Overview & Context

SkillVault is transitioning to a modern App Shell navigation framework across all pages. The redesign introduces a persistent, collapsible left sidebar (`AppSidebar.tsx`), a sticky top header with dynamic breadcrumbs and global search (`AppTopBar.tsx`), and a responsive main content wrapper (`AppShell.tsx`).

---

## 2. Architecture & Component Structure

### 2.1 `AppShell.tsx` (`src/components/shell/AppShell.tsx`)

Main shell layout wrapper component that structures the page into a 2-column layout:
- **Left Column**: Collapsible `AppSidebar` (`240px` expanded / `64px` collapsed / hidden drawer on mobile).
- **Right Column**: `AppTopBar` header (`56px`) sticky at top + `<main>` content container.

```tsx
export function AppShell({ children }: { children: React.ReactNode }) {
  // Client state for sidebar collapse and mobile drawer toggle
}
```

---

### 2.2 `AppSidebar.tsx` (`src/components/shell/AppSidebar.tsx`)

Renders a styled left navigation sidebar with section grouping:
- **Brand Header**: `SV` logo icon + `SkillVault` title + collapse toggle button `<`/`>`.
- **Navigation Groups**:
  - **Exploración**: `Catálogo` (`/`), `Publicar skill` (`/publish`).
  - **Mi Contenido**: `Mis Skills` (`/dashboard`), `Mis propuestas` (`/dashboard/proposals`).
  - **Revisión**: `Cola de revisión` (`/dashboard/review`), `Categorías` (`/dashboard/categories`).
  - **Administración**: `Usuarios y roles` (`/dashboard/users`) — conditionally rendered based on user roles.
- **Footer**: Version tag (`v0.3.0`).

---

### 2.3 `AppTopBar.tsx` & `Breadcrumbs.tsx` (`src/components/shell/AppTopBar.tsx`)

Sticky top header bar (`56px` height):
- **Left**: Dynamic `<Breadcrumbs />` component reflecting active route (e.g., `Dashboard` / `Mis propuestas` / `#12`).
- **Mobile Action**: Hamburger menu toggle button for opening sidebar drawer on screens `< 768px`.
- **Center**: `SearchBar` global search input.
- **Right**: `ThemeToggle` + `UserMenu` user identity and sign-out controls.

---

### 2.4 Layout Integration (`src/app/layout.tsx`)

Updates `src/app/layout.tsx` to wrap `{children}` inside `<AppShell>` so every page automatically inherits the new App Shell navigation framework.

---

## 3. Responsiveness & Collapse State

1. **Desktop Collapse State**:
   - Sidebar collapse state (`collapsed: boolean`) is stored in `localStorage` (`skillvault_sidebar_collapsed`).
   - When collapsed, sidebar width reduces from `240px` to `64px`, displaying centered icons with tooltips.
2. **Mobile Drawer (< 768px)**:
   - Sidebar renders as a slide-out overlay drawer controlled by hamburger button in `AppTopBar`.
   - Clicking overlay backdrop or choosing a navigation link automatically closes the mobile drawer.

---

## 4. Verification & Testing Strategy

1. **TypeScript Check**: `npx tsc --noEmit` must pass cleanly with 0 errors.
2. **Smoke Tests (`src/lib/review/ui-smoke.test.ts`)**:
   - Verify `AppShell`, `AppSidebar`, `AppTopBar`, and `Breadcrumbs` components export and render without error.
3. **End-to-End Verification**:
   - Run `pnpm test` ensuring all existing 46 unit and contract tests continue to pass cleanly.

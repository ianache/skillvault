# Design Spec: Mis Skills Page & Top Bar Redesign

**Date:** 2026-07-23  
**Status:** Approved  
**Branch:** `master`  

---

## 1. Overview & Context

This design spec outlines the visual and structural refinements for the "Mis Skills" page (`/dashboard`) and Top Bar controls (`AppTopBar.tsx` and `Breadcrumbs.tsx`), aligning the user interface with the `Mis Skills.dc.html` design specifications.

---

## 2. Navigation & Top Bar Refinements

### 2.1 Top Bar Navigation (`src/components/shell/AppTopBar.tsx`)
- **Hamburger Toggle Button (`☰`)**: Renders prominently at the left of the header bar to toggle sidebar collapse or open the mobile drawer.
- **Home Icon Link (`🏠`)**: Added next to hamburger button, linking directly to `/` with hover transitions.
- **Global Search & User Menu**: Maintains centered `SearchBar`, `ThemeToggle`, and `UserMenu`.

### 2.2 Breadcrumbs Component (`src/components/shell/Breadcrumbs.tsx`)
- Updated breadcrumb trail structure:
  - Root (`/`): `🏠 Inicio / Catálogo`
  - Mis Skills (`/dashboard`): `🏠 Inicio / Mis Skills`
  - Deep routes (e.g. `/dashboard/proposals`): `🏠 Inicio / Mis Skills / Mis propuestas`

---

## 3. "Mis Skills" Page Layout (`src/app/dashboard/page.tsx`)

### 3.1 Page Header & Hero Controls
- **Title**: Renamed from generic "Dashboard" to **"Mis Skills"**.
- **Description**: *"Gestiona, edita y monitorea tus skills creados y reutilizables en SkillVault"*.
- **Primary Action**: Prominent `+ Publicar nuevo skill` button styled with accent theme variables (`var(--accent)`).

### 3.2 Metric Cards
Renders 4 metric summary cards:
1. **Skills publicados**: Total published count with `var(--accent)` top border.
2. **Total installs**: Sum of installations formatted with commas and `var(--green)` top border.
3. **Categorías activas**: Total unique categories represented with `var(--amber)` top border.
4. **Categoría top**: Highest installed category formatted with `var(--font-jetbrains-mono)`.

---

## 4. Skills Table & Interactive Controls (`src/components/dashboard/DashboardClient.tsx`)

### 4.1 Filter Bar
- Buscador local de skills por nombre/slug.
- Selector dinámico de categoría.

### 4.2 Table Structure
- **Columns**:
  - `Skill`: Name, monospace slug, version pill.
  - `Descripción`: Truncated description text.
  - `Tipo`: Color-coded category badge.
  - `Instalaciones`: Total downloads with download icon `⬇`.
  - `Estado`: Status badge (`Aprobado`, `En revisión`, `Borrador`).
  - `Acciones`: Action buttons for *Ver*, *Editar*, and *Descargar*.

---

## 5. Verification & Testing Strategy

1. **TypeScript Check**: `npx tsc --noEmit` must pass with 0 errors.
2. **Smoke & Integration Tests (`src/lib/review/ui-smoke.test.ts`)**:
   - Verify `AppTopBar`, `Breadcrumbs`, and `DashboardClient` render without error.
3. **Full Test Suite**: `pnpm test` must pass all unit and smoke tests.

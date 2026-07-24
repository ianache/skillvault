# Design Spec: Simplified Routes Migration

**Date:** 2026-07-23  
**Status:** Approved  
**Branch:** `master`  

---

## 1. Overview & Context

This design spec outlines the simplification of SkillVault's page route hierarchy, removing the `/dashboard/` prefix from sub-features (`/review`, `/proposals`, `/categories`, `/users`, `/skills/[slug]/edit`).

---

## 2. Directory Restructuring (`src/app/`)

### 2.1 Next.js App Router Structure
The following route directories are moved from `src/app/dashboard/` to top-level routes under `src/app/`:

- `src/app/dashboard/proposals/` ➔ `src/app/proposals/` (`page.tsx`, `[id]/page.tsx`)
- `src/app/dashboard/review/` ➔ `src/app/review/` (`page.tsx`, `[id]/page.tsx`)
- `src/app/dashboard/categories/` ➔ `src/app/categories/` (`page.tsx`)
- `src/app/dashboard/users/` ➔ `src/app/users/` (`page.tsx`)
- `src/app/dashboard/skills/[slug]/edit/` ➔ `src/app/skills/[slug]/edit/` (`page.tsx`)
- `src/app/dashboard/review-api.ts` ➔ `src/app/review-api.ts`

`src/app/dashboard/page.tsx` remains as the dedicated "Mis Skills" page.

---

## 3. Middleware & Security Policy (`src/proxy.ts`)

### 3.1 Protected Paths & Matcher
Update `src/proxy.ts` middleware:
- **`protectedPaths`**: `["/publish", "/dashboard", "/proposals", "/review", "/categories", "/users", "/skills"]`
- **Matcher**: `["/publish/:path*", "/dashboard/:path*", "/proposals/:path*", "/review/:path*", "/categories/:path*", "/users/:path*", "/skills/:path*"]`

### 3.2 Role-Based Access Control
- `/categories/*` ➔ Requires `admin` role.
- `/users/*` ➔ Requires `admin` role.
- `/review/*` ➔ Requires `reviewer` or `admin` role.
- `/proposals/*`, `/dashboard/*`, `/publish/*` ➔ Requires authenticated user session.

---

## 4. UI Components & Link Updates

### 4.1 `AppSidebar.tsx` (`src/components/shell/AppSidebar.tsx`)
- `Catálogo`: `/`
- `Publicar skill`: `/publish`
- `Mis Skills`: `/dashboard`
- `Mis propuestas`: `/proposals`
- `Cola de revisión`: `/review`
- `Categorías`: `/categories`
- `Usuarios y roles`: `/users`

### 4.2 `Breadcrumbs.tsx` (`src/components/shell/Breadcrumbs.tsx`)
- Maps `proposals` ➔ `"Mis propuestas"`
- Maps `review` ➔ `"Revisión"`
- Maps `categories` ➔ `"Categorías"`
- Maps `users` ➔ `"Usuarios y roles"`
- Maps `dashboard` ➔ `"Mis Skills"`
- Maps `skills` ➔ `"Skills"`
- Maps `edit` ➔ `"Editar"`

### 4.3 Other Component Href References
- **`ReviewRequestList.tsx`**: Updates links to `/proposals/[id]` or `/review/[id]`.
- **`ReviewRequestDetail.tsx`**: Updates back links and redirect targets after decision to `/review` or `/proposals`.
- **`DashboardClient.tsx`**: Updates edit skill link to `/skills/[slug]/edit`.
- **`publish/success/page.tsx`**: Updates link to `/proposals/[id]`.

---

## 5. Verification Strategy

1. **TypeScript Check**: `npx tsc --noEmit` must pass with 0 errors.
2. **Smoke & Integration Tests (`src/lib/review/ui-smoke.test.ts`)**:
   - Update tests to verify route components in `@/app/review/page`, `@/app/review/[id]/page`, `@/app/proposals/page`, `@/app/proposals/[id]/page`, `@/app/review-api`.
3. **Full Test Suite**: `pnpm test` must pass all 49+ tests cleanly.

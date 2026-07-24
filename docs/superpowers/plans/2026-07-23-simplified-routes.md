# Simplified Routes Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify page route paths by moving `/dashboard/proposals`, `/dashboard/review`, `/dashboard/categories`, `/dashboard/users`, and `/dashboard/skills/[slug]/edit` to top-level routes (`/proposals`, `/review`, `/categories`, `/users`, `/skills/[slug]/edit`), updating middleware security policy, navigation links, and smoke tests.

**Tech Stack:** Next.js (App Router), TypeScript, Vitest.

---

### Task 1: Migrate App Router Directory Hierarchy (`src/app/`)

**Files:**
- Move: `src/app/dashboard/proposals/` ➔ `src/app/proposals/`
- Move: `src/app/dashboard/review/` ➔ `src/app/review/`
- Move: `src/app/dashboard/categories/` ➔ `src/app/categories/`
- Move: `src/app/dashboard/users/` ➔ `src/app/users/`
- Move: `src/app/dashboard/skills/` ➔ `src/app/skills/` (keeping edit route under `/skills/[slug]/edit/`)
- Move: `src/app/dashboard/review-api.ts` ➔ `src/app/review-api.ts`
- Test: `src/lib/review/ui-smoke.test.ts`

- [ ] **Step 1: Move route folders to top-level `src/app/`**

Run shell commands to move directories:
```powershell
Move-Item -Path "src/app/dashboard/proposals" -Destination "src/app/proposals"
Move-Item -Path "src/app/dashboard/review" -Destination "src/app/review"
Move-Item -Path "src/app/dashboard/categories" -Destination "src/app/categories"
Move-Item -Path "src/app/dashboard/users" -Destination "src/app/users"
Move-Item -Path "src/app/dashboard/skills" -Destination "src/app/skills"
Move-Item -Path "src/app/dashboard/review-api.ts" -Destination "src/app/review-api.ts"
```

- [ ] **Step 2: Update imports in moved pages for `review-api.ts`**

Update `src/app/proposals/page.tsx`, `src/app/proposals/[id]/page.tsx`, `src/app/review/page.tsx`, `src/app/review/[id]/page.tsx` import path for `review-api.ts`:
Change `import { ... } from "../review-api"` to `import { ... } from "@/app/review-api"`.

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit folder migration**

```bash
git add src/app/
git commit -m "refactor(routes): move dashboard sub-routes to top-level app routes"
```

---

### Task 2: Update Middleware Security Rules (`src/proxy.ts`)

**Files:**
- Modify: `src/proxy.ts`

- [ ] **Step 1: Update `src/proxy.ts`**

```ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // All protected routes require authentication
  const protectedPaths = ["/publish", "/dashboard", "/proposals", "/review", "/categories", "/users", "/skills"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !session) {
    const loginUrl = new URL("/api/auth/signin", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  const roles: string[] = session?.user?.roles ?? [];

  // /publish requires editor or admin
  if (pathname.startsWith("/publish") && !roles.includes("editor") && !roles.includes("admin")) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // /categories requires admin
  if (pathname.startsWith("/categories") && !roles.includes("admin")) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // /users requires admin
  if (pathname.startsWith("/users") && !roles.includes("admin")) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // /review requires reviewer or admin
  if (pathname.startsWith("/review") && !roles.includes("reviewer") && !roles.includes("admin")) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/publish/:path*",
    "/dashboard/:path*",
    "/proposals/:path*",
    "/review/:path*",
    "/categories/:path*",
    "/users/:path*",
    "/skills/:path*",
  ],
};
```

- [ ] **Step 2: Commit middleware changes**

```bash
git add src/proxy.ts
git commit -m "feat(security): update middleware authorization rules for simplified top-level routes"
```

---

### Task 3: Update Navigation Links & Breadcrumbs in UI Components

**Files:**
- Modify: `src/components/shell/AppSidebar.tsx`
- Modify: `src/components/shell/Breadcrumbs.tsx`
- Modify: `src/components/review/ReviewRequestList.tsx`
- Modify: `src/components/review/ReviewRequestDetail.tsx`
- Modify: `src/components/dashboard/DashboardClient.tsx`
- Modify: `src/app/publish/success/page.tsx`

- [ ] **Step 1: Update `src/components/shell/AppSidebar.tsx` navigation URLs**

Update `AppSidebar.tsx` navGroups:
- `Mis Skills`: `/dashboard`
- `Mis propuestas`: `/proposals`
- `Cola de revisión`: `/review`
- `Categorías`: `/categories`
- `Usuarios y roles`: `/users`

- [ ] **Step 2: Update `src/components/shell/Breadcrumbs.tsx` route labels**

```ts
const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Mis Skills",
  proposals: "Mis propuestas",
  review: "Revisión",
  categories: "Categorías",
  users: "Usuarios y roles",
  publish: "Publicar skill",
  skills: "Skills",
  edit: "Editar",
};
```

- [ ] **Step 3: Update href links in `ReviewRequestList.tsx`, `ReviewRequestDetail.tsx`, `DashboardClient.tsx`, `publish/success/page.tsx`**

- `ReviewRequestList.tsx`: Link `href={`/proposals/${request.id}`}` or `href={`/review/${request.id}`}` depending on mode/role.
- `ReviewRequestDetail.tsx`: Back link `href={mode === "review" ? "/review" : "/proposals"}`.
- `DashboardClient.tsx`: Edit button `href={`/skills/${skill.slug}/edit`}`.
- `publish/success/page.tsx`: Ver propuesta `href={`/proposals/${id}`}`.

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit UI navigation link changes**

```bash
git add src/components/shell/AppSidebar.tsx src/components/shell/Breadcrumbs.tsx src/components/review/ src/components/dashboard/src/app/publish/success/page.tsx
git commit -m "feat(ui): update navigation URLs and breadcrumbs for top-level routes"
```

---

### Task 4: Update UI Smoke Tests & End-to-End Verification

**Files:**
- Modify: `src/lib/review/ui-smoke.test.ts`

- [ ] **Step 1: Update `src/lib/review/ui-smoke.test.ts`**

Update imports in `ui-smoke.test.ts`:
- `@/app/dashboard/review/page` ➔ `@/app/review/page`
- `@/app/dashboard/review/[id]/page` ➔ `@/app/review/[id]/page`
- `@/app/dashboard/proposals/page` ➔ `@/app/proposals/page`
- `@/app/dashboard/proposals/[id]/page` ➔ `@/app/proposals/[id]/page`
- `../../app/dashboard/review-api.ts` ➔ `../../app/review-api.ts`

- [ ] **Step 2: Run full verification suite**

Run: `npx tsc --noEmit && pnpm test`
Expected: PASS (49+ tests passing)

- [ ] **Step 3: Commit changes**

```bash
git add src/lib/review/ui-smoke.test.ts
git commit -m "test(ui): update smoke test imports for simplified top-level routes"
```

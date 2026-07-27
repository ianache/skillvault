# Task 4 Report: Proxy and Sidebar Enforcement

## Summary

Implemented proxy and sidebar enforcement using the central page/capability policy from Task 3.

- Added `getNavigationGroups(roles)` in `src/components/shell/navigation.ts`.
- Updated `AppSidebar` to consume filtered navigation groups instead of duplicating role checks.
- Updated `src/proxy.ts` to consume `decidePageAccess()` for signin/catalog/allow decisions.
- Added navigation policy tests in `src/lib/review/navigation-policy.test.ts`.
- Preserved the existing `/skills/:path*` proxy matcher so public skill details and protected edit pages are distinguished by the central policy.

## TDD Log

1. Wrote `src/lib/review/navigation-policy.test.ts` before implementation.
2. Ran `pnpm exec tsx --test src/lib/review/navigation-policy.test.ts`.
3. Confirmed expected failing result:
   - `Cannot find module '@/components/shell/navigation'`
   - This matched the brief's expected failure because `navigation.ts` did not exist.
4. Implemented `src/components/shell/navigation.ts`.
5. Wired `AppSidebar` and `proxy` to central policy consumers.
6. Re-ran focused tests and TypeScript checks.

## Implementation Details

### Navigation Policy

`src/components/shell/navigation.ts` defines static navigation groups with optional `SkillVaultCapability` requirements.

`getNavigationGroups(roles)` filters items by:

- Allowing items with no required capability, currently the catalog link.
- Calling `hasCapability(roles, item.capability)` for protected navigation items.
- Removing empty groups after item filtering.

This keeps sidebar authorization derived from `src/lib/auth/access-policy.ts` instead of local role branches.

### Sidebar Enforcement

`src/components/shell/AppSidebar.tsx` now computes:

```ts
const navGroups = getNavigationGroups(userRoles);
```

Removed local `isAdmin`, `isReviewer`, and inline navigation role logic. The existing render loop and styling remain intact.

### Proxy Enforcement

`src/proxy.ts` now computes:

```ts
const roles = req.auth?.user?.roles ?? [];
const decision = decidePageAccess(pathname, Boolean(req.auth), roles);
```

Decision handling:

- `signin`: redirect to `/api/auth/signin` with `callbackUrl`.
- `catalog`: redirect to `/`.
- `allow`: continue with `NextResponse.next()`.

This means an effective `user` is denied from `/skills/{slug}/edit` through the central `content:manage` rule, while `/skills/{slug}` remains public.

## Test Results

### Expected Red Test

Command:

```bash
pnpm exec tsx --test src/lib/review/navigation-policy.test.ts
```

Result: failed as expected before implementation because `@/components/shell/navigation` was missing.

### Focused Policy and Navigation Tests

Command:

```bash
pnpm exec tsx --test src/lib/review/access-policy.test.ts src/lib/review/navigation-policy.test.ts
```

Result: passed.

- 10 tests passed.
- 0 failed.

### TypeScript

Command:

```bash
pnpm exec tsc --noEmit --incremental false
```

Result: passed.

### Full Suite

Command:

```bash
pnpm test
```

Result: failed only on the documented baseline failure.

- 88 tests total.
- 87 passed.
- 1 failed.
- Failure: `src/lib/review/api-contract.test.ts`, subtest `catalog excludes pending review requests`.
- Error: ``headers` was called outside a request scope`.

This matches the global constraint to preserve the existing unrelated full-suite baseline failure.

## Self-Review

- Confirmed no duplicated authorization role matrix was added.
- Confirmed sidebar filtering consumes `hasCapability()`.
- Confirmed proxy consumes `decidePageAccess()`.
- Confirmed authenticated denial redirects to `/` instead of `/unauthorized`.
- Confirmed missing authentication redirects to signin with the original callback URL.
- Confirmed `/skills/:path*` remains in the proxy matcher.
- Confirmed no plan/design/ledger control files were edited.
- `git diff --check` passed.

## Concerns

No new implementation concerns found. The only failing full-suite check is the documented baseline failure in `src/lib/review/api-contract.test.ts`.

## Fix Round 1

### Changes

- Updated `src/app/users/page.tsx` to use `decidePageAccess("/users", true, roles)` for authenticated admin-page denial and redirect denied authenticated users to `/`.
- Updated `src/app/review/page.tsx` and `src/app/review/[id]/page.tsx` to use `hasCapability(roles, "review:manage")` instead of duplicated reviewer/admin role checks.
- Added `src/lib/review/page-guard-policy.test.ts` to prevent these page guards from drifting back to local role branches or `/unauthorized`.
- Did not address the deferred Minor about missing `author` navigation coverage.

### Commands and Results

Red test before production changes:

```bash
pnpm exec tsx --test src/lib/review/page-guard-policy.test.ts
```

Result: failed as expected.

- `users page guard delegates to central page access policy` failed because `decidePageAccess` was absent and `/unauthorized` was still used.
- `review page guards delegate reviewer authorization to review capability` failed because review pages still used raw `roles.includes("reviewer") || roles.includes("admin")`.

Focused covering tests after the fix:

```bash
pnpm exec tsx --test src/lib/review/page-guard-policy.test.ts
```

Result: passed.

- 2 tests passed.
- 0 failed.

Policy/navigation/page guard coverage:

```bash
pnpm exec tsx --test src/lib/review/access-policy.test.ts src/lib/review/navigation-policy.test.ts src/lib/review/page-guard-policy.test.ts
```

Result: passed.

- 12 tests passed.
- 0 failed.

TypeScript:

```bash
pnpm exec tsc --noEmit --incremental false
```

Result: passed.

Diff whitespace check:

```bash
git diff --check
```

Result: passed. Git reported CRLF normalization warnings for the touched page files, but no whitespace errors.

Full review suite:

```bash
pnpm test
```

Result: failed only on the documented baseline failure.

- 90 tests total.
- 89 passed.
- 1 failed.
- Failure: `src/lib/review/api-contract.test.ts`, subtest `catalog excludes pending review requests`.
- Error: ``headers` was called outside a request scope`.

### Self-Review

- Confirmed `/users` no longer checks `roles.includes("admin")`.
- Confirmed `/users` no longer redirects authenticated denied users to `/unauthorized`.
- Confirmed review list and detail pages no longer duplicate reviewer/admin authorization.
- Confirmed review list and detail pages use `hasCapability(roles, "review:manage")`.
- Confirmed no plan, ledger, or other SDD control files were edited.

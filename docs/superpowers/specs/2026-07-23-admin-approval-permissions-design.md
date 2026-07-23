# Design Spec: Enable Admin Approval Permissions & Keycloak Role Extraction Fix

**Date:** 2026-07-23  
**Status:** Approved  

---

## 1. Overview & Context

In SkillVault, skill proposals submitted by users must be reviewed and approved by authorized actors before being published to the main catalog.
Currently, users with the `admin` role are intended to have review and approval capabilities alongside users with the `reviewer` role. However, a role extraction issue in the NextAuth Keycloak integration causes the `roles` array in the JWT and user session to be empty (`[]`). As a result, `admin` users are treated as standard users without review permissions.

This design document specifies:
1. Fixing Keycloak JWT role extraction in `src/auth.ts`.
2. Ensuring role checks in middleware, review authorization rules, and UI navigation support `admin` seamlessly.
3. Maintaining security constraints, specifically preserving the 4-eyes principle (authors cannot approve their own review requests).

---

## 2. Root Cause Analysis

In `src/auth.ts`:
- The `profile(profile)` callback extracts roles from Keycloak's `realm_access` and `resource_access` claims into a custom `roles` property on the returned user object.
- However, the `jwt({ token, account, profile })` callback attempts to read `(profile as Record<string, unknown>).roles`. In standard Keycloak ID tokens, `profile.roles` does not exist at the root level.
- Consequently, `roles` evaluates to `[]`, setting `token.roles = []` and `session.user.roles = []`.

---

## 3. Detailed Architecture & Design

### 3.1 Authentication & Role Extraction (`src/auth.ts`)

1. **Helper Function `extractKeycloakRoles`**:
   Extracts and merges roles from Keycloak profile claims:
   ```ts
   function extractKeycloakRoles(profile: Record<string, unknown>, clientId?: string): string[] {
     const realmRoles = (profile.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
     const clientRoles = clientId
       ? (profile.resource_access as Record<string, { roles?: string[] }> | undefined)?.[clientId]?.roles ?? []
       : [];
     return [...new Set([...realmRoles, ...clientRoles])];
   }
   ```

2. **NextAuth Callbacks**:
   - **`profile(profile)`**: Uses `extractKeycloakRoles` to build `{ id, name, email, roles }`.
   - **`jwt({ token, user, profile })`**:
     - When `user` is present (during initial sign-in), copy `user.roles` directly to `token.roles`.
     - Fall back to `extractKeycloakRoles(profile, process.env.AUTH_KEYCLOAK_ID)`.
   - **`session({ session, token })`**:
     - Assigns `session.user.roles = (token.roles as string[]) ?? []`.

---

### 3.2 Authorization Rules (`src/lib/review/auth.ts`)

- **`canReview(actor)`**:
  Returns `true` if `actor.roles.includes("reviewer") || actor.roles.includes("admin")`.
- **`decideReviewRequest(id, input, actor, client)`**:
  - Enforces `canReview(actor) === true`.
  - Enforces `request.authorId !== actor.id` (prevents self-approval, guaranteeing the 4-eyes principle for all roles including `admin`).

---

### 3.3 Middleware Access (`src/proxy.ts`)

- The middleware protects `/dashboard/review`:
  ```ts
  if (pathname.startsWith("/dashboard/review") && !roles.includes("reviewer") && !roles.includes("admin")) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }
  ```

---

### 3.4 UI Navigation & Decision Rendering

- **`src/components/NavLinks.tsx`**:
  - Checks user roles from session/client state.
  - Renders the **Revisión** navigation link when `roles.includes("reviewer") || roles.includes("admin")`.
- **`src/components/review/ReviewRequestDetail.tsx`**:
  - When viewed under `/dashboard/review/[id]`, decision action buttons (**Aprobar**, **Pedir cambios**, **Rechazar**) are rendered for pending proposals if the user is not the author.

---

## 4. Verification & Testing Strategy

1. **Unit Tests (`src/lib/review/service.test.ts`)**:
   - Add test case verifying an actor with `roles: ["admin"]` can successfully execute `decideReviewRequest` on a request authored by another user.
   - Verify an actor with `roles: ["admin"]` who is the author receives an `"Author cannot approve own request"` error.
2. **API Contract Tests (`src/lib/review/api-contract.test.ts`)**:
   - Add contract test simulating an `admin` session approving a review request via POST `/api/review-requests/[id]/decision`.
3. **Manual Verification**:
   - Log in with a Keycloak user holding the `admin` realm role.
   - Verify `session.user.roles` includes `"admin"`.
   - Access `/dashboard/review` and approve a proposal.

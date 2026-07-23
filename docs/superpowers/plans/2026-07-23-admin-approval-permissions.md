# Admin Approval Permissions & Keycloak Role Extraction Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure users with the `admin` role can review and approve skill proposals authored by others, fixing the Keycloak JWT role extraction bug in NextAuth.

**Architecture:** Update NextAuth JWT callback in `src/auth.ts` to preserve Keycloak `realm_access` and `resource_access` roles on sign-in. Ensure `canReview(actor)` in `src/lib/review/auth.ts` and `src/proxy.ts` middleware grant review privileges to `admin` while preserving author anti-self-approval restrictions.

**Tech Stack:** Next.js (App Router), NextAuth.js v5 (Keycloak Provider), TypeScript, Vitest, React.

## Global Constraints

- Preserve Keycloak `realm_access` and `resource_access` roles during JWT token creation.
- Enforce the 4-eyes principle: authors (including `admin`s) CANNOT approve their own proposals (`request.authorId !== actor.id`).
- All code changes must pass TypeScript type checking (`npx tsc --noEmit`) and linting (`pnpm lint`).
- Tests must pass via `pnpm test`.

---

### Task 1: Fix Keycloak Role Extraction in NextAuth (`src/auth.ts`)

**Files:**
- Modify: `src/auth.ts`
- Test: `src/lib/review/auth.ts` (or auth integration test)

**Interfaces:**
- Consumes: Keycloak JWT Profile (`realm_access`, `resource_access`).
- Produces: `session.user.roles` populated with array of string roles (e.g., `["admin", "editor"]`).

- [ ] **Step 1: Write unit test to verify role extraction logic**

Create a test in `src/lib/review/auth.test.ts` to verify role helper behavior:

```ts
import { describe, expect, test } from "vitest";
import { canReview } from "./auth";

describe("canReview permission helper", () => {
  test("allows user with reviewer role", () => {
    expect(canReview({ id: "u1", roles: ["reviewer"] })).toBe(true);
  });

  test("allows user with admin role", () => {
    expect(canReview({ id: "u2", roles: ["admin"] })).toBe(true);
  });

  test("denies user with only editor role", () => {
    expect(canReview({ id: "u3", roles: ["editor"] })).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify initial state**

Run: `pnpm test src/lib/review/auth.test.ts`
Expected: PASS

- [ ] **Step 3: Update `src/auth.ts` to correctly extract and pass roles to JWT**

Modify `src/auth.ts`:

```ts
import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

function extractKeycloakRoles(profile: Record<string, unknown>, clientId?: string): string[] {
  const realmRoles = (profile.realm_access as { roles?: string[] } | undefined)?.roles ?? [];
  const clientRoles = clientId
    ? (profile.resource_access as Record<string, { roles?: string[] }> | undefined)?.[clientId]?.roles ?? []
    : [];
  return [...new Set([...realmRoles, ...clientRoles])];
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/signin",
  },
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID!,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET!,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER!,
      profile(profile) {
        const roles = extractKeycloakRoles(profile as Record<string, unknown>, process.env.AUTH_KEYCLOAK_ID);
        return {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username,
          email: profile.email,
          image: profile.picture,
          roles,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, profile }) {
      if (user && "roles" in user && Array.isArray(user.roles)) {
        token.roles = user.roles as string[];
      } else if (profile) {
        token.roles = extractKeycloakRoles(profile as Record<string, unknown>, process.env.AUTH_KEYCLOAK_ID);
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.name = token.name ?? session.user.name;
      session.user.email = token.email ?? session.user.email;
      session.user.roles = (token.roles as string[]) ?? [];
      return session;
    },
  },
});
```

- [ ] **Step 4: Run typecheck and test**

Run: `npx tsc --noEmit && pnpm test`
Expected: PASS with 0 errors

- [ ] **Step 5: Commit changes**

```bash
git add src/auth.ts src/lib/review/auth.test.ts
git commit -m "fix(auth): preserve Keycloak realm and client roles in NextAuth JWT token"
```

---

### Task 2: Verify Review Service & API Permissions for Admin (`src/lib/review/service.test.ts`)

**Files:**
- Modify: `src/lib/review/service.test.ts`
- Modify: `src/lib/review/api-contract.test.ts`

**Interfaces:**
- Consumes: `decideReviewRequest(id, input, actor, client)`
- Produces: Successful approval execution when `actor.roles = ["admin"]` and `actor.id !== request.authorId`.

- [ ] **Step 1: Write test for admin decision in `service.test.ts`**

Add tests to `src/lib/review/service.test.ts`:

```ts
test("allows an admin actor to approve a pending review request from another user", async () => {
  const db = createTestDb();
  const author: ReviewActor = { id: "author-1", handle: "author", roles: ["editor"] };
  const admin: ReviewActor = { id: "admin-1", handle: "admin", roles: ["admin"] };

  const request = await createReviewRequest(
    { rawContent: VALID_SKILL_MD },
    author,
    db
  );

  const decided = await decideReviewRequest(
    request.id,
    { decision: "approve", comment: "LGTM" },
    admin,
    db
  );

  expect(decided.status).toBe("approved");
  expect(decided.reviewerId).toBe("admin-1");
});

test("prevents an admin actor from approving their own review request", async () => {
  const db = createTestDb();
  const adminAuthor: ReviewActor = { id: "admin-1", handle: "admin", roles: ["admin"] };

  const request = await createReviewRequest(
    { rawContent: VALID_SKILL_MD },
    adminAuthor,
    db
  );

  await expect(
    decideReviewRequest(
      request.id,
      { decision: "approve", comment: "Self approval attempt" },
      adminAuthor,
      db
    )
  ).rejects.toThrow("Author cannot approve own request");
});
```

- [ ] **Step 2: Run tests to verify execution**

Run: `pnpm test src/lib/review/service.test.ts`
Expected: PASS

- [ ] **Step 3: Add API contract test in `api-contract.test.ts`**

Add test to `src/lib/review/api-contract.test.ts`:

```ts
test("POST /api/review-requests/[id]/decision allows admin session", async () => {
  const db = createTestDb();
  const author: ReviewActor = { id: "user-1", handle: "user", roles: ["editor"] };
  const admin: ReviewActor = { id: "admin-1", handle: "admin", roles: ["admin"] };

  const request = await createReviewRequest({ rawContent: VALID_SKILL_MD }, author, db);
  const handlers = createReviewDecisionHandlers({
    getSession: async () => ({ user: { id: admin.id, name: "Admin", email: "admin@test.com", roles: admin.roles }, expires: "" }),
    database: db,
  });

  const response = await handlers.POST(
    new NextRequest(`http://localhost/api/review-requests/${request.id}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision: "approve", comment: "Approved by admin" }),
    }),
    { params: Promise.resolve({ id: String(request.id) }) }
  );

  expect(response.status).toBe(200);
  const json = await response.json();
  expect(json.request.status).toBe("approved");
});
```

- [ ] **Step 4: Run full test suite and linter**

Run: `pnpm test && pnpm lint`
Expected: PASS

- [ ] **Step 5: Commit changes**

```bash
git add src/lib/review/service.test.ts src/lib/review/api-contract.test.ts
git commit -m "test(review): add unit and API contract tests for admin approval permissions"
```

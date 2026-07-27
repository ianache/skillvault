# Default User Role in Session Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Keycloak-authenticated users with no recognized SkillVault client role an effective `user` session role, then enforce one shared role policy across session data, pages, navigation, services, and APIs.

**Architecture:** Add pure role-normalization and access-policy modules under `src/lib/auth/`. `src/auth.ts` consumes role normalization, while `proxy.ts`, sidebar navigation, review services, and protected API routes consume typed capabilities from the same policy. The fallback is session-only and never writes to Keycloak or the local `users` table.

**Tech Stack:** Next.js 16 App Router, NextAuth v5, Keycloak OIDC claims, TypeScript, React 19, Node `node:test` through `tsx --test`.

## Global Constraints

- Recognized SkillVault roles are exactly `user`, `admin`, `author`, `editor`, and `reviewer`.
- Read roles only from `resource_access[AUTH_KEYCLOAK_ID].roles` and the dedicated flat `roles` claim.
- Ignore `realm_access.roles`, including homonymous roles such as `admin`.
- Return exactly `["user"]` when no recognized SkillVault client role exists.
- Do not add `user` when one or more recognized roles already exist.
- Do not call the Keycloak Admin API and do not persist the fallback in the local `users` table.
- `user` may access `/`, `/skills/{slug}`, public read APIs, and authenticated skill ratings.
- `user` may not create, edit, review, or administer content.
- Authenticated page denial redirects to `/`; API denial returns `403`; missing API authentication returns `401`.
- Preserve the existing unrelated full-suite baseline failure in `src/lib/review/api-contract.test.ts` where `headers()` is called outside request scope.
- Keep tests under `src/lib/review/*.test.ts` so the existing `pnpm test` script discovers them.

---

### Task 1: Pure SkillVault Role Normalization

**Files:**
- Create: `src/lib/auth/role-policy.ts`
- Create: `src/lib/review/role-policy.test.ts`

**Interfaces:**
- Produces: `SkillVaultRole`
- Produces: `SKILLVAULT_ROLES`
- Produces: `normalizeSkillVaultRoles(values: unknown): SkillVaultRole[]`
- Produces: `getEffectiveSkillVaultRoles(profile: Record<string, unknown>, clientId?: string): SkillVaultRole[]`
- Produces: `resolveSkillVaultJwtRoles(input: JwtRoleInput): SkillVaultRole[]`

- [ ] **Step 1: Write failing normalization tests**

Create `src/lib/review/role-policy.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getEffectiveSkillVaultRoles,
  normalizeSkillVaultRoles,
  resolveSkillVaultJwtRoles,
} from "@/lib/auth/role-policy";

test("extracts recognized roles from the configured Keycloak client", () => {
  const roles = getEffectiveSkillVaultRoles({
    resource_access: {
      skillvault: { roles: ["editor", "reviewer", "unknown"] },
    },
  }, "skillvault");

  assert.deepEqual(roles, ["editor", "reviewer"]);
});

test("extracts recognized roles from the dedicated flat roles claim", () => {
  assert.deepEqual(
    getEffectiveSkillVaultRoles({ roles: ["admin", "admin", "offline_access"] }, "skillvault"),
    ["admin"],
  );
});

test("ignores realm roles even when they match SkillVault role names", () => {
  assert.deepEqual(
    getEffectiveSkillVaultRoles({
      realm_access: { roles: ["admin", "reviewer"] },
      resource_access: { skillvault: { roles: [] } },
    }, "skillvault"),
    ["user"],
  );
});

test("falls back to user for absent malformed or unknown client roles", () => {
  assert.deepEqual(getEffectiveSkillVaultRoles({}, "skillvault"), ["user"]);
  assert.deepEqual(getEffectiveSkillVaultRoles({ roles: "admin" }, "skillvault"), ["user"]);
  assert.deepEqual(
    getEffectiveSkillVaultRoles({
      resource_access: { skillvault: { roles: ["offline_access"] } },
    }, "skillvault"),
    ["user"],
  );
});

test("does not add user when a recognized role exists", () => {
  assert.deepEqual(normalizeSkillVaultRoles(["author"]), ["author"]);
  assert.deepEqual(normalizeSkillVaultRoles(["editor", "editor"]), ["editor"]);
});

test("resolves JWT roles from user profile or existing token in priority order", () => {
  assert.deepEqual(resolveSkillVaultJwtRoles({
    userRoles: ["editor"],
    profile: { roles: ["admin"] },
    tokenRoles: ["reviewer"],
    clientId: "skillvault",
  }), ["editor"]);

  assert.deepEqual(resolveSkillVaultJwtRoles({
    profile: { resource_access: { skillvault: { roles: ["reviewer"] } } },
    tokenRoles: ["admin"],
    clientId: "skillvault",
  }), ["reviewer"]);

  assert.deepEqual(resolveSkillVaultJwtRoles({
    tokenRoles: [],
    clientId: "skillvault",
  }), ["user"]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm exec tsx --test src/lib/review/role-policy.test.ts
```

Expected: FAIL because `@/lib/auth/role-policy` does not exist.

- [ ] **Step 3: Implement the pure role policy**

Create `src/lib/auth/role-policy.ts`:

```ts
export const SKILLVAULT_ROLES = [
  "user",
  "admin",
  "author",
  "editor",
  "reviewer",
] as const;

export type SkillVaultRole = typeof SKILLVAULT_ROLES[number];

const roleSet = new Set<string>(SKILLVAULT_ROLES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function roleArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((role): role is string => typeof role === "string")
    : [];
}

export function normalizeSkillVaultRoles(values: unknown): SkillVaultRole[] {
  const roles = roleArray(values).filter(
    (role): role is SkillVaultRole => roleSet.has(role),
  );
  const unique = [...new Set(roles)];
  return unique.length > 0 ? unique : ["user"];
}

export function getEffectiveSkillVaultRoles(
  profile: Record<string, unknown>,
  clientId?: string,
): SkillVaultRole[] {
  const resourceAccess = isRecord(profile.resource_access)
    ? profile.resource_access
    : {};
  const clientAccess = clientId && isRecord(resourceAccess[clientId])
    ? resourceAccess[clientId]
    : {};
  const clientRoles = roleArray(clientAccess.roles);
  const flatRoles = roleArray(profile.roles);

  return normalizeSkillVaultRoles([...clientRoles, ...flatRoles]);
}

export type JwtRoleInput = {
  userRoles?: unknown;
  profile?: Record<string, unknown> | null;
  tokenRoles?: unknown;
  clientId?: string;
};

export function resolveSkillVaultJwtRoles(input: JwtRoleInput): SkillVaultRole[] {
  if (Array.isArray(input.userRoles)) {
    return normalizeSkillVaultRoles(input.userRoles);
  }
  if (input.profile) {
    return getEffectiveSkillVaultRoles(input.profile, input.clientId);
  }
  return normalizeSkillVaultRoles(input.tokenRoles);
}
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
pnpm exec tsx --test src/lib/review/role-policy.test.ts
```

Expected: PASS, 6 tests and 0 failures.

- [ ] **Step 5: Run TypeScript**

Run:

```bash
pnpm exec tsc --noEmit --incremental false
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth/role-policy.ts src/lib/review/role-policy.test.ts
git commit -m "feat: normalize effective SkillVault session roles"
```

---

### Task 2: NextAuth Profile, JWT, and Session Integration

**Files:**
- Modify: `src/auth.ts:1-60`
- Create: `src/lib/review/auth-session-contract.test.ts`

**Interfaces:**
- Consumes: `getEffectiveSkillVaultRoles()` and `resolveSkillVaultJwtRoles()` from Task 1.
- Produces: `token.roles` and `session.user.roles` normalized to `SkillVaultRole[]`.

- [ ] **Step 1: Write a failing NextAuth wiring contract test**

Create `src/lib/review/auth-session-contract.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const source = readFileSync(join(process.cwd(), "src", "auth.ts"), "utf8");

test("NextAuth uses the central role policy for profile JWT and session", () => {
  assert.match(source, /getEffectiveSkillVaultRoles/);
  assert.match(source, /resolveSkillVaultJwtRoles/);
  assert.match(
    source,
    /roles:\s*getEffectiveSkillVaultRoles\([^;]+AUTH_KEYCLOAK_ID/s,
  );
  assert.match(
    source,
    /token\.roles\s*=\s*resolveSkillVaultJwtRoles\(/,
  );
  assert.match(
    source,
    /session\.user\.roles\s*=\s*normalizeSkillVaultRoles\(token\.roles\)/,
  );
  assert.doesNotMatch(source, /realm_access/);
});
```

- [ ] **Step 2: Run the contract test to verify it fails**

Run:

```bash
pnpm exec tsx --test src/lib/review/auth-session-contract.test.ts
```

Expected: FAIL because `src/auth.ts` still contains inline realm-role extraction.

- [ ] **Step 3: Replace inline extraction in `src/auth.ts`**

Remove the existing `extractKeycloakRoles()` function and add:

```ts
import {
  getEffectiveSkillVaultRoles,
  normalizeSkillVaultRoles,
  resolveSkillVaultJwtRoles,
} from "@/lib/auth/role-policy";
```

Use the central policy in the provider:

```ts
profile(profile) {
  return {
    id: profile.sub,
    name: profile.name ?? profile.preferred_username,
    email: profile.email,
    image: profile.picture,
    roles: getEffectiveSkillVaultRoles(
      profile as Record<string, unknown>,
      process.env.AUTH_KEYCLOAK_ID,
    ),
  };
},
```

Replace the JWT role branch with:

```ts
token.roles = resolveSkillVaultJwtRoles({
  userRoles: user && "roles" in user ? user.roles : undefined,
  profile: profile as Record<string, unknown> | undefined,
  tokenRoles: token.roles,
  clientId: process.env.AUTH_KEYCLOAK_ID,
});
```

Normalize once more at the session boundary:

```ts
session.user.roles = normalizeSkillVaultRoles(token.roles);
```

- [ ] **Step 4: Run role and auth contract tests**

Run:

```bash
pnpm exec tsx --test src/lib/review/role-policy.test.ts src/lib/review/auth-session-contract.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run TypeScript**

Run:

```bash
pnpm exec tsc --noEmit --incremental false
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/auth.ts src/lib/review/auth-session-contract.test.ts
git commit -m "feat: apply fallback user role to NextAuth sessions"
```

---

### Task 3: Central Page and Capability Policy

**Files:**
- Create: `src/lib/auth/access-policy.ts`
- Create: `src/lib/review/access-policy.test.ts`

**Interfaces:**
- Consumes: `SkillVaultRole` from Task 1.
- Produces: `SkillVaultCapability`
- Produces: `hasCapability(roles, capability): boolean`
- Produces: `getPageRule(pathname): PageRule`
- Produces: `decidePageAccess(pathname, authenticated, roles): PageDecision`

- [ ] **Step 1: Write failing capability and page-decision tests**

Create `src/lib/review/access-policy.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decidePageAccess,
  hasCapability,
} from "@/lib/auth/access-policy";

test("user can browse and rate but cannot manage content", () => {
  assert.equal(hasCapability(["user"], "catalog:read"), true);
  assert.equal(hasCapability(["user"], "rating:write"), true);
  assert.equal(hasCapability(["user"], "content:manage"), false);
  assert.equal(hasCapability(["user"], "publish:create"), false);
});

test("role capabilities match the approved access matrix", () => {
  assert.equal(hasCapability(["author"], "content:manage"), true);
  assert.equal(hasCapability(["author"], "publish:create"), false);
  assert.equal(hasCapability(["editor"], "publish:create"), true);
  assert.equal(hasCapability(["reviewer"], "review:manage"), true);
  assert.equal(hasCapability(["reviewer"], "admin:manage"), false);
  assert.equal(hasCapability(["admin"], "admin:manage"), true);
});

test("catalog and skill details are public", () => {
  assert.equal(decidePageAccess("/", false, []), "allow");
  assert.equal(decidePageAccess("/skills/demo-skill", false, []), "allow");
});

test("skill editing is distinct from public skill detail", () => {
  assert.equal(decidePageAccess("/skills/demo-skill/edit", false, []), "signin");
  assert.equal(decidePageAccess("/skills/demo-skill/edit", true, ["user"]), "catalog");
  assert.equal(decidePageAccess("/skills/demo-skill/edit", true, ["author"]), "allow");
});

test("authenticated user is returned to catalog from disallowed pages", () => {
  for (const pathname of [
    "/publish",
    "/dashboard",
    "/proposals",
    "/review",
    "/categories",
    "/users",
  ]) {
    assert.equal(decidePageAccess(pathname, true, ["user"]), "catalog", pathname);
  }
});

test("unauthenticated protected pages require sign in", () => {
  assert.equal(decidePageAccess("/publish", false, []), "signin");
  assert.equal(decidePageAccess("/review/12", false, []), "signin");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm exec tsx --test src/lib/review/access-policy.test.ts
```

Expected: FAIL because `@/lib/auth/access-policy` does not exist.

- [ ] **Step 3: Implement capability and page policy**

Create `src/lib/auth/access-policy.ts`:

```ts
import type { SkillVaultRole } from "./role-policy";

export type SkillVaultCapability =
  | "catalog:read"
  | "rating:write"
  | "content:manage"
  | "publish:create"
  | "review:manage"
  | "admin:manage";

const ROLE_CAPABILITIES: Record<SkillVaultRole, readonly SkillVaultCapability[]> = {
  user: ["catalog:read", "rating:write"],
  author: ["catalog:read", "rating:write", "content:manage"],
  editor: ["catalog:read", "rating:write", "content:manage", "publish:create"],
  reviewer: ["catalog:read", "rating:write", "content:manage", "review:manage"],
  admin: [
    "catalog:read",
    "rating:write",
    "content:manage",
    "publish:create",
    "review:manage",
    "admin:manage",
  ],
};

export function hasCapability(
  roles: readonly string[],
  capability: SkillVaultCapability,
): boolean {
  return roles.some((role) => {
    const capabilities = ROLE_CAPABILITIES[role as SkillVaultRole];
    return capabilities?.includes(capability) ?? false;
  });
}

export type PageRule =
  | { kind: "public" }
  | { kind: "protected"; capability: SkillVaultCapability };

export type PageDecision = "allow" | "signin" | "catalog";

function isPath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getPageRule(pathname: string): PageRule {
  if (pathname === "/" || /^\/skills\/[^/]+\/?$/.test(pathname)) {
    return { kind: "public" };
  }
  if (/^\/skills\/[^/]+\/edit(?:\/|$)/.test(pathname)) {
    return { kind: "protected", capability: "content:manage" };
  }
  if (isPath(pathname, "/publish")) {
    return { kind: "protected", capability: "publish:create" };
  }
  if (isPath(pathname, "/dashboard") || isPath(pathname, "/proposals")) {
    return { kind: "protected", capability: "content:manage" };
  }
  if (isPath(pathname, "/review")) {
    return { kind: "protected", capability: "review:manage" };
  }
  if (isPath(pathname, "/categories") || isPath(pathname, "/users")) {
    return { kind: "protected", capability: "admin:manage" };
  }
  if (isPath(pathname, "/skills")) {
    return { kind: "protected", capability: "content:manage" };
  }
  return { kind: "public" };
}

export function decidePageAccess(
  pathname: string,
  authenticated: boolean,
  roles: readonly string[],
): PageDecision {
  const rule = getPageRule(pathname);
  if (rule.kind === "public") return "allow";
  if (!authenticated) return "signin";
  return hasCapability(roles, rule.capability) ? "allow" : "catalog";
}
```

- [ ] **Step 4: Run policy tests**

Run:

```bash
pnpm exec tsx --test src/lib/review/access-policy.test.ts
```

Expected: PASS, 6 tests and 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/access-policy.ts src/lib/review/access-policy.test.ts
git commit -m "feat: centralize SkillVault page capabilities"
```

---

### Task 4: Proxy and Sidebar Enforcement

**Files:**
- Modify: `src/proxy.ts:1-52`
- Create: `src/components/shell/navigation.ts`
- Modify: `src/components/shell/AppSidebar.tsx:1-51`
- Create: `src/lib/review/navigation-policy.test.ts`

**Interfaces:**
- Consumes: `decidePageAccess()` and `hasCapability()` from Task 3.
- Produces: `getNavigationGroups(roles): NavigationGroup[]`.

- [ ] **Step 1: Write failing navigation tests**

Create `src/lib/review/navigation-policy.test.ts`:

```ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { getNavigationGroups } from "@/components/shell/navigation";

function hrefs(roles: string[]): string[] {
  return getNavigationGroups(roles).flatMap((group) =>
    group.items.map((item) => item.href)
  );
}

test("user navigation contains only Catalog", () => {
  assert.deepEqual(hrefs(["user"]), ["/"]);
});

test("editor navigation includes publishing and owned content", () => {
  assert.deepEqual(hrefs(["editor"]), [
    "/",
    "/publish",
    "/dashboard",
    "/proposals",
  ]);
});

test("reviewer navigation includes review but not administration", () => {
  assert.deepEqual(hrefs(["reviewer"]), [
    "/",
    "/dashboard",
    "/proposals",
    "/review",
  ]);
});

test("admin navigation includes every protected area", () => {
  assert.deepEqual(hrefs(["admin"]), [
    "/",
    "/publish",
    "/dashboard",
    "/proposals",
    "/review",
    "/categories",
    "/users",
  ]);
});
```

- [ ] **Step 2: Run navigation tests to verify they fail**

Run:

```bash
pnpm exec tsx --test src/lib/review/navigation-policy.test.ts
```

Expected: FAIL because `navigation.ts` does not exist.

- [ ] **Step 3: Create capability-filtered navigation data**

Create `src/components/shell/navigation.ts`:

```ts
import {
  hasCapability,
  type SkillVaultCapability,
} from "@/lib/auth/access-policy";

export type NavigationItem = {
  label: string;
  href: string;
  icon: string;
  capability?: SkillVaultCapability;
};

export type NavigationGroup = {
  title: string;
  items: NavigationItem[];
};

const NAVIGATION: NavigationGroup[] = [
  {
    title: "Exploración",
    items: [
      { label: "Catálogo", href: "/", icon: "\u{1F50D}" },
      {
        label: "Publicar skill",
        href: "/publish",
        icon: "\u2795",
        capability: "publish:create",
      },
    ],
  },
  {
    title: "Mi Contenido",
    items: [
      {
        label: "Mis Skills",
        href: "/dashboard",
        icon: "\u{1F4E6}",
        capability: "content:manage",
      },
      {
        label: "Mis propuestas",
        href: "/proposals",
        icon: "\u{1F4DD}",
        capability: "content:manage",
      },
    ],
  },
  {
    title: "Revisión",
    items: [
      {
        label: "Cola de revisión",
        href: "/review",
        icon: "\u{1F6E1}\uFE0F",
        capability: "review:manage",
      },
      {
        label: "Categorías",
        href: "/categories",
        icon: "\u{1F3F7}\uFE0F",
        capability: "admin:manage",
      },
    ],
  },
  {
    title: "Administración",
    items: [
      {
        label: "Usuarios y roles",
        href: "/users",
        icon: "\u{1F465}",
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

- [ ] **Step 4: Update `AppSidebar` to consume filtered groups**

Add:

```ts
import { getNavigationGroups } from "./navigation";
```

Replace `isAdmin`, `isReviewer`, and the inline `navGroups` declaration with:

```ts
const navGroups = getNavigationGroups(userRoles);
```

Keep the existing render loop and visual styling unchanged.

- [ ] **Step 5: Replace proxy role conditions with the central decision**

In `src/proxy.ts`, import:

```ts
import { decidePageAccess } from "@/lib/auth/access-policy";
```

Replace the duplicated `protectedPaths` and role branches with:

```ts
const roles = req.auth?.user?.roles ?? [];
const decision = decidePageAccess(pathname, Boolean(req.auth), roles);

if (decision === "signin") {
  const loginUrl = new URL("/api/auth/signin", req.url);
  loginUrl.searchParams.set("callbackUrl", req.url);
  return NextResponse.redirect(loginUrl);
}

if (decision === "catalog") {
  return NextResponse.redirect(new URL("/", req.url));
}

return NextResponse.next();
```

Keep the matcher entries, including `/skills/:path*`, so the proxy can
distinguish public detail pages from protected edit pages.

- [ ] **Step 6: Run policy and navigation tests**

Run:

```bash
pnpm exec tsx --test src/lib/review/access-policy.test.ts src/lib/review/navigation-policy.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run TypeScript**

Run:

```bash
pnpm exec tsc --noEmit --incremental false
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/proxy.ts src/components/shell/navigation.ts src/components/shell/AppSidebar.tsx src/lib/review/navigation-policy.test.ts
git commit -m "feat: enforce role policy in pages and navigation"
```

---

### Task 5: Review Service and Write-API Authorization

**Files:**
- Modify: `src/lib/review/auth.ts:1-10`
- Modify: `src/lib/review/service.ts`
- Modify: `src/app/api/review-requests/route-utils.ts:1-40`
- Modify: `src/app/api/skills/route.ts:139-160`
- Modify: `src/app/api/skills/[slug]/route.ts:105-153`
- Modify: `src/app/api/review-requests/route.ts:29-56`
- Modify: `src/app/api/review-requests/[id]/route.ts:19-44`
- Modify: `src/app/api/review-requests/[id]/comments/route.ts:10-23`
- Modify: `src/app/api/review-requests/[id]/decision/route.ts:36-49`
- Modify: `src/lib/review/service.test.ts`
- Modify: `src/lib/review/api-contract.test.ts`

**Interfaces:**
- Consumes: `hasCapability()` from Task 3.
- Produces: `capabilityError(actor, capability): NextResponse | null`.
- Preserves: service ownership checks and the four-eyes approval rule.

- [ ] **Step 1: Add failing service permission tests**

In `src/lib/review/service.test.ts`, add:

```ts
const userActor: ReviewActor = {
  id: "user-1",
  handle: "user",
  roles: ["user"],
};

const editorActor: ReviewActor = {
  id: "author-1",
  handle: "editor",
  roles: ["editor"],
};

test("user role cannot create a review request", async () => {
  await assert.rejects(
    () => createReviewRequest(
      {
        rawContent: validRawContent,
        files: [],
        acceptedResponsibility: true,
      },
      userActor,
      createFakeClient(),
    ),
    /not allowed/,
  );
});

test("user role cannot edit or inspect review workflow state", async () => {
  const fakeClient = createFakeClient();
  await assert.rejects(
    () => updateReviewRequest(
      1,
      { rawContent: validRawContent, files: [] },
      userActor,
      fakeClient,
    ),
    /not allowed/,
  );
  await assert.rejects(
    () => listReviewRequests({}, userActor, fakeClient),
    /not allowed/,
  );
});

test("editor role can create review requests", async () => {
  const request = await createReviewRequest(
    {
      rawContent: validRawContent,
      files: [],
      acceptedResponsibility: true,
    },
    editorActor,
    createFakeClient(),
  );
  assert.equal(request.status, "pending");
});
```

Change existing create-path tests that use `authorActor` to use
`editorActor`. Keep author-ownership update tests on `authorActor`.

- [ ] **Step 2: Run service tests to verify they fail**

Run:

```bash
pnpm exec tsx --test src/lib/review/service.test.ts
```

Expected: FAIL because `userActor` can still enter review workflow services.

- [ ] **Step 3: Centralize service permission helpers**

Replace `src/lib/review/auth.ts` with wrappers over the shared policy:

```ts
import { hasCapability } from "@/lib/auth/access-policy";
import type { ReviewActor } from "./types";

export function canReview(actor: ReviewActor): boolean {
  return hasCapability(actor.roles, "review:manage");
}

export function canManageContent(actor: ReviewActor): boolean {
  return hasCapability(actor.roles, "content:manage");
}

export function canPublish(actor: ReviewActor): boolean {
  return hasCapability(actor.roles, "publish:create");
}

export function assertCanEditRequest(
  actor: ReviewActor,
  request: { authorId: string; status: string },
): void {
  if (!canManageContent(actor)) {
    throw new Error("Review workflow is not allowed for this role");
  }
  if (request.authorId !== actor.id) {
    throw new Error("Only the author can edit this request");
  }
  if (request.status !== "pending" && request.status !== "changes_requested") {
    throw new Error("Review request is not editable");
  }
}
```

In `src/lib/review/service.ts`, add explicit guards at the start of public
workflow functions:

```ts
if (!canPublish(actor)) {
  throw new Error("Publishing is not allowed for this role");
}
```

Use that guard in `createReviewRequest()`.

Use:

```ts
if (!canManageContent(actor)) {
  throw new Error("Review workflow is not allowed for this role");
}
```

in `getReviewRequest()`, `getReviewStatusCounts()`, `listReviewRequests()`,
`updateReviewRequest()`, and `addReviewComment()` before reading or mutating
workflow data. Keep `decideReviewRequest()` on `canReview()`.

- [ ] **Step 4: Add a reusable early API guard**

In `src/app/api/review-requests/route-utils.ts`, import:

```ts
import {
  hasCapability,
  type SkillVaultCapability,
} from "@/lib/auth/access-policy";
```

Add:

```ts
export function capabilityError(
  actor: ReviewActor,
  capability: SkillVaultCapability,
) {
  return hasCapability(actor.roles, capability)
    ? null
    : NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

- [ ] **Step 5: Apply early guards to write and workflow routes**

Import `capabilityError` from the existing route-utils import in each route.
Immediately after the existing `401` actor check, add the matching guard:

```ts
const forbidden = capabilityError(actor, "publish:create");
if (forbidden) return forbidden;
```

Use `publish:create` for:

- `POST /api/skills`
- `POST /api/review-requests`

Use `content:manage` for:

- `PATCH /api/skills/[slug]`
- `GET /api/review-requests`
- `GET /api/review-requests/[id]`
- `PATCH /api/review-requests/[id]`
- `POST /api/review-requests/[id]/comments`

Use `review:manage` for:

- `POST /api/review-requests/[id]/decision`

Place every guard before request-body parsing and database reads so denied
users receive `403` without invoking downstream dependencies.

- [ ] **Step 6: Add API contract tests for fallback users**

In `src/lib/review/api-contract.test.ts`, add a session fixture:

```ts
const userSession = {
  user: {
    id: "user-1",
    name: "Fallback User",
    email: "user@example.com",
    roles: ["user"],
  },
};
```

Add handler tests:

```ts
test("user role receives 403 before creating a skill review request", async () => {
  let createCalled = false;
  const { POST } = createSkillHandlers({
    getSession: async () => userSession,
    create: async () => {
      createCalled = true;
      throw new Error("must not run");
    },
  });

  const response = await POST(new NextRequest("http://localhost/api/skills", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      rawContent: validRawContent,
      files: [],
      acceptedResponsibility: true,
    }),
  }));

  assert.equal(response.status, 403);
  assert.equal(createCalled, false);
});

test("user role receives 403 before entering review request APIs", async () => {
  let listCalled = false;
  const { GET } = createReviewRequestsHandlers({
    getSession: async () => userSession,
    list: async () => {
      listCalled = true;
      throw new Error("must not run");
    },
  });

  const response = await GET(
    new NextRequest("http://localhost/api/review-requests"),
  );

  assert.equal(response.status, 403);
  assert.equal(listCalled, false);
});
```

Use the existing valid content fixture and handler dependency defaults already
present in `api-contract.test.ts`; provide any required no-op database or count
dependency using the same fake-client pattern in that file.

- [ ] **Step 7: Run service and API contract tests**

Run:

```bash
pnpm exec tsx --test src/lib/review/service.test.ts src/lib/review/api-contract.test.ts
```

Expected: all branch-related tests PASS. The known catalog request-scope test
may still fail when this file is run in full; verify that no new test fails and
use its existing injected-session pattern where possible.

- [ ] **Step 8: Run TypeScript**

Run:

```bash
pnpm exec tsc --noEmit --incremental false
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/review/auth.ts src/lib/review/service.ts src/app/api/review-requests/route-utils.ts src/app/api/skills/route.ts "src/app/api/skills/[slug]/route.ts" src/app/api/review-requests/route.ts "src/app/api/review-requests/[id]/route.ts" "src/app/api/review-requests/[id]/comments/route.ts" "src/app/api/review-requests/[id]/decision/route.ts" src/lib/review/service.test.ts src/lib/review/api-contract.test.ts
git commit -m "feat: block fallback users from write workflows"
```

---

### Task 6: Admin Surfaces, Documentation, and End-to-End Verification

**Files:**
- Modify: `src/app/api/categories/route.ts`
- Modify: `src/app/api/categories/[slug]/route.ts`
- Modify: `src/app/api/users/route.ts`
- Modify: `src/app/api/users/[id]/roles/route.ts`
- Modify: `src/app/users/page.tsx`
- Modify: `CLAUDE.md`
- Create: `src/lib/review/admin-capability-contract.test.ts`

**Interfaces:**
- Consumes: `hasCapability()` from Task 3.
- Produces: no new public interface.

- [ ] **Step 1: Write failing admin capability contract tests**

Create `src/lib/review/admin-capability-contract.test.ts`:

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const root = process.cwd();
const files = [
  "src/app/api/categories/route.ts",
  "src/app/api/categories/[slug]/route.ts",
  "src/app/api/users/route.ts",
  "src/app/api/users/[id]/roles/route.ts",
  "src/app/users/page.tsx",
];

test("admin surfaces use the central admin capability", () => {
  for (const file of files) {
    const source = readFileSync(join(root, file), "utf8");
    assert.match(source, /hasCapability/);
    assert.match(source, /admin:manage/);
    assert.doesNotMatch(source, /roles\??\.includes\("admin"\)/);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm exec tsx --test src/lib/review/admin-capability-contract.test.ts
```

Expected: FAIL because admin routes still contain direct `includes("admin")`
checks.

- [ ] **Step 3: Replace direct admin checks**

In each listed API/page file, import:

```ts
import { hasCapability } from "@/lib/auth/access-policy";
```

Replace:

```ts
session.user.roles?.includes("admin")
```

with:

```ts
hasCapability(session.user.roles ?? [], "admin:manage")
```

Preserve current status codes and redirects:

- APIs return `401` without a session and `403` without `admin:manage`.
- `/users` redirects unauthenticated users to sign-in and authenticated
  non-admin users to `/`.

- [ ] **Step 4: Document the effective role policy**

Update the Auth section in `CLAUDE.md` to state:

```markdown
SkillVault authorization counts only client roles from
`resource_access[AUTH_KEYCLOAK_ID].roles` and the client's dedicated flat
`roles` claim. Realm roles are ignored. When no recognized client role
(`user`, `admin`, `author`, `editor`, `reviewer`) exists, NextAuth assigns
`user` as an effective JWT/session role only; it does not mutate Keycloak or
the local users table. Page, navigation, service, and API authorization must
use `src/lib/auth/access-policy.ts`.
```

- [ ] **Step 5: Run all new focused tests**

Run:

```bash
pnpm exec tsx --test src/lib/review/role-policy.test.ts src/lib/review/auth-session-contract.test.ts src/lib/review/access-policy.test.ts src/lib/review/navigation-policy.test.ts src/lib/review/admin-capability-contract.test.ts src/lib/review/service.test.ts
```

Expected: PASS with zero failures.

- [ ] **Step 6: Run TypeScript**

Run:

```bash
pnpm exec tsc --noEmit --incremental false
```

Expected: PASS.

- [ ] **Step 7: Run the full test suite and classify only the known baseline**

Run:

```bash
pnpm test
```

Expected: every new role-policy test passes. If
`src/lib/review/api-contract.test.ts` still reports the documented
`headers() was called outside a request scope` failure from
`src/app/api/skills/route.ts`, record it as the pre-existing baseline. Stop
for any additional failure.

- [ ] **Step 8: Manually verify with Keycloak**

Use a Keycloak account with no client role on `skillvault`:

1. Sign in and confirm authentication succeeds.
2. Inspect the NextAuth session and confirm `roles` is exactly `["user"]`.
3. Confirm `/` and `/skills/{slug}` load.
4. Confirm the sidebar contains only Catalog.
5. Confirm `/publish`, `/dashboard`, `/proposals`, `/review`, `/categories`,
   `/users`, and `/skills/{slug}/edit` redirect to `/`.
6. Confirm rating a skill succeeds.
7. Confirm direct write requests to `/api/skills` and
   `/api/review-requests` return `403`.

Repeat with one account carrying each recognized client role and confirm the
role is preserved without appending `user`.

- [ ] **Step 9: Commit**

```bash
git add src/app/api/categories/route.ts "src/app/api/categories/[slug]/route.ts" src/app/api/users/route.ts "src/app/api/users/[id]/roles/route.ts" src/app/users/page.tsx CLAUDE.md src/lib/review/admin-capability-contract.test.ts
git commit -m "docs: finalize effective user role policy"
```

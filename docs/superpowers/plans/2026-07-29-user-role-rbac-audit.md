# User-Role RBAC Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the one real gap found by the `user`-role RBAC audit — `/agents/*` has no access control at any layer — by gating it behind the existing `content:manage` capability, matching "Mis Skills"/"Mis propuestas".

**Architecture:** Add one case to the existing `getPageRule()` policy function, add the corresponding path to the middleware's matcher (the actual root cause — a rule with no matcher entry never runs), and add the matching `capability` field to the nav item. All three use the exact same `content:manage` capability already defined.

**Tech Stack:** Next.js 16 middleware (`src/proxy.ts`), plain TypeScript policy module (`src/lib/auth/access-policy.ts`), `node:test` for tests.

## Global Constraints

- Skills-workflow enforcement (middleware, nav, API routes) is already fully compliant with `docs/security.md` — confirmed by audit, no changes needed there. This plan touches only the `/agents` gap.
- Reuse `content:manage` (do not introduce a new capability) — same access tier as "Mis Skills"/"Mis propuestas": `author`, `editor`, `reviewer`, `admin` allowed; `user` and anonymous visitors are not.
- Agent data is entirely client-side (`localStorage`); there is no `/api/agents` backend, so the page-route gate is the entire enforcement surface for this feature — no API-level test is needed.

---

### Task 1: Gate `/agents/*` behind `content:manage`

**Files:**
- Modify: `src/lib/auth/access-policy.ts`
- Modify: `src/proxy.ts`
- Modify: `src/components/shell/navigation.ts`
- Test: `src/lib/review/access-policy.test.ts`

**Interfaces:**
- Consumes: existing `getPageRule(pathname: string): PageRule`, `decidePageAccess(pathname, authenticated, roles): PageDecision`, `hasCapability(roles, capability): boolean` (all in `src/lib/auth/access-policy.ts`, unchanged signatures).
- Produces: `/agents` and any `/agents/...` path now resolves to `{ kind: "protected", capability: "content:manage" }` via `getPageRule`.

- [ ] **Step 1: Write the failing tests**

Add this test to `src/lib/review/access-policy.test.ts` (append to the file, using the same `decidePageAccess` import already at the top):

```ts
test("agents area requires content:manage, same tier as Mis Skills", () => {
  assert.equal(decidePageAccess("/agents", false, []), "signin");
  assert.equal(decidePageAccess("/agents", true, ["user"]), "catalog");
  assert.equal(decidePageAccess("/agents", true, ["author"]), "allow");
  assert.equal(decidePageAccess("/agents/create", true, ["user"]), "catalog");
  assert.equal(decidePageAccess("/agents/create", true, ["editor"]), "allow");
  assert.equal(decidePageAccess("/agents/chat/agent-1", true, ["user"]), "catalog");
  assert.equal(decidePageAccess("/agents/chat/agent-1", true, ["reviewer"]), "allow");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec tsx --test src/lib/review/access-policy.test.ts`
Expected: FAIL on the new test — every `/agents...` assertion currently returns `"allow"` regardless of role, because `getPageRule` falls through to its public-by-default return for any path it doesn't recognize.

- [ ] **Step 3: Add the `/agents` rule to `getPageRule`**

In `src/lib/auth/access-policy.ts`, add a case to `getPageRule` (insert it near the other `isPath(...)` checks, before the final `return { kind: "public" };`):

```ts
  if (isPath(pathname, "/agents")) {
    return { kind: "protected", capability: "content:manage" };
  }
```

The full function should now read, in order:

```ts
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
  if (isPath(pathname, "/agents")) {
    return { kind: "protected", capability: "content:manage" };
  }
  if (isPath(pathname, "/skills")) {
    return { kind: "protected", capability: "content:manage" };
  }
  return { kind: "public" };
}
```

(The new `/agents` check is placed before the `/skills` check simply to group it with the other feature-area checks — order doesn't matter functionally here since `/agents` and `/skills` prefixes never overlap.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec tsx --test src/lib/review/access-policy.test.ts`
Expected: PASS, all tests including the new one.

- [ ] **Step 5: Add `/agents/:path*` to the middleware matcher**

In `src/proxy.ts`, the exported `config.matcher` array currently reads:

```ts
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

Add `"/agents/:path*"` to this list:

```ts
export const config = {
  matcher: [
    "/publish/:path*",
    "/dashboard/:path*",
    "/proposals/:path*",
    "/review/:path*",
    "/categories/:path*",
    "/users/:path*",
    "/skills/:path*",
    "/agents/:path*",
  ],
};
```

This is the actual root cause fix: a path can have a correct `getPageRule` entry, but if it isn't in this matcher, the middleware function never runs for it at all, and the browser reaches the page unchecked.

- [ ] **Step 6: Hide the "Agentes IA" nav item from unauthorized roles**

In `src/components/shell/navigation.ts`, find the "Agentes IA" entry:

```ts
      {
        label: "Agentes IA",
        href: "/agents",
        iconPath: "M12 3l-1.912 5.813a2 2 0 01-1.275 1.275L3 12l5.813 1.912a2 2 0 011.275 1.275L12 21l1.912-5.813a2 2 0 011.275-1.275L21 12l-5.813-1.912a2 2 0 01-1.275-1.275Z",
      },
```

Add the `capability` field, matching the sibling "Mis Skills"/"Mis propuestas" entries:

```ts
      {
        label: "Agentes IA",
        href: "/agents",
        iconPath: "M12 3l-1.912 5.813a2 2 0 01-1.275 1.275L3 12l5.813 1.912a2 2 0 011.275 1.275L12 21l1.912-5.813a2 2 0 011.275-1.275L21 12l-5.813-1.912a2 2 0 01-1.275-1.275Z",
        capability: "content:manage",
      },
```

- [ ] **Step 7: Verify the full policy test file and typecheck**

Run: `pnpm exec tsx --test src/lib/review/access-policy.test.ts`
Expected: PASS (all tests, including the pre-existing ones — confirm nothing else broke)

Run: `pnpm exec tsc --noEmit`
Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add src/lib/auth/access-policy.ts src/proxy.ts src/components/shell/navigation.ts src/lib/review/access-policy.test.ts
git commit -m "fix(security): gate /agents behind content:manage capability"
```

---

### Task 2: Document the fix and final verification

**Files:**
- Modify: `docs/security.md`

**Interfaces:** none (documentation + verification only; no other task depends on this file).

- [ ] **Step 1: Add the `/agents` row to the route table**

In `docs/security.md`, find the "Detalle de Accesibilidad por Ruta" table (section 3). Add a row for `/agents`, placed after the `/proposals` row to group it with the other `content:manage`-gated routes:

```markdown
| `/agents` | Agentes IA | `content:manage` | `author`, `editor`, `reviewer`, `admin` |
```

So that section of the table reads:

```markdown
| `/dashboard` | Mis Skills | `content:manage` | `author`, `editor`, `reviewer`, `admin` |
| `/proposals` | Mis Propuestas | `content:manage` | `author`, `editor`, `reviewer`, `admin` |
| `/agents` | Agentes IA | `content:manage` | `author`, `editor`, `reviewer`, `admin` |
| `/skills/[slug]/edit`| Editar Skill | `content:manage` | `author`, `editor`, `reviewer`, `admin` |
```

- [ ] **Step 2: Run the full automated test suite**

Run: `pnpm test`
Expected: PASS (this plan doesn't touch anything in `src/lib/review/` beyond the one test file already verified in Task 1, but confirm no regression across the whole suite)

- [ ] **Step 3: Run the production build**

Run: `pnpm build`
Expected: succeeds with no errors

- [ ] **Step 4: Manual verification**

With `pnpm dev --port 3010` running (reuse an existing server on that port if one is already up), sign in as (or simulate) a `user`-role session and confirm:
- Navigating directly to `/agents` redirects to `/`
- The sidebar does not show "Agentes IA"
- Signing in as an `author`-or-higher role still shows "Agentes IA" in the sidebar and `/agents` loads normally

- [ ] **Step 5: Commit**

```bash
git add docs/security.md
git commit -m "docs(security): document /agents access control in the RBAC route table"
```

No further verification task is needed — this plan is small enough that Task 2's own steps are the final check.

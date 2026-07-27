# Keycloak SSO Logout Redirect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure NextAuth to allow redirection to the Keycloak federated logout URL upon user signout, ensuring that the Keycloak SSO session is terminated and subsequent login attempts do not conflict.

**Architecture:** Refactor `src/auth.ts` to export its configuration object (`authConfig`) as a named export before passing it to `NextAuth`. Implement a custom `redirect` callback within `authConfig` that whitelists the Keycloak issuer URL (`AUTH_KEYCLOAK_ISSUER`) while preserving safe defaults for same-origin and relative URL redirects. Write a corresponding unit test suite to verify this callback behavior.

**Tech Stack:** Next.js 16, NextAuth v5 (Auth.js), TypeScript, Node.js Test Runner (`node:test`)

## Global Constraints
- Do not introduce external dependencies.
- Keep the `redirect` callback execution edge-safe and lightweight.
- Ensure that arbitrary external domains (untrusted hosts) remain blocked.

---

### Task 1: Refactor src/auth.ts & Add redirect Callback

**Files:**
- Modify: `src/auth.ts`

**Interfaces:**
- Produces: `authConfig` object exported from `src/auth.ts` containing the NextAuth options.

- [ ] **Step 1: Refactor auth options to a separate variable `authConfig` and add the `redirect` callback**

Edit [src/auth.ts](file:///C:/Users/ianache/Desktop/DATA/01-DOCUMENTOS/02-PROYECTOS/112-skillvault/src/auth.ts) to structure the configuration as `authConfig` and implement the custom `redirect` logic.

```typescript
import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import {
  getEffectiveSkillVaultRoles,
  normalizeSkillVaultRoles,
  resolveSkillVaultJwtRoles,
} from "@/lib/auth/role-policy";

export const authConfig = {
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
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      const issuer = process.env.AUTH_KEYCLOAK_ISSUER;
      // Allow redirecting to Keycloak issuer URL
      if (issuer && url.startsWith(issuer)) {
        return url;
      }
      
      // Allow relative callback URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      // Allow same-origin redirects
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        if (urlObj.origin === baseUrlObj.origin) {
          return url;
        }
      } catch (e) {
        // Fallback to baseUrl if URL parsing fails
      }
      
      return baseUrl;
    },
    jwt({ token, user, profile, account }) {
      token.roles = resolveSkillVaultJwtRoles({
        userRoles: user && "roles" in user ? user.roles : undefined,
        profile: profile as Record<string, unknown> | undefined,
        tokenRoles: token.roles,
        clientId: process.env.AUTH_KEYCLOAK_ID,
      });
      // Needed for RP-initiated (federated) logout against Keycloak's end_session_endpoint.
      if (account?.id_token) {
        token.idToken = account.id_token;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub ?? "";
      session.user.name = token.name ?? session.user.name;
      session.user.email = token.email ?? session.user.email;
      session.user.roles = normalizeSkillVaultRoles(token.roles);
      session.idToken = token.idToken as string | undefined;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

- [ ] **Step 2: Commit changes**

Run:
```bash
git add src/auth.ts
git commit -m "refactor: export authConfig and add redirect callback for keycloak logout whitelist"
```

---

### Task 2: Create Redirect Callback Test Suite

**Files:**
- Create: `src/lib/review/redirect.test.ts`

- [ ] **Step 1: Write redirect callback tests**

Create the test file [src/lib/review/redirect.test.ts](file:///C:/Users/ianache/Desktop/DATA/01-DOCUMENTOS/02-PROYECTOS/112-skillvault/src/lib/review/redirect.test.ts):

```typescript
import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { authConfig } from "../../auth";

describe("NextAuth redirect callback", () => {
  let originalEnv: string | undefined;

  before(() => {
    originalEnv = process.env.AUTH_KEYCLOAK_ISSUER;
    process.env.AUTH_KEYCLOAK_ISSUER = "https://oauth2.qa.comsatel.com.pe/realms/Apps";
  });

  after(() => {
    process.env.AUTH_KEYCLOAK_ISSUER = originalEnv;
  });

  test("allows redirect to Keycloak issuer URL", async () => {
    const redirectCallback = authConfig.callbacks?.redirect;
    if (!redirectCallback) {
      assert.fail("redirect callback is not defined");
    }
    const targetUrl = "https://oauth2.qa.comsatel.com.pe/realms/Apps/protocol/openid-connect/logout?id_token_hint=abc";
    const result = await redirectCallback({ url: targetUrl, baseUrl: "http://localhost:3010" });
    assert.strictEqual(result, targetUrl);
  });

  test("allows relative URLs by appending to baseUrl", async () => {
    const redirectCallback = authConfig.callbacks?.redirect;
    if (!redirectCallback) {
      assert.fail("redirect callback is not defined");
    }
    const result = await redirectCallback({ url: "/dashboard", baseUrl: "http://localhost:3010" });
    assert.strictEqual(result, "http://localhost:3010/dashboard");
  });

  test("allows URLs with same origin as baseUrl", async () => {
    const redirectCallback = authConfig.callbacks?.redirect;
    if (!redirectCallback) {
      assert.fail("redirect callback is not defined");
    }
    const result = await redirectCallback({ url: "http://localhost:3010/catalog", baseUrl: "http://localhost:3010" });
    assert.strictEqual(result, "http://localhost:3010/catalog");
  });

  test("denies redirect to untrusted external domains and falls back to baseUrl", async () => {
    const redirectCallback = authConfig.callbacks?.redirect;
    if (!redirectCallback) {
      assert.fail("redirect callback is not defined");
    }
    const result = await redirectCallback({ url: "https://evil.com/logout", baseUrl: "http://localhost:3010" });
    assert.strictEqual(result, "http://localhost:3010");
  });
});
```

- [ ] **Step 2: Run the test suite and verify they pass**

Run:
```bash
pnpm test
```
Expected: All tests pass, including the new redirect callback assertions.

- [ ] **Step 3: Commit the test file**

Run:
```bash
git add src/lib/review/redirect.test.ts
git commit -m "test: add unit tests for nextauth redirect callback whitelisting"
```

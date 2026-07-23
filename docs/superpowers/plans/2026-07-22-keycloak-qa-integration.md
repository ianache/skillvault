# Keycloak QA Realm Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure application environment variables and verify NextAuth Keycloak OIDC connection targeting Comsatel QA realm `Apps` (`https://oauth2.qa.comsatel.com.pe/realms/Apps`).

**Architecture:** Update `.env` and `.env.example` configuration files to point `AUTH_KEYCLOAK_ISSUER` to the Keycloak QA realm URL while maintaining the NextAuth v5 Keycloak provider setup in `src/auth.ts`.

**Tech Stack:** Next.js 16, NextAuth v5 (`next-auth@5.0.0-beta.31`), Keycloak OIDC.

## Global Constraints

- Issuer URL must be `https://oauth2.qa.comsatel.com.pe/realms/Apps`.
- Environment variable keys `AUTH_KEYCLOAK_ISSUER`, `AUTH_KEYCLOAK_ID`, `AUTH_KEYCLOAK_SECRET` must remain consistent across `.env`, `.env.example`, and `src/auth.ts`.

---

### Task 1: Update Environment Variables (`.env` and `.env.example`)

**Files:**
- Modify: `.env:10-13`
- Modify: `.env.example:7-12`

**Interfaces:**
- Consumes: Keycloak QA Issuer URL (`https://oauth2.qa.comsatel.com.pe/realms/Apps`)
- Produces: `AUTH_KEYCLOAK_ISSUER` environment variable for `src/auth.ts`

- [ ] **Step 1: Update `.env.example` with QA Keycloak Issuer**

Update `.env.example` line 9 to specify the QA realm URL.

```ini
# ── Autenticación (next-auth + Keycloak externo) ──────────────────────────────
AUTH_SECRET=generate-with-openssl-rand-base64-32
AUTH_KEYCLOAK_ID=skillvault
AUTH_KEYCLOAK_SECRET=your-keycloak-client-secret
AUTH_KEYCLOAK_ISSUER=https://oauth2.qa.comsatel.com.pe/realms/Apps
AUTH_TRUST_HOST=true
AUTH_URL=http://localhost:3010
```

- [ ] **Step 2: Update `.env` with QA Keycloak Issuer**

Update `.env` line 12 to set `AUTH_KEYCLOAK_ISSUER`.

```ini
# ── Autenticación (next-auth + Keycloak externo) ──────────────────────────────
#AUTH_SECRET=generate-with-openssl-rand-base64-32
AUTH_SECRET=skillvault-super-secret-key-2026-change-in-prod
AUTH_KEYCLOAK_ID=skillvault
AUTH_KEYCLOAK_SECRET=PFYH3MXZlwors0hD45OmefO5NsQoSwmA
AUTH_KEYCLOAK_ISSUER=https://oauth2.qa.comsatel.com.pe/realms/Apps
```

- [ ] **Step 3: Verify `.env` and `.env.example` content**

Run: `git diff .env .env.example`
Expected: Diff shows `AUTH_KEYCLOAK_ISSUER` updated to `https://oauth2.qa.comsatel.com.pe/realms/Apps` in both files.

- [ ] **Step 4: Commit environment variable updates**

```bash
git add .env.example .env
git commit -m "config: update Keycloak issuer to QA Apps realm"
```

---

### Task 2: Validate TypeScript Compilation & Auth Configuration

**Files:**
- Modify: `src/auth.ts` (if needed for verification or lint checks)

**Interfaces:**
- Consumes: `process.env.AUTH_KEYCLOAK_ISSUER`
- Produces: Compiled NextAuth configuration

- [ ] **Step 1: Run TypeScript type check**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 2: Run linter check**

Run: `pnpm lint`
Expected: Command completes without lint errors.

- [ ] **Step 3: Commit verification status if files were touched**

```bash
git commit --allow-empty -m "test: verify auth configuration and typecheck for Keycloak QA integration"
```

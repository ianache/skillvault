# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install (portal)
pnpm install --ignore-scripts

# Dev server (SQLite by default, ./skills-vault.db)
pnpm dev --port 3010

# Build / start / lint
pnpm build
pnpm start
pnpm lint

# Tests — the ONLY test suite in the Next.js app is the review workflow
pnpm test                          # = tsx --test src/lib/review/*.test.ts
pnpm exec tsx --test src/lib/review/service.test.ts   # run a single file
pnpm exec tsx --test --test-name-pattern="admin" src/lib/review/service.test.ts  # single test

# DB bootstrap (SQLite/local dev)
pnpm tsx src/lib/db/migrate.ts
pnpm tsx src/lib/db/seed.ts

# Manual migration scripts (NOT drizzle-kit — see Database section below)
pnpm migrate:requirements
pnpm migrate:timestamps
pnpm migrate:mysql               # full from-scratch MySQL bootstrap
pnpm migrate:review-workflow
pnpm migrate:review-workflow:mysql

# CLI (separate package, not a workspace member)
cd cli && npm install -g .
cd cli && node --test            # CLI's own test suite
```

There is no test runner or lint config for the CLI beyond `node --test`; don't assume Jest/Vitest anywhere in this repo — everything uses Node's built-in `node:test` via `tsx --test`.

## Architecture

### Two independently-maintained DB schemas, one runtime driver switch

`src/lib/db/schema.ts` (SQLite/libSQL, `drizzle-orm/sqlite-core`) and `src/lib/db/schema.mysql.ts` (MySQL, `drizzle-orm/mysql-core`) define the *same* logical tables by hand, with dialect-specific column types (`text`/`integer`+`unixepoch()` vs `varchar(n)`/`bigint`+`UNIX_TIMESTAMP()`). `drizzle.config.ts` only points at the SQLite schema, so `drizzle-kit` never touches the MySQL side — **any schema change must be hand-authored in both files.**

`src/lib/db/index.ts` picks the driver at runtime purely from `DATABASE_URL`'s prefix (`mysql://`/`mysql2://` → mysql2 + `drizzle-orm/mysql2`; otherwise → `@libsql/client` + `drizzle-orm/libsql`, defaulting to local `skills-vault.db`). Both branches expose the same `{ execute, transaction, close }` client shape, and most of the app queries through this raw `client.execute(sql, args)` wrapper rather than the Drizzle query builder, specifically so the same SQL strings work against either dialect.

Migrations are **not** `drizzle-kit generate`/`migrate` — they're hand-written idempotent TS scripts (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN` wrapped in try/catch) run directly via `tsx`, always in dialect pairs (e.g. `migrate-review-workflow.ts` + `migrate-review-workflow-mysql.ts`). Local dev defaults to SQLite; production runs MySQL (see `docker-compose.yml`, `helm/skillvault/`). When adding a table, follow this pattern rather than reaching for drizzle-kit.

### Review/approval workflow (`src/lib/review/`)

The propose → review → approve/reject pipeline for publishing skills (and new versions of existing skills) lives entirely in `service.ts` (types in `types.ts`, permissions in `auth.ts`, path safety in `files.ts`):

- `createReviewRequest()` validates the submitted `SKILL.md` via `src/lib/skill-schema.ts` (Zod frontmatter schema + required Markdown H2 sections), rejects if an open request already exists for the same slug+version, and inserts a `pending` row.
- `updateReviewRequest()` is author-only and only while status is `pending`/`changes_requested` (`assertCanEditRequest`); it resets status back to `pending`.
- `decideReviewRequest()` is the authorization chokepoint: `reviewer` or `admin` role required (`canReview`), and the 4-eyes rule (`request.authorId !== actor.id`) is enforced for **every** role including `admin` — an admin can never approve their own proposal. On approve, `activateApprovedRequest()` runs inside a DB transaction (publish the skill, replace files, append a version row, mark approved) so the catalog and version history never desync.
- `POST /api/skills` never publishes directly — it always creates a review request. Public read endpoints under `src/app/api/skills/**` (search, detail, download, install, versions) require no auth at all; the actual decision endpoints live under `src/app/api/review-requests/**`.

**Role checks exist in three independent places with no shared "requireRole" abstraction** — when touching permissions, check all three:
1. `src/proxy.ts` (Next.js 16's renamed `middleware.ts` — same conventions, just relocated) — coarse route-level redirects only (`/publish` needs `editor`|`admin`, `/dashboard/categories` needs `admin`, `/dashboard/review` needs `reviewer`|`admin`). It does **not** protect the underlying API routes.
2. `src/lib/review/auth.ts` (`canReview`, `assertCanEditRequest`) — the real server-side enforcement, called from the service layer.
3. Each API route independently builds an actor via `actorFromSession()` (`src/app/api/route-utils.ts`) and passes it into the service layer.

`errorResponse()` (`route-utils.ts`) maps service-layer error message *substrings* to HTTP status codes (404/403/409/422/500) — fragile if error message text changes.

### Auth — roles come from Keycloak, not the database

`src/auth.ts` wraps NextAuth v5 with a single Keycloak provider. Keycloak puts roles in `realm_access.roles` (realm) and `resource_access[clientId].roles` (client) — never a flat `roles` claim — so `extractKeycloakRoles()` merges both, deduped. It runs in `profile()` (initial sign-in) and again in `jwt()` as a fallback on token refresh when `user` is undefined but `profile` is still present. `session()` copies `token.roles` onto `session.user.roles`, which is what every role check above reads.

There is currently **no local `users`/`roles` table** — nothing is persisted about a user beyond the JWT. If you add DB-backed authorization data, remember `src/proxy.ts` runs at the edge/middleware boundary while `auth()` calls from Server Components/Route Handlers run in the normal Node runtime — `src/lib/db`'s drivers (`@libsql/client` in file mode, `mysql2`) are not edge-safe, so wiring DB reads into `src/auth.ts` callbacks risks breaking the middleware unless you're careful about where the query actually executes.

### CLI (`cli/`) is a fully separate package

Not a workspace member of the root `package.json` — own `cli/package.json`, own deps, own `node --test` suite, own native single-executable build path (`build.js` → `--experimental-sea-config` → pkg, targeting `node22-{win,macos,linux}-x64`). It talks to the portal only through the public, unauthenticated `src/app/api/skills/**` endpoints (`cli/src/api.js`). Per-harness install path resolution (`cli/src/config.js`) is harness-specific: `cursor` uses both a different subfolder (`~/.cursor/rules`) *and* a different file extension (`.mdc` vs `.md` everywhere else); Codex respects `CODEX_HOME` if set.

### `docs/superpowers/`

Internal spec-driven-dev artifact trail, not end-user docs — each significant change pairs a `specs/*-design.md` with a `plans/*.md` (e.g. the review workflow itself, Helm QA nodeSelector fixes, Keycloak QA integration, the admin-approval-permissions fix). `docs/review-workflow.md` is the actual user-facing (Spanish) doc and should stay in sync with `src/lib/review/service.ts` if that flow changes.

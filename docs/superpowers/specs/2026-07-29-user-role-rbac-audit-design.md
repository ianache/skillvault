# `user` role RBAC audit and `/agents` access-control gap

## Problem

Confirm that the `user` role's documented restrictions in `docs/security.md`
hold in practice: access only to Catálogo (`/`), viewing skill detail,
rating, and login/logout — no ability to submit or edit skills. Fix any
gap found.

## Audit findings

Checked three independent enforcement layers (per `CLAUDE.md`'s note that
this codebase has no shared `requireRole` abstraction — role checks live in
middleware, the UI, and each API route separately) against every skill
capability in `docs/security.md`'s matrix:

- **Middleware** (`src/proxy.ts` + `src/lib/auth/access-policy.ts`):
  `getPageRule()` correctly maps `/publish` → `publish:create`, `/dashboard`
  and `/proposals` → `content:manage`, `/skills` (listing) → `content:manage`,
  `/skills/[slug]/edit` → `content:manage`, `/review` → `review:manage`,
  `/categories` and `/users` → `admin:manage`. `user` has neither
  `content:manage`, `publish:create`, `review:manage`, nor `admin:manage`, so
  all of these correctly redirect `user` to the catalog.
- **Nav UI** (`src/components/shell/navigation.ts`): "Publicar skill", "Mis
  Skills", "Mis propuestas", "Cola de revisión", "Categorías", "Usuarios y
  roles" all carry the matching `capability` field and are correctly
  filtered out of `user`'s sidebar via `getNavigationGroups()`.
- **API routes**: `POST /api/skills` (skill submission) requires
  `publish:create`; the skill-edit handler in
  `src/app/api/skills/[slug]/route.ts` requires `content:manage`; both
  correctly reject `user`. `POST /api/skills/[slug]/rating` requires only
  authentication (no additional capability), which is correct since
  `rating:write` is granted to every role including `user`.

**Result: the skills workflow is fully compliant.** No changes needed there.

**One real gap found, outside the skills workflow**: `/agents` and
`/agents/*` (Agentes IA — create/edit AI agents, assign skills, chat) has
**no access control at any layer**:
- Not in `proxy.ts`'s middleware `matcher`, so the middleware never runs
  for these paths.
- Not matched by any pattern in `getPageRule()`, so it falls through to
  the function's public-by-default return.
- The "Agentes IA" nav item has no `capability` field, so it's shown to
  every authenticated user regardless of role.

This is a content-creation feature (creating/editing agents, assigning
skills to them) — exactly the category `user` is supposed to be locked out
of — currently reachable by anyone with a session. Note: agent data is
entirely client-side (`localStorage`, no `/api/agents` backend exists), so
this is a product-consistency gap rather than a server-side data-exposure
risk — but it should still be closed since the whole point of this audit is
keeping `user` confined to catalog + rating.

## Fix

- **`src/lib/auth/access-policy.ts`**: add a rule to `getPageRule()` so any
  path matching `/agents` or `/agents/...` returns
  `{ kind: "protected", capability: "content:manage" }`, placed before the
  function's final public fallback. Reusing `content:manage` (rather than
  introducing a new capability) keeps Agents at the same access tier as
  "Mis Skills"/"Mis propuestas" — `author`, `editor`, `reviewer`, `admin`
  can access it; `user` and anonymous visitors cannot.
- **`src/proxy.ts`**: add `"/agents/:path*"` to `config.matcher`. A rule
  with no matcher entry never runs — this is the actual root cause of the
  gap, not just the missing `getPageRule` case.
- **`src/components/shell/navigation.ts`**: add `capability: "content:manage"`
  to the "Agentes IA" nav item so it's filtered out of the sidebar for
  `user` and anonymous visitors, consistent with how "Mis Skills" already
  behaves.
- **`docs/security.md`**: add a row to the route table —
  `/agents` → "Agentes IA" → `content:manage` → `author, editor, reviewer, admin`
  — so the document that defines the policy stays authoritative and in
  sync with the code.

## Testing

- Extend the existing policy test files (`src/lib/review/access-policy.test.ts`,
  `src/lib/review/page-guard-policy.test.ts`) with cases for `/agents` and
  `/agents/create`: anonymous → `signin`, `user` role → `catalog` (redirect),
  `author`/`editor`/`reviewer`/`admin` → `allow`.
- No new API test needed — there is no `/api/agents` backend; the page-route
  gate is the entire enforcement surface for this feature.
- Manual verification: confirm `/agents` redirects `user`-role sessions to
  `/`, and that the sidebar does not show "Agentes IA" for that role.

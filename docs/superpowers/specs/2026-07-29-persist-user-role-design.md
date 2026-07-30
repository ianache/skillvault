# Add `user` to assignable/persisted roles

## Problem

Two related gaps, both caused by the same root cause:

1. The "Asignar Roles" popup on `/users` ("Roles de {user}") does not offer
   `"user"` as an assignable role.
2. When a user logs in via Keycloak with none of the recognized SkillVault
   client roles, the effective `user` fallback role (already computed
   correctly by `getEffectiveSkillVaultRoles`) is silently dropped before
   it reaches the local `users` table.

## Root cause

`src/lib/users/types.ts` defines `AppRole = "admin" | "author" | "reviewer"`
and `APP_ROLES = ["admin", "author", "reviewer"]`. `"user"` was never
included. This single list drives both symptoms:

- `src/components/UsersManager.tsx` renders the "Asignar Roles" checkboxes
  and the role-filter pills by mapping over `APP_ROLES`.
- `src/lib/users/service.ts`'s `ensureUser()` filters the roles passed in
  at login (`currentRoles = keycloakRoles.filter(r => APP_ROLES.includes(r))`)
  before persisting them — so even though `src/auth.ts`'s `signIn` callback
  already passes the correctly-computed effective roles (including the
  `["user"]` fallback), `ensureUser` strips `"user"` out before the
  `INSERT`/`UPDATE`.

## Explicit reversal of a prior decision

`docs/superpowers/specs/2026-07-27-default-user-role-session-design.md`
lists as a Non-Goal: *"Persisting the effective fallback role in the local
`users` table."* This spec reverses that decision — the fallback `user`
role is now persisted to the local `users` table on login, in addition to
remaining in the session/JWT. The 2026-07-27 spec is updated to match.

## Fix

- **`src/lib/users/types.ts`**: widen `AppRole` to
  `"admin" | "author" | "reviewer" | "user"` and add `"user"` to
  `APP_ROLES`.
- **`src/components/UsersManager.tsx`**: add a `user` entry to
  `ROLE_LABELS` (`{ name: "User", description: "Acceso de solo lectura y
  calificación" }`, matching the role description already in
  `docs/security.md`'s role table). TypeScript enforces this once `AppRole`
  widens, since `ROLE_LABELS` is typed `Record<AppRole, ...>`.
- **No change needed in `src/auth.ts` or `ensureUser()`'s logic** — the
  effective-roles computation and the call site are already correct; only
  the downstream filter needed to stop excluding `"user"`.
- **`docs/superpowers/specs/2026-07-27-default-user-role-session-design.md`**:
  remove the "must not persist the fallback role" Non-Goal line and add a
  note under Goals that the fallback role is now persisted to the local
  `users` table on login, so the document doesn't contradict the actual
  (new) behavior.

## Explicitly out of scope

`"editor"` is also missing from `APP_ROLES` (same category of gap, a
different role) — not part of this request, left untouched.

## Testing

- Extend `src/lib/review/user-role-sync.test.ts` with a case: calling
  `ensureUser({ ..., keycloakRoles: ["user"] })` for a new user persists
  `roles: ["user"]` (today this input would be filtered down to `[]`).
- Manual verification: sign in with a Keycloak account that has no
  recognized SkillVault client role; confirm the local `users` row shows
  `roles: ["user"]` via the `/users` admin page, and confirm the "Asignar
  Roles" popup now shows a "User" checkbox for any user.

# Default User Role in Session Design

## Context

SkillVault authenticates users through Keycloak and copies roles from the
Keycloak profile into the NextAuth JWT and session. The current extraction
combines realm roles, client roles, and a flat `roles` claim. A successfully
authenticated user without a SkillVault client role therefore receives an
empty role list, while navigation and route authorization apply partially
duplicated rules.

SkillVault recognizes these client roles:

- `user`
- `admin`
- `author`
- `editor`
- `reviewer`

The application must give a successfully authenticated user the effective
role `user` when the Keycloak client does not provide any recognized
SkillVault role. This is an application-session fallback only: SkillVault
must not mutate Keycloak.

## Goals

- Authenticate users successfully even when they have no recognized role on
  the Keycloak SkillVault client.
- Assign `user` as the effective session role only when no recognized client
  role exists, and persist it to the local `users` table on login (see
  `docs/superpowers/specs/2026-07-29-persist-user-role-design.md`).
- Count only roles belonging to the SkillVault client; realm roles must not
  grant SkillVault permissions.
- Give `user` access to the catalog at `/`, public skill detail pages at
  `/skills/{slug}`, and authenticated skill ratings.
- Redirect an authenticated `user` to `/` when they request any page outside
  their allowed page set, including `/skills/{slug}/edit`.
- Enforce the same policy in page navigation, route protection, and APIs.

## Non-Goals

- Assigning or modifying roles through the Keycloak Admin API.
- Changing the login protocol, Keycloak provider, or logout flow.
- Redesigning the catalog, sidebar, unauthorized page, or role-management UI.
- Automatically adding `user` to sessions that already contain a recognized
  SkillVault role.

## Role Normalization

Create a pure module such as `src/lib/auth/role-policy.ts`. It has no
dependencies on NextAuth, React, or the database.

The module defines:

```ts
type SkillVaultRole = "user" | "admin" | "author" | "editor" | "reviewer";

const SKILLVAULT_ROLES: readonly SkillVaultRole[] = [
  "user",
  "admin",
  "author",
  "editor",
  "reviewer",
];
```

Role extraction reads:

1. `resource_access[clientId].roles`
2. The flat `roles` claim configured for the SkillVault client

It deliberately ignores `realm_access.roles`. Extracted values are filtered
to `SKILLVAULT_ROLES` and deduplicated.

Normalization returns:

- The recognized roles unchanged when at least one exists.
- `["user"]` when no recognized client role exists.

Unknown, absent, or malformed claims therefore fail closed to the least
privileged authenticated role.

`src/auth.ts` uses this normalization from both the Keycloak `profile()`
mapping and the JWT callback. The session callback continues copying
`token.roles` into `session.user.roles`.

## Authorization Policy

The same pure module defines typed capabilities and a role-to-capability
matrix. Consumers ask whether effective roles have a capability instead of
reimplementing role checks.

The page policy is:

| Page or operation | Allowed roles |
| --- | --- |
| `/` | Public |
| `/skills/{slug}` | Public |
| Submit a skill rating | Any authenticated role, including `user` |
| `/publish` | `editor`, `admin` |
| `/dashboard`, `/proposals` | `author`, `editor`, `reviewer`, `admin` |
| `/skills/{slug}/edit` | `author`, `editor`, `reviewer`, `admin` |
| `/review` | `reviewer`, `admin` |
| `/categories`, `/users` | `admin` |

Public read APIs remain public. APIs that create, edit, review, or administer
content must enforce the corresponding capability. Authentication without
the required capability returns `403`; missing authentication returns `401`.

## Page and Navigation Flow

1. Keycloak authenticates the user.
2. SkillVault extracts only recognized roles from the SkillVault client.
3. If none exist, SkillVault stores `["user"]` in the JWT and session.
4. `proxy.ts` checks protected page requests against the central policy.
5. An unauthenticated request for a protected page continues to the sign-in
   flow with its callback URL.
6. An authenticated request without the required capability redirects to
   `/`.
7. `AppSidebar` filters navigation items with the same capabilities. A
   fallback `user` sees only the Catalog link.

The policy must distinguish `/skills/{slug}` from
`/skills/{slug}/edit`: detail is public, while edit requires a non-`user`
content role.

## Error Handling

- Missing `clientId`: use a valid flat SkillVault `roles` claim if present;
  otherwise return `["user"]`.
- Missing or malformed `resource_access`: ignore it and continue safely.
- Non-array role claims: ignore them.
- Unknown role names: discard them.
- Realm roles, including names such as `admin`: ignore them.
- Authenticated page denial: redirect to `/` without a redirect loop.
- Authenticated API denial: return `403` JSON.
- Unauthenticated API denial: return `401` JSON.

No authentication failure is introduced solely because the user lacks a
recognized SkillVault role.

## Testing

Unit tests for the pure policy cover:

- Extraction from `resource_access[clientId].roles`.
- Extraction from the flat `roles` claim.
- Realm roles never granting SkillVault permissions.
- Empty, malformed, unknown, and unrelated claims falling back to `user`.
- Recognized roles remaining unchanged without adding `user`.
- Filtering and deduplication.
- Every page and capability in the authorization matrix.
- `/skills/{slug}` allowed and `/skills/{slug}/edit` denied for `user`.

Integration and contract tests cover:

- NextAuth profile/JWT/session propagation of the fallback role.
- Proxy redirects from `/publish`, `/dashboard`, `/proposals`, `/review`,
  `/categories`, `/users`, and skill edit pages for `user`.
- Public access to `/` and `/skills/{slug}`.
- Write APIs returning `403` for `user`.
- Rating remaining available to an authenticated `user`.
- Sidebar rendering only Catalog for `user`.

Manual verification uses a Keycloak account with no SkillVault client role:

1. Sign-in succeeds.
2. The session contains `roles: ["user"]`.
3. The catalog and skill details are accessible.
4. The sidebar shows only Catalog.
5. Direct navigation to a disallowed page returns to `/`.
6. Direct write API calls return `403`.

## Success Criteria

- A Keycloak-authenticated user without a recognized SkillVault client role
  receives exactly `["user"]` as effective session roles.
- Realm roles cannot elevate SkillVault privileges.
- Users with recognized client roles retain those roles without an implicit
  `user` addition.
- Page, sidebar, and API decisions use one shared authorization policy.
- The `user` role can browse and rate but cannot create, edit, review, or
  administer content.

# Persist User Role Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `"user"` an assignable/persisted role: it appears in the `/users` "Asignar Roles" popup, and the `user` fallback role computed at login is actually saved to the local `users` table instead of being silently filtered out.

**Architecture:** Widen the single `AppRole`/`APP_ROLES` source of truth in `src/lib/users/types.ts` to include `"user"`. Both symptoms share this one root cause — `UsersManager.tsx`'s checkboxes and `ensureUser()`'s persistence filter both derive from `APP_ROLES` — so no other logic changes are needed.

**Tech Stack:** TypeScript, `node:test` for the existing service test suite.

## Global Constraints

- This reverses an explicit Non-Goal in `docs/superpowers/specs/2026-07-27-default-user-role-session-design.md` ("must not persist the fallback role in the local `users` table") — that document must be updated to match, not left contradicting the new behavior.
- Do NOT add `"editor"` to `APP_ROLES` even though it has the same gap — out of scope for this request.
- `src/auth.ts`'s `signIn` callback and `getEffectiveSkillVaultRoles` are already correct and must not be changed — the only defect is `ensureUser()`'s downstream filter silently dropping `"user"`.

---

### Task 1: Add `"user"` to `AppRole` and wire it through the UI and persistence

**Files:**
- Modify: `src/lib/users/types.ts`
- Modify: `src/components/UsersManager.tsx`
- Modify: `docs/superpowers/specs/2026-07-27-default-user-role-session-design.md`
- Test: `src/lib/review/user-role-sync.test.ts`

**Interfaces:**
- Consumes: existing `ensureUser(user: { id, username, email, keycloakRoles? }): Promise<void>` and `listUsers(): Promise<AppUser[]>` from `src/lib/users/service.ts` (unchanged signatures).
- Produces: `AppRole` widened to `"admin" | "author" | "reviewer" | "user"`; `APP_ROLES` includes `"user"`. No new exports.

- [ ] **Step 1: Write the failing test**

Add this test to `src/lib/review/user-role-sync.test.ts` (it already imports `ensureUser` and `listUsers` from `../users/service` — reuse those, don't add a new import):

```ts
test("persists the user fallback role instead of filtering it out", async () => {
  await ensureUser({
    id: "usr-test-fallback",
    username: "fallbackuser",
    email: "fallback@skillvault.dev",
    keycloakRoles: ["user"],
  });

  const users = await listUsers();
  const created = users.find(u => u.id === "usr-test-fallback");

  assert.ok(created);
  assert.deepEqual(created.roles, ["user"]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec tsx --test src/lib/review/user-role-sync.test.ts`
Expected: FAIL — `created.roles` is currently `[]` because `ensureUser`'s `APP_ROLES.includes(r)` filter excludes `"user"` (it isn't in `APP_ROLES` yet).

- [ ] **Step 3: Widen `AppRole` and `APP_ROLES`**

Replace the contents of `src/lib/users/types.ts`:

```ts
export type AppRole = "admin" | "author" | "reviewer" | "user";

export const APP_ROLES: AppRole[] = ["admin", "author", "reviewer", "user"];

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  active: boolean;
  roles: AppRole[];
  lastLoginAt: number;
  createdAt: number;
  updatedAt: number;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec tsx --test src/lib/review/user-role-sync.test.ts`
Expected: PASS, all tests in the file including the new one and the pre-existing `"filters out roles not present in APP_ROLES"` test (which asserts `["invalid-role", "other-realm-role"]`-style garbage is still excluded — that behavior is unaffected by adding `"user"`).

- [ ] **Step 5: Add the `user` label so the UI compiles and displays correctly**

In `src/components/UsersManager.tsx`, find:

```ts
const ROLE_LABELS: Record<AppRole, { name: string; description: string }> = {
  admin: { name: "Admin", description: "Acceso total a la configuración del sistema" },
  author: { name: "Author", description: "Puede crear y editar contenido" },
  reviewer: { name: "Reviewer", description: "Puede revisar y aprobar contenido" },
};
```

Replace it with:

```ts
const ROLE_LABELS: Record<AppRole, { name: string; description: string }> = {
  admin: { name: "Admin", description: "Acceso total a la configuración del sistema" },
  author: { name: "Author", description: "Puede crear y editar contenido" },
  reviewer: { name: "Reviewer", description: "Puede revisar y aprobar contenido" },
  user: { name: "User", description: "Acceso de solo lectura y calificación" },
};
```

(TypeScript will fail to compile without this step once `AppRole` includes `"user"`, since `ROLE_LABELS` is typed `Record<AppRole, ...>` — this is not optional.)

- [ ] **Step 6: Verify the typecheck passes**

Run: `pnpm exec tsc --noEmit`
Expected: no errors (confirms Step 5 was necessary and sufficient — `UsersManager.tsx` and the roles API route both derive their allowed-values list from `APP_ROLES`/`ROLE_LABELS`, no other file references a hardcoded role list)

- [ ] **Step 7: Update the 2026-07-27 spec to match the new behavior**

In `docs/superpowers/specs/2026-07-27-default-user-role-session-design.md`, find this line in the "Non-Goals" section:

```markdown
- Persisting the effective fallback role in the local `users` table.
```

Delete that line entirely.

Then find this line in the "Goals" section:

```markdown
- Assign `user` as the effective session role only when no recognized client
  role exists.
```

Replace it with:

```markdown
- Assign `user` as the effective session role only when no recognized client
  role exists, and persist it to the local `users` table on login (see
  `docs/superpowers/specs/2026-07-29-persist-user-role-design.md`).
```

- [ ] **Step 8: Run the full test suite**

Run: `pnpm test`
Expected: PASS (all tests, including the new one and everything unrelated)

- [ ] **Step 9: Commit**

```bash
git add src/lib/users/types.ts src/components/UsersManager.tsx src/lib/review/user-role-sync.test.ts docs/superpowers/specs/2026-07-27-default-user-role-session-design.md
git commit -m "feat(users): persist and expose the user role in role assignment"
```

---

### Task 2: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Verify the "Asignar Roles" popup**

Run `pnpm dev --port 3010` (reuse an existing server on that port if one is already running). Sign in as an `admin`, go to `/users`, open "Asignar Roles" for any user, and confirm a "User" checkbox now appears alongside Admin/Author/Reviewer, with the description "Acceso de solo lectura y calificación".

- [ ] **Step 2: Verify login persistence**

If a test Keycloak account with no recognized SkillVault client role is available, sign in with it and confirm (via the `/users` list or a direct DB query) that the resulting row's `roles` column is `["user"]` rather than `[]`. If no such test account is readily available, this is acceptable to skip given Task 1's automated test already exercises `ensureUser` directly with `keycloakRoles: ["user"]` and confirms persistence — note in your summary which verification path was taken.

No commit for this task — it's verification only.

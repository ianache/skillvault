# Sincronización de Usuarios y Roles de Keycloak en Base de Datos - Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Registrar automáticamente en la base de datos local a todo usuario que inicie sesión y mantener sus roles actualizados (añadiendo o removiendo) de acuerdo a los roles de Keycloak.

**Architecture:** Añadir el callback `signIn` en `src/auth.ts` para capturar la autenticación exitosa e invocar `ensureUser()`. Modificar `ensureUser` en `src/lib/users/service.ts` para que incluya la actualización de la columna `roles` usando sentencias preparadas de base de datos SQL.

**Tech Stack:** Next.js 16 (App Router), NextAuth.js (Auth.js v5), Drizzle ORM / Client Execute SQL, SQLite (local) / MySQL (CL2 QA).

## Global Constraints

* Conservar el formateo, estructura de imports y estilo de consultas SQL existentes.
* Filtrar siempre los roles del token usando `APP_ROLES` (`author | admin | reviewer`) antes de persistirlos localmente.
* No realizar múltiples llamadas paralelas a herramientas sobre el mismo archivo.

---

### Task 1: Modificar `ensureUser` para Actualizar Roles de Usuarios Existentes

**Files:**
- Modify: `src/lib/users/service.ts`
- Test: `src/lib/review/user-role-sync.test.ts` (Se creará en Task 3)

**Interfaces:**
- Consumes: `user.keycloakRoles` en la firma de `ensureUser()`.
- Produces: Base de datos con la columna `roles` actualizada para el usuario existente.

- [ ] **Step 1: Modificar la función `ensureUser`**
  Abre `src/lib/users/service.ts` y modifica la lógica de la función para filtrar y persistir los roles también en el caso de actualización de un usuario existente.
  
  Código a actualizar:
  ```typescript
  // src/lib/users/service.ts — Línea 57-64 aprox
  const primary = existing.rows[0] as Record<string, unknown>;
  const primaryId = String(primary.id);

  // NUEVO: Se añade la columna 'roles' y su valor JSON.stringify(currentRoles) en la consulta
  await client.execute({
    sql: `UPDATE users SET id = ?, username = ?, full_name = ?, email = ?, roles = ?, last_login_at = ?, updated_at = ?
          WHERE id = ?`,
    args: [user.id, user.username, user.username, user.email, JSON.stringify(currentRoles), now, now, primaryId],
  });
  ```

- [ ] **Step 2: Verificar la correcta sintaxis y compilación**
  Ejecutar la verificación del compilador de TypeScript para asegurarse de que no haya errores de tipo:
  Run: `pnpm tsc --noEmit`
  Expected: PASS (sin errores relacionados con `src/lib/users/service.ts`).

- [ ] **Step 3: Confirmar los cambios localmente**
  ```bash
  git add src/lib/users/service.ts
  git commit -m "feat(users): update ensureUser to synchronize roles on subsequent logins"
  ```

---

### Task 2: Integrar el Callback `signIn` en NextAuth (`src/auth.ts`)

**Files:**
- Modify: `src/auth.ts`

**Interfaces:**
- Consumes: `ensureUser` desde `@/lib/users/service`.
- Produces: Callback `signIn` ejecutándose en NextAuth que gatilla el flujo de guardado/actualización automática de usuarios.

- [ ] **Step 1: Importar `ensureUser` y añadir el callback `signIn`**
  Edita `src/auth.ts` para importar `ensureUser` y añadir el callback `signIn` dentro del objeto `callbacks` de la configuración.
  
  ```typescript
  // src/auth.ts - añadir importación
  import { ensureUser } from "@/lib/users/service";
  
  // Dentro de authConfig.callbacks (en src/auth.ts):
  async signIn({ user }) {
    if (user?.id) {
      await ensureUser({
        id: user.id,
        username: user.name ?? user.email ?? user.id,
        email: user.email ?? "",
        keycloakRoles: (user as any).roles, // Roles de Keycloak ya normalizados
      });
    }
    return true; // Permitir el inicio de sesión
  }
  ```

- [ ] **Step 2: Verificar la compilación**
  Run: `pnpm tsc --noEmit`
  Expected: PASS

- [ ] **Step 3: Confirmar los cambios localmente**
  ```bash
  git add src/auth.ts
  git commit -m "feat(auth): integrate signIn callback to trigger automatic user and role synchronization"
  ```

---

### Task 3: Crear Pruebas Unitarias Automatizadas para Sincronización de Usuarios y Roles

**Files:**
- Create: `src/lib/review/user-role-sync.test.ts`

**Interfaces:**
- Consumes: `ensureUser` y `listUsers` de `@/lib/users/service`.
- Produces: Una suite de pruebas que valida de extremo a extremo el comportamiento de `ensureUser`.

- [ ] **Step 1: Crear el archivo de pruebas `src/lib/review/user-role-sync.test.ts`**
  Escribir pruebas unitarias robustas usando el módulo `node:test` para asegurar que `ensureUser` inserta usuarios nuevos con sus roles, y actualiza los roles de usuarios existentes correctamente.

  ```typescript
  import test, { describe, beforeEach } from "node:test";
  import assert from "node:assert/strict";
  import { ensureUser, listUsers } from "../users/service";
  import { client } from "../db";

  describe("User and Role Synchronization (ensureUser)", () => {
    beforeEach(async () => {
      // Limpiar tabla de usuarios antes de cada prueba en base de datos local de test
      await client.execute("DELETE FROM users;");
    });

    test("inserts new user with their roles correctly", async () => {
      await ensureUser({
        id: "usr-test-1",
        username: "testuser",
        email: "test@skillvault.dev",
        keycloakRoles: ["author"],
      });

      const users = await listUsers();
      const created = users.find(u => u.id === "usr-test-1");
      
      assert.ok(created);
      assert.strictEqual(created.username, "testuser");
      assert.strictEqual(created.email, "test@skillvault.dev");
      assert.deepEqual(created.roles, ["author"]);
    });

    test("updates roles of an existing user when they log in with new roles", async () => {
      // Registrar usuario inicialmente como 'author'
      await ensureUser({
        id: "usr-test-2",
        username: "rmedina",
        email: "rmedina@skillvault.dev",
        keycloakRoles: ["author"],
      });

      // Simular login con un nuevo set de roles ('author' y 'admin')
      await ensureUser({
        id: "usr-test-2",
        username: "rmedina",
        email: "rmedina@skillvault.dev",
        keycloakRoles: ["author", "admin"],
      });

      const users = await listUsers();
      const updated = users.find(u => u.id === "usr-test-2");

      assert.ok(updated);
      assert.deepEqual(updated.roles.sort(), ["admin", "author"]);
    });

    test("removes roles of an existing user when they lose roles in Keycloak", async () => {
      // Registrar usuario con 'admin' y 'reviewer'
      await ensureUser({
        id: "usr-test-3",
        username: "user3",
        email: "user3@skillvault.dev",
        keycloakRoles: ["admin", "reviewer"],
      });

      // Simular login habiendo perdido el rol 'admin'
      await ensureUser({
        id: "usr-test-3",
        username: "user3",
        email: "user3@skillvault.dev",
        keycloakRoles: ["reviewer"],
      });

      const users = await listUsers();
      const updated = users.find(u => u.id === "usr-test-3");

      assert.ok(updated);
      assert.deepEqual(updated.roles, ["reviewer"]);
    });
  });
  ```

- [ ] **Step 2: Ejecutar la nueva suite de pruebas**
  Correr las pruebas enfocadas para validar el comportamiento del nuevo archivo:
  Run: `npx tsx --test src/lib/review/user-role-sync.test.ts`
  Expected: PASS (todas las pruebas pasan con éxito).

- [ ] **Step 3: Confirmar los cambios localmente**
  ```bash
  git add src/lib/review/user-role-sync.test.ts
  git commit -m "test(users): add unit tests for user and role synchronization"
  ```

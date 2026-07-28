# Plan de Implementación: Resincronización Cascaded de ID de Autor de Skills y Solicitudes de Revisión

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolver la desincronización de identificadores de autor (`author_id`) propagando en cascada las actualizaciones cuando cambia el ID de Keycloak de un usuario y sanear los registros de base de datos actuales.

**Architecture:** Modificar `ensureUser` en el backend para realizar actualizaciones SQL en cascada de `skills` y `skill_review_requests` si cambia el `id` de un usuario existente. Crear un script de migración puntual para reparar registros huérfanos pre-existentes cruzando nombres de usuario/handles.

**Tech Stack:** TypeScript, SQLite (LibSQL), Next.js, tsx.

## Global Constraints

- Preservar todo el formateo, patrones de código e interfaces tipadas existentes.
- Usar consultas SQL preparadas con paso de argumentos seguro.
- Asegurar que la suite completa de pruebas continúe pasando sin regresiones.

---

### Task 1: Servidor - Sincronización en Cascada en `ensureUser`

**Files:**
- Modify: `src/lib/users/service.ts:55-64`

**Interfaces:**
- Consumes: `@/lib/db` client execute methods.
- Produces: `ensureUser` with cascading updates on ID change.

- [ ] **Step 1: Modificar `ensureUser` en `src/lib/users/service.ts`**
  Insertar la actualización de referencias secundarias en cascada dentro del bloque donde se reasocia el ID primario si este difiere del ID recibido en sesión.

```typescript
  // Prioritize the exact Keycloak ID match to avoid primary key unique constraint failures on update
  const primary = (existing.rows.find((r) => String(r.id) === user.id) || existing.rows[0]) as Record<string, unknown>;
  const primaryId = String(primary.id);

  if (primaryId !== user.id) {
    // Cascading updates for orphaned records before primary ID is mutated
    await client.execute({
      sql: "UPDATE skills SET author_id = ? WHERE author_id = ?",
      args: [user.id, primaryId],
    });
    await client.execute({
      sql: "UPDATE skill_review_requests SET author_id = ? WHERE author_id = ?",
      args: [user.id, primaryId],
    });
  }

  await client.execute({
    sql: `UPDATE users SET id = ?, username = ?, full_name = ?, email = ?, roles = ?, last_login_at = ?, updated_at = ?
          WHERE id = ?`,
    args: [user.id, user.username, user.username, user.email, JSON.stringify(currentRoles), now, now, primaryId],
  });
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/users/service.ts
git commit -m "feat(users): propagate author_id updates in cascade on Keycloak ID change"
```

---

### Task 2: Base de Datos - Script de Migración para Saneamiento Puntual

**Files:**
- Create: `src/lib/db/migrate-orphan-skills.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `@/lib/db` para saneamiento directo.
- Produces: Un comando npm ejecutable `migrate:orphan-skills`.

- [ ] **Step 1: Crear `src/lib/db/migrate-orphan-skills.ts`**
  Escribir el script de migración que reasocia todos los registros huérfanos actuales de la base de datos local.

```typescript
import { client } from "./index";

async function run() {
  console.log("🌱 Saneando e integrando IDs de autor en Skills y Solicitudes...");
  
  const usersRes = await client.execute("SELECT id, username FROM users");
  const users = usersRes.rows;

  for (const user of users) {
    const userId = String(user.id);
    const username = String(user.username);

    // Actualizar skills donde el author_handle coincide con el username, pero el author_id está huérfano o es diferente
    const skillsRes = await client.execute({
      sql: "UPDATE skills SET author_id = ? WHERE author_handle = ? AND (author_id IS NULL OR author_id != ?)",
      args: [userId, username, userId],
    });

    const requestsRes = await client.execute({
      sql: "UPDATE skill_review_requests SET author_id = ? WHERE author_handle = ? AND (author_id IS NULL OR author_id != ?)",
      args: [userId, username, userId],
    });

    console.log(`✓ Reasociados registros para handle "${username}" al ID "${userId}"`);
  }
}

run()
  .then(() => {
    console.log("✓ Saneamiento de base de datos completado con éxito.");
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ Error durante el saneamiento:", e);
    process.exit(1);
  });
```

- [ ] **Step 2: Añadir script en `package.json`**
  Modificar `package.json` para inyectar la tarea ejecutable:
```json
"migrate:orphan-skills": "tsx src/lib/db/migrate-orphan-skills.ts",
```

- [ ] **Step 3: Ejecutar migración localmente**
  Ejecutar: `pnpm run migrate:orphan-skills`
  Expected: Salida exitosa mostrando la reasociación para `"Admin SkillVault"`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db/migrate-orphan-skills.ts package.json
git commit -m "feat(db): add database migration script to reclaim orphaned skills and requests"
```

---

### Task 3: Pruebas de Calidad - Pruebas Unitarias de Sincronización en Cascada

**Files:**
- Modify: `src/lib/review/user-role-sync.test.ts`

**Interfaces:**
- Consumes: `@/lib/db` y `ensureUser()`.
- Produces: Nueva aserción de cascading.

- [ ] **Step 1: Agregar el test unitario en `src/lib/review/user-role-sync.test.ts`**
  Escribir un caso de test al final de la suite para verificar la re-asociación de claves secundarias en cascada.

```typescript
  test("cascades author_id updates on user ID change", async () => {
    // 1. Inicializar usuario con ID antiguo
    await ensureUser({
      id: "usr-test-old",
      username: "cascadetest",
      email: "cascade@skillvault.dev",
      keycloakRoles: ["author"],
    });

    // 2. Insertar skill apuntando al ID antiguo
    await client.execute({
      sql: `INSERT INTO skills (slug, name, description, type, author_id, author_handle, version, triggers, tools, compatibility)
            VALUES ('cascade-skill', 'cascade-skill', 'desc', 'code', 'usr-test-old', 'cascadetest', '1.0.0', '[]', '[]', '["claude"]')`,
    });

    // 3. Insertar solicitud de revisión apuntando al ID antiguo
    await client.execute({
      sql: `INSERT INTO skill_review_requests (slug, name, description, type, version, author_id, author_handle, raw_content, status, submitted_at, updated_at)
            VALUES ('cascade-skill', 'cascade-skill', 'desc', 'code', '1.0.0', 'usr-test-old', 'cascadetest', '', 'pending', 0, 0)`,
    });

    // 4. Actualizar usuario con ID nuevo bajo el mismo email/username
    await ensureUser({
      id: "usr-test-new",
      username: "cascadetest",
      email: "cascade@skillvault.dev",
      keycloakRoles: ["author"],
    });

    // 5. Verificar propagación
    const skillsRes = await client.execute({
      sql: "SELECT author_id FROM skills WHERE slug = 'cascade-skill'",
    });
    const requestsRes = await client.execute({
      sql: "SELECT author_id FROM skill_review_requests WHERE slug = 'cascade-skill'",
    });

    assert.strictEqual(skillsRes.rows[0].author_id, "usr-test-new");
    assert.strictEqual(requestsRes.rows[0].author_id, "usr-test-new");

    // Limpieza
    await client.execute("DELETE FROM skills WHERE slug = 'cascade-skill'");
    await client.execute("DELETE FROM skill_review_requests WHERE slug = 'cascade-skill'");
  });
```

- [ ] **Step 2: Ejecutar suite de pruebas**
  Ejecutar: `pnpm test`
  Expected: Todos los tests pasen (incluyendo el nuevo test de cascada).

- [ ] **Step 3: Commit**

```bash
git add src/lib/review/user-role-sync.test.ts
git commit -m "test(users): add unit test for cascading author_id updates"
```

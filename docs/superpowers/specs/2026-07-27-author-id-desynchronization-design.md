# Especificación de Diseño: Resincronización Cascaded de ID de Autor de Skills y Solicitudes de Revisión

Este documento describe el diseño técnico para mitigar y resolver la desincronización de identificadores de usuario (`author_id`) entre la tabla `users` (Keycloak) y las referencias secundarias en `skills` y `skill_review_requests`.

---

## 1. Contexto y Diagnóstico del Problema

El sistema de SkillVault utiliza la función `ensureUser` en `src/lib/users/service.ts` para sincronizar los perfiles de usuario locales con la sesión activa de Keycloak durante cada inicio de sesión. 

Cuando Keycloak se recrea o rota los identificadores de usuario:
1. El usuario inicia sesión (ej. `admin@skillvault.dev`).
2. Keycloak asigna un nuevo ID (ej: `"d0e2cf4d-9702-41e5-84be-af47ceb40d24"`), reemplazando al ID anterior (ej: `"0bf200a9-42f9-42f1-aedb-dcddbae4e659"`).
3. `ensureUser` detecta al usuario por username/email, y actualiza el ID de la fila en `users` al nuevo valor.
4. **Falla identificada:** Las referencias de `author_id` en las tablas `skills` y `skill_review_requests` permanecen inalteradas apuntando al ID huérfano viejo, imposibilitando que el dashboard personal filtre correctamente las pertenencias de "Mis Skills".

---

## 2. Solución Propuesta

Implementaremos dos mecanismos complementarios:

### A. Sincronización Automática en Cascada (Backend)
Modificar la función `ensureUser` de modo que, si el ID del perfil local cambia (`primaryId !== user.id`), realicemos una actualización transaccional que propague el nuevo ID a las referencias secundarias:
```sql
UPDATE skills SET author_id = ? WHERE author_id = ?;
UPDATE skill_review_requests SET author_id = ? WHERE author_id = ?;
```

### B. Script de Migración de Saneamiento de Datos (Saneamiento Puntual)
Crear un script de base de datos `src/lib/db/migrate-orphan-skills.ts` que escanee todos los skills y solicitudes de revisión huérfanas y los asocie al ID actual de `users` basado en coincidencia exacta del handle del autor (`author_handle` / `username`).

---

## 3. Arquitectura y Detalles de Implementación

### 3.1. Modificación de `ensureUser` (`src/lib/users/service.ts`)
Encapsularemos el flujo de re-asociación dentro de la misma transacción o secuencia de ejecución de `ensureUser` cuando ocurra un cambio de ID de usuario:

```typescript
// Si el ID primario ha cambiado
if (primaryId !== user.id) {
  // 1. Actualizar referencias secundarias en cascada
  await client.execute({
    sql: "UPDATE skills SET author_id = ? WHERE author_id = ?",
    args: [user.id, primaryId],
  });
  await client.execute({
    sql: "UPDATE skill_review_requests SET author_id = ? WHERE author_id = ?",
    args: [user.id, primaryId],
  });
}
```

### 3.2. Script de Migración Puntual (`src/lib/db/migrate-orphan-skills.ts`)
El script de migración realizará las siguientes operaciones de saneamiento:
1. Buscar todos los `author_id` de la tabla `skills` y `skill_review_requests` que no existan en la tabla `users` (huérfanos).
2. Para cada registro huérfano, buscar en la tabla `users` una coincidencia donde `username` sea igual a `author_handle` (o buscar por equivalencia de handles, ej. `"Admin SkillVault"`).
3. Si existe la coincidencia, actualizar `skills.author_id` y `skill_review_requests.author_id` al ID de usuario correspondiente.

```typescript
import { client } from "./index";

async function run() {
  console.log("🔍 Escaneando registros huérfanos de skills...");
  
  // Obtener usuarios válidos
  const usersRes = await client.execute("SELECT id, username FROM users");
  const users = usersRes.rows;

  for (const user of users) {
    const userId = String(user.id);
    const username = String(user.username);

    // 1. Reparar skills
    const skillsUpdated = await client.execute({
      sql: `UPDATE skills 
            SET author_id = ? 
            WHERE author_handle = ? AND (author_id IS NULL OR author_id != ?)`,
      args: [userId, username, userId],
    });

    // 2. Reparar solicitudes de revisión
    const requestsUpdated = await client.execute({
      sql: `UPDATE skill_review_requests 
            SET author_id = ? 
            WHERE author_handle = ? AND (author_id IS NULL OR author_id != ?)`,
      args: [userId, username, userId],
    });
    
    console.log(`✓ Reasociados registros para handle "${username}" al ID "${userId}"`);
  }
}
```

---

## 4. Plan de Pruebas

Para garantizar la robustez, añadiremos una prueba unitaria de extremo a extremo que valide:
1. Creación de un usuario con ID antiguo.
2. Creación de skills asignados a ese usuario con el ID antiguo.
3. Inicio de sesión del usuario con un nuevo ID de Keycloak.
4. Verificación de que `ensureUser` migra el ID del usuario en `users`, y propaga el cambio en cascada a la tabla `skills` y `skill_review_requests` de manera exitosa.

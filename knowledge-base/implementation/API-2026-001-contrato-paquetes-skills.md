---
artifact: api-design
okf: google-okf-v0.2
id: API-2026-001
title: "Contrato API: paquetes de Skills por rol"
generated: "2026-10-08T00:00:00-05:00"
verified: false
status: REQUIRES_REVIEW
sources:
  - knowledge-base/implementation/DSP-2026-001-paquetes-skills-por-rol.md
  - knowledge-base/implementation/TD-2026-001-diseno-tecnico-paquetes-skills.md
  - knowledge-base/requirements/user-stories/US-001-catalogo-de-paquetes-de-skills.md
  - knowledge-base/requirements/user-stories/US-002-consumir-paquete-publico-de-skills.md
  - knowledge-base/design/user-flows/FLW-001-mantener-paquete-skills.md
  - knowledge-base/design/user-flows/FLW-002-consumir-paquete-skills.md
  - knowledge-base/design/screens/SCR-001-catalogo-mantenimiento-paquetes.md
  - knowledge-base/design/screens/SCR-003-revision-publicacion-paquete.md
  - knowledge-base/design/screens/SCR-004-catalogo-publico-paquetes.md
  - knowledge-base/design/screens/SCR-005-detalle-paquete-publico.md
  - src/app/api/skills/route.ts
  - src/app/api/skills/[slug]/download/route.ts
  - src/lib/review/service.ts
provenance:
  created_by: api-designer/0.2.0
  method: derived-from-dsp-td-user-stories-and-existing-api-patterns
  confidence: medium
human-reviewed: false
decision_state: CANDIDATE
readiness: REQUIRES_REVIEW
---

# Contrato API: paquetes de Skills por rol

## 1. Objetivo y alcance

Este documento define un contrato HTTP candidato para `DSP-2026-001` y `TD-2026-001`. Cubre mantenimiento de paquetes, versionado, revisión/publicación, consulta pública y distribución en JSON/ZIP.

La instalación de paquetes es exclusiva del CLI. Por tanto, el API no escribe en el filesystem del usuario, no ejecuta Skills y no ofrece una operación de ejecución de paquete. El CLI consume el manifiesto o ZIP, resuelve cada Skill individualmente y aplica el rollback local definido en `TD-2026-001`.

## 2. Actores y seguridad

| Actor | Acceso candidato | Fuente |
|---|---|---|
| Público | `GET` de paquetes publicados y descargas publicadas | US-002, DSP |
| Author/editor/admin autorizado por rol de plataforma | Crear/editar borradores y solicitar revisión | `src/lib/auth/access-policy.ts` |
| Reviewer/admin | Revisar y decidir publicación | TD, patrón `src/lib/review/` |
| CLI sin login | Leer manifiesto/ZIP público | Decisión humana; comportamiento actual de `cli/src/api.js` |

La autenticación de operaciones privadas debe usar la sesión OIDC/Keycloak existente. El CLI permanece sin login para descargas públicas; no debe recibir permisos de mantenimiento por ese canal. El acceso de mantenimiento se determina únicamente por los roles/capacidades de plataforma existentes; no se consulta membresía ni capacidad de equipo.

## 2.1 Evidencia de implementación actual

- `src/auth.ts` usa el proveedor Keycloak de NextAuth y sincroniza el usuario al iniciar sesión mediante `ensureUser`.
- `src/lib/users/service.ts` persiste `id`, username, email, roles, estado y fechas en la tabla `users`; los roles efectivos se actualizan desde Keycloak en cada login.
- `src/lib/auth/role-policy.ts` normaliza los roles `user`, `admin`, `author`, `editor` y `reviewer`.
- `src/lib/auth/access-policy.ts` traduce roles a capacidades, incluida `admin:manage`.
- `src/app/api/users/route.ts` y `src/app/api/users/[id]/roles/route.ts` ya restringen la consulta y modificación de usuarios a `admin:manage`.
- `src/app/api/skills/[slug]/download/route.ts` genera actualmente un ZIP de un Skill publicado; no existe todavía manifiesto JSON ni descarga de paquetes.
- `src/app/api/skills/[slug]/install/route.ts` solo incrementa `install_count`; no realiza instalación en filesystem. La instalación real permanece en `cli/src/commands/install.js`.
- La búsqueda de `audit`, `rate`, `throttling` y captura de IP no encontró una implementación vigente. Auditoría y rate limiting son capacidades nuevas para este alcance.

### 2.2 Evidencia del CLI y resolución de destinos

La revisión del CLI actual confirma los siguientes destinos canónicos (`cli/src/config.js`):

| Harness | Destino global | Destino de proyecto/local | Extensión |
|---|---|---|---|
| `claude` | `~/.claude/skills` | `./.claude/skills` | `.md` |
| `codex` | `~/.codex/skills` o `$CODEX_HOME/skills` | `./.codex/skills` | `.md` |
| `opencode` | `~/.opencode/skills` | `./.opencode/skills` | `.md` |
| `agy` | `~/.agy/skills` | `./.agents/skills` | `.md` |
| `cursor` | `~/.cursor/rules` | `./.cursor/rules` | `.mdc` |

El CLI actual expone `--scope global|local`; en el producto, `project` es el nombre funcional para el scope local y debe mapearse a `local` mientras no se apruebe un cambio de compatibilidad del CLI. El scope `project` se resuelve desde el directorio de ejecución (`process.cwd()`), salvo que una futura opción explícita de ruta sea aprobada. Antes de escribir el primer archivo, el CLI debe mostrar la ruta resuelta y pedir confirmación del usuario.

La activación no es una operación separada del API: el instalador coloca el `SKILL.md` en la ruta del harness y la descripción/metadatos contenidos en ese archivo determinan la activación posterior por el harness o modelo.

## 3. Convenciones transversales

### 3.1 Versionado

- Prefijo de API candidato: `/api` existente; no se propone una segunda base URL.
- Las respuestas se versionan por evolución compatible del DTO y por la versión inmutable del paquete, no por mutaciones retroactivas de una versión publicada.
- Las nuevas propiedades serán aditivas y opcionales; cambios incompatibles requerirán un prefijo de versión explícito aprobado por Arquitectura.

### 3.2 Paginación y filtros

Las colecciones usan `limit` y `cursor`; `limit` debe tener un máximo definido por implementación y rechazarse si es inválido. Filtros candidatos: `q`, `role`, `status`, `version` y `mine` según el endpoint. La respuesta usa:

```json
{
  "items": [],
  "page": { "limit": 20, "nextCursor": null }
}
```

### 3.3 Idempotencia y concurrencia

- `POST` que crea paquetes, snapshots o solicitudes de revisión acepta `Idempotency-Key`.
- El servidor debe devolver la misma respuesta para reintentos con la misma clave y payload equivalente.
- `PATCH` acepta `If-Match`/`ETag` para evitar sobrescribir cambios concurrentes; el formato exacto del ETag queda pendiente.
- La publicación de una versión y la creación de su manifiesto deben ser atómicas.

### 3.4 Errores

Todos los errores de negocio usan:

```json
{
  "error": {
    "code": "PACKAGE_REFERENCE_INVALID",
    "message": "La referencia del Skill no está disponible.",
    "details": [{ "field": "items[0].skillSlug", "reason": "not_published" }],
    "traceId": "..."
  }
}
```

Códigos HTTP mínimos: `400` payload inválido, `401` no autenticado, `403` sin capacidad, `404` no encontrado/no publicado, `409` conflicto de versión o concurrencia, `412` ETag no coincide, `422` regla de dominio, `429` límite y `5xx` fallo inesperado. Los mensajes no deben revelar borradores ni existencia de recursos privados a actores no autorizados.

## 4. Recursos y DTOs

### 4.1 `PackageSummary`

```json
{
  "slug": "analista-funcional",
  "name": "Analista Funcional",
  "description": "Skills para análisis funcional.",
  "role": "analista-funcional",
  "status": "published_with_deprecated_or_retired_skills",
  "currentVersion": "1.0.0",
  "skillCount": 5,
  "retiredSkillCount": 1,
  "updatedAt": "2026-10-08T00:00:00Z"
}
```

### 4.2 `PackageDetail`

Incluye el resumen, `version`, `items`, `excludedItems`, `versionPolicy`, capacidades disponibles y metadatos de publicación. `items` solo contiene referencias canónicas; no duplica `SKILL.md` ni archivos internos.

```json
{
  "package": { "slug": "analista-funcional", "version": "1.0.0" },
  "items": [
    {
      "skillSlug": "requirements-context-builder",
      "skillName": "Requirement Context Builder",
      "versionPolicy": "pinned",
      "resolvedVersion": "1.2.0",
      "position": 1,
      "compatibility": ["claude", "codex"]
    }
  ],
  "excludedItems": [
    { "skillSlug": "legacy-skill", "reason": "retired" }
  ],
  "warnings": ["PACKAGE_CONTAINS_RETIRED_SKILLS"]
}
```

### 4.3 `PackageVersionDraft`

Para escritura acepta identidad, rol, descripción y referencias `{ skillSlug, versionPolicy, pinnedVersion?, position }`. No acepta contenido arbitrario de Skills ni una referencia que no exista en el catálogo autorizado.

## 5. Endpoints candidatos

### 5.1 Catálogo administrativo

#### `GET /api/packages`

Lista paquetes visibles para el actor autorizado.

Query: `q`, `role`, `status`, `mine`, `limit`, `cursor`.

Respuestas: `200` `PackageSummary[]`; `401/403` según alcance; `400` filtros inválidos.

#### `POST /api/packages`

Crea un borrador. Requiere actor con capacidad de mantenimiento de plataforma (`author`, `editor` o `admin`, según la política vigente). `Idempotency-Key` obligatorio para clientes de escritura.

Request:

```json
{
  "slug": "analista-funcional",
  "name": "Analista Funcional",
  "description": "Skills para análisis funcional.",
  "role": "analista-funcional",
}
```

Respuestas: `201` recurso creado; `409 PACKAGE_SLUG_EXISTS`; `422 PACKAGE_ROLE_REQUIRED`; `403 CONTENT_MANAGE_REQUIRED`.

#### `GET /api/packages/{slug}`

Devuelve detalle administrativo, incluyendo borrador y referencias en edición, solo a actores autorizados.

#### `PATCH /api/packages/{slug}`

Actualiza metadatos o composición del borrador. Requiere `If-Match`. No permite modificar una versión publicada; los cambios crean un nuevo snapshot.

#### `POST /api/packages/{slug}/versions`

Crea un snapshot candidato. Valida Skill canónico, duplicados, política `pinned/latest`, versiones publicadas y estado de referencias retiradas. Devuelve `201` con `PackageVersionDraft`.

### 5.2 Revisión y publicación

#### `POST /api/packages/{slug}/review-requests`

Envía una versión a revisión. El servicio debe reutilizar las reglas de `src/lib/review/` y bloquear la autoaprobación.

Request: `{ "version": "1.0.0", "generalComment": "..." }`.

Respuesta: `201` con `reviewRequestId`, `status: pending` y snapshot referenciado.

La API actual no soporta `resourceType`: `CreateReviewRequestInput` solo acepta `rawContent`, `files`, `skillId` y `acceptedResponsibility`, y `skill_review_requests` solo persiste `skill_id`. Por tanto, el contrato debe extenderse obligatoriamente para aceptar `resourceType: "skill" | "package"` y `resourceId` (más el identificador de versión/snapshot cuando el recurso sea un paquete). La creación, consulta, decisión y activación deben conservar el mismo flujo de revisión, pero delegar la activación en el servicio del recurso: Skills hacia `activateApprovedRequest` y paquetes hacia el servicio de publicación de `PackageVersion`. Una solicitud `package` nunca debe intentar publicar o activar un Skill individual.

### 5.3 Catálogo público

#### `GET /api/packages/public`

Lista únicamente versiones publicadas. Admite `q`, `role`, `version`, `limit` y `cursor`. No devuelve borradores, paquetes retirados ni datos privados del equipo.

#### `GET /api/packages/{slug}/public?version={semver}`

Devuelve `PackageDetail` publicado. Si no se indica versión, resuelve la versión pública vigente. Un paquete con Skills retirados permanece consultable y devuelve `warnings` y `excludedItems`.

### 5.4 Distribución

#### `GET /api/packages/{slug}/download?format=json&version={semver}`

Devuelve el manifiesto JSON canónico con `Content-Type: application/json`, `Content-Disposition` y hash de contenido.

#### `GET /api/packages/{slug}/download?format=zip&version={semver}`

Devuelve un ZIP que contiene el manifiesto JSON canónico y un archivo ZIP independiente por cada Skill instalable del paquete. No se permiten otros contenidos arbitrarios. Los Skills retirados se omiten de los ZIP internos y se describen en `excludedItems` con su motivo para mostrar la advertencia al usuario; tampoco se incluyen datos de borrador.

Headers de respuesta candidatos: `ETag`, `Digest`, `Content-Disposition`, `X-Package-Version` y `X-Trace-Id`.

No se define `POST /api/packages/{slug}/install`: la instalación ocurre localmente en el CLI y no puede ser simulada por el servidor.

## 6. Contrato CLI asociado

El comando candidato es:

```text
skillvault package install <slug> --format json|zip --version <semver|latest> --harness <harness> --scope global|local
```

El CLI debe:

1. Descargar JSON o ZIP desde el endpoint público.
2. Validar hash, esquema, compatibilidad y ausencia de Skills retirados instalables.
3. Resolver `pinned` o `latest` contra versiones publicadas.
4. Inferir `project` desde el directorio actual, mostrar la ruta resultante y solicitar confirmación antes del primer write.
5. Preparar el plan completo, incluyendo archivos existentes y conflictos, antes del primer write.
6. Informar los conflictos; solo sobreescribir tras confirmación explícita o `--force`, siguiendo el comportamiento actual del instalador individual.
7. Instalar cada Skill de forma independiente usando el instalador existente.
8. Ante incompatibilidad de un Skill, informar el motivo y solicitar al usuario continuar o abortar; no continuar silenciosamente.
9. Detenerse ante un error no resuelto y ejecutar rollback local.
10. Mostrar `runId`, Skill, versión, harness, ruta y resultado sanitizado.

El contrato exacto de rutas por harness permanece en `TD-2026-001` como bloqueo.

## 7. Seguridad y privacidad

- Aplicar OIDC/Keycloak y capacidades existentes a todo endpoint privado.
- No filtrar existencia, composición o comentarios de borradores a usuarios públicos.
- Validar `slug`, `version`, formato y contenido antes de serializar un manifiesto.
- Generar ZIP desde snapshots publicados, con paths normalizados y sin path traversal.
- Aplicar paginación y rate limiting a catálogo y descargas; no se establece límite de tamaño para esta entrega.
- Registrar `traceId`/`correlationId`, pero no secretos, tokens ni contenido completo de Skills en logs.
- La autorización de mantenimiento usa únicamente roles/capacidades de plataforma; cualquier usuario puede consultar y descargar cualquier paquete publicado.

### 7.1 Rate limiting acordado

- No se establece un límite de tamaño de archivo para esta entrega.
- Se propone limitar descargas a **10 por origen IP en una ventana móvil de 30 minutos**.
- El límite y la ventana deben ser configurables por parámetros persistidos en BD; no se implementará una pantalla UI de administración en este alcance.
- Una respuesta bloqueada debe usar `429 Too Many Requests`, incluir `Retry-After` y un código estable como `DOWNLOAD_RATE_LIMITED`.
- Registrar el origen IP recibido por el servidor de la aplicación para aplicar el límite; no se modela una lista de IP confiables ni se acepta una IP suministrada libremente por el cliente.
- El contador debe distinguir al menos `route/resource`, IP normalizada y ventana; su almacenamiento, expiración y limpieza son parte del diseño de persistencia.

## 8. Observabilidad, compatibilidad y rollout

Métricas mínimas: latencia y errores por endpoint, descargas por formato/versión, conflictos de concurrencia, referencias inválidas, versiones no disponibles y respuestas `403/404/409/422`.

El rollout debe activar primero lectura administrativa, luego snapshots/revisión, después catálogo público y finalmente descargas. La instalación CLI se habilita solo cuando los contratos de harness estén definidos y testeados.

## 9. Pruebas de contrato

- `GET /api/packages/public` no expone `draft` ni `retired`.
- `POST /api/packages` rechaza actor sin capacidad de mantenimiento de plataforma.
- `POST /api/packages/{slug}/versions` rechaza Skill inexistente, duplicado, retirado instalable o pinned no publicado.
- Publicación no muta una versión existente.
- JSON y ZIP representan el mismo manifiesto semántico.
- Descarga no incluye datos de borrador ni contenido de Skills retirados.
- `Idempotency-Key` evita duplicados ante reintentos.
- `If-Match` rechaza edición concurrente.
- Errores respetan el envelope y no filtran información privada.
- CLI prueba resolución pinned/latest, incompatibilidad de harness, fallo en mitad de instalación y rollback completo/incompleto.

## 10. Decisiones, supuestos y bloqueos

### Decisiones humanas aplicadas

- Instalación exclusivamente desde CLI.
- El paquete puede conservar propietario/equipo como dato descriptivo, pero no se usa para restringir el acceso.
- Retención operativa de instalaciones por 7 días.
- Descarga en JSON y ZIP.
- Modelo de tablas y estados de `TD-2026-001` aprobados como base.
- Usuarios y roles de la plataforma se obtienen de Keycloak y se sincronizan en la tabla `users` al autenticarse; no se requiere membresía de equipos.
- El CLI no requiere login para descargar recursos públicos.
- Las instalaciones del CLI son anónimas; sus eventos no atribuyen un usuario autenticado. Las descargas deben auditar actor (`anonymous` si no hay sesión), fecha/hora, origen IP, paquete, Skill, versión y formato.
- Auditoría de consultas/exportaciones: retención indefinida; consulta y exportación reservadas a `admin`.
- Confirmado: el conjunto mínimo de auditoría de descargas incluye actor o `anonymous`, fecha/hora, origen IP, paquete, Skill, versión, formato y resultado.
- No hay límite de tamaño de descarga; el rate limiting acordado es 10 descargas por IP cada 30 minutos, configurable en BD y sin UI de configuración en este alcance.

### Bloqueos que impiden `READY_FOR_DEV`

1. Implementar la migración y el contrato de persistencia para solicitudes de revisión polimórficas (`resourceType`/`resourceId`).
2. Implementar la delegación de aprobación de `resourceType: package` al servicio de publicación de `PackageVersion`.

## 11.1 Preguntas de cierre individualizadas — respuestas aplicadas

Para cerrar el contrato sin mezclar decisiones, las respuestas deben referirse a un único punto:

1. **Harness — incompatibilidad:** se usará el emoji `⚠️` como indicador visual de advertencia y se informará al usuario para que decida continuar o abortar.
2. **Equipos:** control omitido. Cualquier usuario puede acceder a paquetes y Skills publicados; no se valida membresía ni capacidad de equipo.
3. **Auditoría:** no se agregan datos adicionales al conjunto confirmado: actor o `anonymous`, fecha/hora, IP de origen, paquete, Skill, versión, formato y resultado.
4. **Revisión:** el API y la persistencia deben aceptar `resourceType: "package"` y `resourceType: "skill"`, con delegación de activación al servicio correspondiente.

## 11. Trazabilidad

`DSP-2026-001 → US-001/US-002 → TD-2026-001 → API-2026-001`.

UX: `FLW-001 → SCR-001/SCR-002/SCR-003` consume endpoints administrativos y de revisión; `FLW-002 → SCR-004/SCR-005` consume catálogo/detalle/descarga; `SCR-006` representa la salida del CLI y no un endpoint de instalación web.

## 12. Próximo paso

Revisión humana del contrato, especialmente los bloqueos listados. Después de aprobarlo, generar el plan de implementación y las pruebas de contrato; este documento no autoriza cambios de producción por sí mismo.

---
artifact: technical-design-context
okf: google-okf-v0.2
id: TD-2026-001
title: "Diseño técnico: paquetes de Skills por rol"
generated: "2026-10-08T00:00:00-05:00"
verified: false
status: REQUIRES_REVIEW
sources:
  - knowledge-base/implementation/DSP-2026-001-paquetes-skills-por-rol.md
  - knowledge-base/requirements/user-stories/US-001-catalogo-de-paquetes-de-skills.md
  - knowledge-base/requirements/user-stories/US-002-consumir-paquete-publico-de-skills.md
  - knowledge-base/design/ux-requirements/UXR-001-catalogo-paquetes.md
  - knowledge-base/design/ux-requirements/UXR-002-mantenimiento-paquete.md
  - knowledge-base/design/ux-requirements/UXR-003-instalacion-independiente.md
  - knowledge-base/design/ux-requirements/UXR-004-versiones-y-ejecucion.md
  - knowledge-base/design/user-flows/FLW-001-mantener-paquete-skills.md
  - knowledge-base/design/user-flows/FLW-002-consumir-paquete-skills.md
  - knowledge-base/design/screens/SCR-001-catalogo-mantenimiento-paquetes.md
  - knowledge-base/design/screens/SCR-002-editor-paquete-skills.md
  - knowledge-base/design/screens/SCR-003-revision-publicacion-paquete.md
  - knowledge-base/design/screens/SCR-004-catalogo-publico-paquetes.md
  - knowledge-base/design/screens/SCR-005-detalle-paquete-publico.md
  - knowledge-base/design/screens/SCR-006-progreso-resultado-instalacion.md
  - src/lib/db/schema.ts
  - src/lib/db/schema.mysql.ts
  - src/lib/review/service.ts
  - src/app/api/skills/route.ts
  - src/app/api/skills/[slug]/download/route.ts
  - src/app/api/skills/[slug]/install/route.ts
  - cli/src/commands/install.js
provenance:
  created_by: data-model-designer/0.2.0
  method: derived-from-dsp-existing-domain-and-ux-specifications
  confidence: medium
human-reviewed: false
decision_state: CANDIDATE
readiness: REQUIRES_REVIEW
---

# Diseño técnico: paquetes de Skills por rol

## 1. Objetivo y límites

Este diseño traduce `DSP-2026-001` a una solución implementable para `US-001` y `US-002`, reutilizando el dominio actual de Skills, revisión, versionado, descarga y CLI. No aprueba todavía el alcance: el DSP y este documento permanecen en revisión humana.

## Decisiones humanas registradas

- La instalación de paquetes será exclusiva desde el CLI; la UI web consulta, descarga y muestra instrucciones/estado, pero no modifica el filesystem local.
- El paquete puede conservar propietario/equipo como dato descriptivo, pero no se usa para restringir el acceso.
- El registro operativo de una instalación (`package_install_runs` y sus items) se retendrá durante 7 días.
- La distribución estará disponible en los dos formatos: manifiesto JSON y ZIP.
- El modelo de tablas y los estados propuestos en este documento quedan aprobados como base de implementación. La migración física, índices concretos y contrato de integración siguen sujetos a revisión técnica.
- La fuente de verdad de usuarios y roles de plataforma será Keycloak; la tabla local `users` funciona como sincronización/caché operativa. No se requiere membresía ni capacidad de equipo.
- Las instalaciones CLI son anónimas. Las descargas deben auditar actor autenticado o `anonymous`, fecha/hora, origen IP, paquete, Skill, versión y formato.

Incluye catálogo administrativo, composición y publicación de paquetes, catálogo público, manifiesto de consumo, resolución de versiones y una instalación transaccional que procesa cada Skill por separado. No incluye ejecución del paquete como unidad, modificación del contenido interno de Skills ni resolución automática de dependencias u orden de ejecución.

## 2. Contexto existente

- Persistencia dual SQLite/MySQL en `src/lib/db/schema.ts` y `src/lib/db/schema.mysql.ts`.
- `skills`, `skill_versions`, `skill_files` y `skill_version_files` ya representan Skills y sus versiones.
- El flujo de revisión usa `src/lib/review/service.ts` y las rutas de `src/app/api/review-requests/`.
- Las rutas actuales de descarga e instalación individual son `src/app/api/skills/[slug]/download/route.ts` y `src/app/api/skills/[slug]/install/route.ts`.
- `cli/src/commands/install.js` resuelve harness, scope, ruta destino, archivos adjuntos y registra la instalación.
- El catálogo y la UI existente usan el shell y tokens de SkillVault; las pantallas `SCR-001..SCR-006` son la especificación UX/UI canónica en revisión.

## 3. Modelo conceptual

### 3.1 Agregados

`Package` es el agregado raíz de mantenimiento. Una versión publicada del paquete es inmutable y contiene referencias ordenadas a versiones de Skills.

```text
Package 1 ── * PackageVersion 1 ── * PackageItem * ── 1 Skill
PackageVersion 1 ── * PackageReviewRequest
PackageVersion 1 ── * PackageInstallRun 1 ── * PackageInstallItem
```

### 3.2 Tablas candidatas

| Entidad | Campos normativos | Invariantes |
|---|---|---|
| `packages` | `id`, `slug`, `name`, `description`, `role`, `status`, `currentVersion`, `ownerTeamId` opcional para atribución, timestamps | `slug` único; `status` en `draft/published/retired`; el mantenimiento se autoriza por roles/capacidades de plataforma, sin validar membresía de equipo |
| `package_versions` | `id`, `packageId`, `version`, `releaseStatus`, `manifestJson`, `createdBy`, timestamps | combinación `packageId+version` única; versión publicada inmutable |
| `package_items` | `id`, `packageVersionId`, `skillId`, `versionPolicy`, `pinnedVersion`, `position`, `retiredAtPublish` | Skill canónico; `pinnedVersion` obligatorio si la política es `pinned`; no duplicar Skill dentro de una versión |
| `package_review_requests` | `id`, `packageVersionId`, `status`, actor/reviewer, comentarios, timestamps | publicación requiere revisión equivalente al flujo de Skills individuales |
| `package_install_runs` | `id`, `packageVersionId`, `harness`, `scope`, `requestedBy`, `status`, `failureCode`, timestamps | estados `pending/running/failed/rolled_back/succeeded`; no `succeeded` parcial |
| `package_install_items` | `id`, `runId`, `skillId`, `resolvedVersion`, `status`, `destination`, `errorCode`, timestamps | orden estable; cada item registra resultado independiente y destino del harness |

Los nombres exactos de foreign keys, índices y estrategia de migración son decisiones técnicas candidatas. La retención operativa de instalaciones sí está decidida: 7 días.

### 3.3 Estados

```text
Package: draft → pending_review → published → retired
PackageVersion: draft → pending_review → published | rejected
InstallRun: pending → running → succeeded
                       └→ failed → rolled_back
```

`published_with_deprecated_or_retired_skills` se representa como estado visual derivado cuando una versión publicada conserva referencias que fueron retiradas; los Skills retirados no entran al conjunto instalable.

### 3.4 Rutas de instalación confirmadas por el CLI

| Harness | Global | Proyecto (`project`, actualmente `local`) | Extensión |
|---|---|---|---|
| `claude` | `~/.claude/skills` | `./.claude/skills` | `.md` |
| `codex` | `~/.codex/skills` o `$CODEX_HOME/skills` | `./.codex/skills` | `.md` |
| `opencode` | `~/.opencode/skills` | `./.opencode/skills` | `.md` |
| `agy` | `~/.agy/skills` | `./.agents/skills` | `.md` |
| `cursor` | `~/.cursor/rules` | `./.cursor/rules` | `.mdc` |

El scope de proyecto se infiere desde `process.cwd()` y debe ser mostrado para confirmación antes de modificar el filesystem. La implementación puede conservar `--scope local` por compatibilidad y presentar `project` como denominación funcional. La activación posterior depende de la descripción y metadatos del `SKILL.md`; no requiere una llamada separada del API.

## 4. Diseño de servicios y contratos

### 4.1 Paquetes web

Se propone una capa `src/lib/packages/` con tipos, validación, servicio, autorización y serialización, sin duplicar reglas existentes de `src/lib/review/` ni `src/lib/skill-schema.ts`.

Rutas candidatas:

- `GET/POST /api/packages`: catálogo administrativo; creación de borrador.
- `GET/PATCH /api/packages/[slug]`: detalle y edición de borrador.
- `POST /api/packages/[slug]/versions`: crear snapshot versionado.
- `POST /api/packages/[slug]/review-requests`: enviar versión a revisión.
- `GET /api/packages/public`: catálogo público de versiones publicadas.
- `GET /api/packages/[slug]/public`: detalle público y advertencias.
- `GET /api/packages/[slug]/download?format=json`: manifiesto JSON de la versión publicada.
- `GET /api/packages/[slug]/download?format=zip`: ZIP con el manifiesto y un ZIP independiente por cada Skill instalable de la versión publicada.

Las rutas deben reutilizar `actorFromSession`, capacidades existentes y el patrón de respuestas de las rutas de revisión. Las referencias de Skills se validan contra Skills publicados y versiones existentes antes de guardar o enviar a revisión.

### 4.2 Manifiesto de consumo

El manifiesto publicado debe contener únicamente datos necesarios para resolver la instalación:

```json
{
  "package": "rol-ejemplo",
  "version": "1.0.0",
  "items": [
    { "slug": "skill-a", "versionPolicy": "pinned", "version": "2.1.0" },
    { "slug": "skill-b", "versionPolicy": "latest" }
  ]
}
```

Los Skills retirados se incluyen solo como referencias excluidas y motivo de advertencia, nunca como unidades instalables. El contrato debe evitar que un cliente convierta una referencia `latest` en una versión no publicada.

El JSON es el contrato canónico; el ZIP es una distribución empaquetada que debe contener ese mismo JSON y no puede alterar su semántica. Ambos formatos deben identificar `package`, `version`, `generatedAt`, `items` y `excludedItems`.

### 4.3 CLI e instalación transaccional

Se propone añadir un comando `skillvault package install <slug>` que:

1. Obtiene el manifiesto publicado y valida `harness`, `scope` y política de versión.
2. Resuelve cada Skill a una versión publicada y prepara un plan sin escribir archivos, incluyendo conflictos existentes.
3. Para `project`, infiere el destino desde `process.cwd()`, lo muestra y solicita confirmación.
4. Informa los archivos existentes y solo los sobreescribe tras confirmación explícita o `--force`.
5. Ante incompatibilidad de un Skill, informa el motivo y solicita continuar o abortar.
6. Instala cada Skill reutilizando la resolución existente de `cli/src/commands/install.js`.
7. Registra cada resultado en `package_install_items`.
8. Ante un fallo no resuelto, detiene la secuencia y revierte únicamente los archivos creados o reemplazados por esa ejecución.
9. Marca `rolled_back` si la reversión completa; si no puede completarla, marca `failed` con evidencia y no reporta éxito.

La UI web no debe fingir control sobre el filesystem local. La forma final de mostrar progreso en `SCR-006` queda bloqueada hasta decidir si el progreso proviene del CLI, de un agente local o de un canal de eventos autorizado.

## 5. Auditoría, publicación y versionado

- La publicación de una versión de paquete debe pasar por la misma separación author/reviewer/admin usada por Skills.
- El snapshot publicado debe conservar las referencias exactas y la política de versión.
- Los cambios posteriores crean una nueva versión; no mutan una versión publicada.
- Las acciones de crear, editar, enviar a revisión, aprobar, rechazar, publicar, retirar, descargar e instalar deben producir eventos auditables con actor, timestamp, objeto, versión y resultado. En instalaciones anónimas el actor es `anonymous`; las descargas agregan origen IP, formato y Skill/paquete descargado.
- No se debe publicar un paquete con referencias inexistentes, Skills no publicados o `pinnedVersion` no disponible.

### 5.1 Enfoque recomendado para auditoría

Se recomienda separar el estado operativo de instalación, retenido 7 días, del registro de auditoría de gobierno. La auditoría debe ser append-only y registrar como mínimo:

 - `eventId`, `occurredAt`, `actorId` o `anonymous`, acción y resultado.
- Tipo e identificador del objeto (`package`, `package_version`, `package_install_run` o `package_install_item`).
- Versión, correlación (`correlationId`/`runId`), resultado y código de error normalizado.
- Antes/después resumido para cambios de composición, sin guardar secretos ni el contenido completo de los Skills.
- Hash del manifiesto publicado o descargado para poder probar integridad sin duplicar contenido sensible.

Buenas prácticas: usar reloj UTC en persistencia, idempotencia por `eventId`, índices por objeto/actor/fecha, acceso de solo lectura para consumidores de auditoría, protección contra edición/borrado, exportación controlada y alertas para publicación, retiro, fallos repetidos y rollback incompleto. La consulta y exportación quedan reservadas a `admin` y la retención de auditoría es indefinida. La implementación debe persistir únicamente los campos confirmados, sin agregar datos adicionales.

## 6. Seguridad, permisos y consistencia

- Catálogo público: lectura únicamente de versiones publicadas.
 - Mantenimiento: usuarios con roles/capacidades de plataforma autorizados (`author`, `editor` o `admin`, según la política vigente); no se valida membresía de equipo. Cualquier usuario puede consultar y descargar paquetes publicados.
- Revisión: reutilizar las capacidades de reviewer/admin; impedir autoaprobación.
- Descarga: no exponer contenido de borradores ni archivos de Skills retirados.
- Instalación: validar manifest, path de harness y destino antes de modificar filesystem; impedir path traversal.
- Publicación y creación de snapshots requieren transacción; instalación requiere compensación explícita porque cruza red, filesystem y base de datos.

## 7. Observabilidad y fallos

Cada instalación debe correlacionar `runId`, `packageVersionId`, `skillId`, `harness`, `scope`, destino, duración y error sanitizado. Los logs no deben incluir secretos ni contenido completo de Skills.

Casos obligatorios: manifiesto inválido, Skill retirado, versión inexistente, harness incompatible, ruta no escribible, archivo ya existente, fallo de red, fallo durante rollback y cancelación del usuario antes del primer write.

## 8. Implementación de UI

La implementación debe mapear `SCR-001..SCR-006` a rutas y componentes reutilizables del conjunto `CMP-001`, usando tokens semánticos existentes. La UI debe cubrir loading, empty, error, disabled, permisos insuficientes, advertencia de retirados, política de versión y resultado de rollback. No se considera aprobada por el hecho de renderizar; requiere revisión UX/PO y evidencia WCAG 2.2 AA.

## 9. Pruebas y gates

- Unitarias: validación de manifest, estados, version policy, deduplicación, permisos y cálculo de Skills instalables.
- Integración: migraciones SQLite/MySQL, CRUD, revisión/publicación, catálogo público y descarga.
- CLI: harness/path por cada harness soportado, instalación de adjuntos, conflicto de archivos, rollback completo e incompleto.
- Contrato: rutas `/api/packages`, manifiesto y errores estables.
- UI: smoke tests de navegación, estados y accesibilidad básica de `SCR-001..SCR-006`.
 - Gate: no marcar `READY_FOR_DEV` hasta resolver las preguntas de progreso local, copy de rollback y diseño de migración.

## 10. Rollout y rollback técnico

1. Migrar tablas nuevas sin activar rutas públicas.
2. Activar lectura de paquetes en modo controlado.
3. Activar mantenimiento y revisión para un grupo autorizado.
4. Activar descarga pública.
5. Activar instalación CLI detrás de una capacidad/configuración explícita.
6. Habilitar UI de progreso cuando exista un canal verificado.

El rollback de aplicación desactiva las rutas y el comando de paquetes; no elimina datos publicados. Las migraciones deben ser reversibles o contar con procedimiento de restauración aprobado.

## 11. Preguntas abiertas y bloqueos

1. **Auditoría:** implementar el esquema de los campos confirmados sin agregar datos adicionales; la retención indefinida y el acceso exclusivo de `admin` están decididos.
2. **Revisión polimórfica:** migrar `skill_review_requests` para aceptar `resourceType: "package" | "skill"` y `resourceId`, delegando la aprobación de paquetes al servicio de publicación de versiones.

Mientras estas tareas técnicas no estén implementadas y verificadas, el diseño permanece `REQUIRES_REVIEW` y no habilita implementación completa.

## 12. Trazabilidad

`DSP-2026-001 → US-001/US-002 → UXR-001..UXR-004 → FLW-001/FLW-002 → SCR-001..SCR-006 → CMP-001 → TD-2026-001`.

## 13. Próximo paso

Revisión humana del modelo, contratos, responsabilidades de instalación y preguntas abiertas. Después de la aprobación, generar el plan de implementación por fases y sus pruebas antes de modificar código.

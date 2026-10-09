---
artifact: implementation-plan
okf: google-okf-v0.2
id: PLN-2026-001
title: "Plan de implementación: paquetes de Skills por rol"
generated:
  by: "superpowers:writing-plans/6.4.2"
  at: "2026-10-08T00:00:00-05:00"
verified: false
status: draft
sources:
  - knowledge-base/implementation/IMP-2026-001-diseno-implementacion-paquetes-skills.md
  - knowledge-base/implementation/DSP-2026-001-paquetes-skills-por-rol.md
  - knowledge-base/implementation/TD-2026-001-diseno-tecnico-paquetes-skills.md
  - knowledge-base/implementation/API-2026-001-contrato-paquetes-skills.md
  - knowledge-base/requirements/user-stories/US-001-catalogo-de-paquetes-de-skills.md
  - knowledge-base/requirements/user-stories/US-002-consumir-paquete-publico-de-skills.md
human-reviewed: false
decision_state: CANDIDATE
---

# Paquetes de Skills por rol — Plan de implementación

> **Para agentes de implementación:** usar `superpowers:subagent-driven-development` o `superpowers:executing-plans` y ejecutar las tareas en orden. Cada tarea termina con una verificación independiente.

**Objetivo:** implementar el mantenimiento, revisión, publicación, consulta, descarga JSON/ZIP e instalación CLI de paquetes versionados de Skills, conforme a `IMP-2026-001`.

**Arquitectura:** agregar una capa `src/lib/packages/` sobre el acceso SQL existente, con snapshots inmutables, serialización canónica y rutas Next.js. Extender el flujo de revisión actual para distinguir `resourceType: skill | package`; la aprobación de paquetes publicará únicamente el snapshot de paquete. El CLI consumirá exclusivamente recursos públicos y reutilizará la resolución de rutas de harnesses existente.

**Stack:** Next.js 16, TypeScript, Drizzle/libSQL, MySQL, SQLite/MySQL migrations, Node.js CLI ESM, `jszip`, `tsx --test`.

**Especificación:** `knowledge-base/implementation/IMP-2026-001-diseno-implementacion-paquetes-skills.md`

## Restricciones globales

- La instalación de paquetes ocurre exclusivamente mediante `skillvault package install`.
- Cualquier usuario puede consultar y descargar paquetes publicados; no se valida membresía de equipo.
- El mantenimiento privado reutiliza las capacidades/roles de plataforma existentes.
- Las versiones publicadas son inmutables; los cambios generan nuevos snapshots.
- El manifiesto JSON es canónico; el ZIP contiene ese manifiesto y un ZIP independiente por cada Skill instalable.
- Skills retirados se excluyen del conjunto instalable y se reportan en `excludedItems` con advertencia `⚠️`.
- No se implementará una pantalla web que pretenda controlar el filesystem local ni un endpoint web de instalación.
- Rate limit: 10 descargas por IP en ventana móvil de 30 minutos, configurable en BD, con `429`, `Retry-After` y `DOWNLOAD_RATE_LIMITED`.
- Las auditorías de consultas/exportaciones son indefinidas y solo consultables/exportables por `admin`; los registros operativos de instalación se retienen 7 días.
- No se agregan campos de auditoría más allá de los confirmados por las decisiones humanas.
- Todas las pruebas nuevas deben ejecutarse antes de modificar el comportamiento productivo (TDD).

## Puntos de revisión prioritarios

- Un ZIP nunca debe incluir borradores, Skills retirados ni rutas con path traversal.
- Una solicitud `resourceType: package` nunca debe activar/publicar un Skill individual.
- `latest` solo puede resolver una versión publicada y el paquete publicado no puede mutar.
- Un fallo después de iniciar la instalación debe revertir los archivos modificados por esa ejecución y distinguir rollback completo/incompleto.
- El scope `project` debe resolverse desde `process.cwd()` y mostrar el destino antes del primer write.

## Mapa de archivos

- Crear `src/lib/packages/types.ts`: tipos de dominio, manifiesto, filtros, estados y DTOs.
- Crear `src/lib/packages/validation.ts`: validación de slug, semver, políticas `pinned/latest`, composición y manifiesto.
- Crear `src/lib/packages/service.ts`: CRUD de paquetes, snapshots, resolución de Skills publicados y estados.
- Crear `src/lib/packages/serializer.ts`: JSON canónico y ZIP seguro mediante `jszip`.
- Crear `src/lib/packages/access.ts`: autorización de mantenimiento y lectura pública.
- Crear `src/lib/packages/download-audit.ts`: auditoría de descargas y rate limiting configurable.
- Modificar `src/lib/db/schema.ts` y `src/lib/db/schema.mysql.ts`: tablas de paquetes, revisión polimórfica, instalación y auditoría/rate limit.
- Crear `src/lib/db/migrate-packages.ts` y `src/lib/db/migrate-packages-mysql.ts`: migraciones idempotentes.
- Modificar `src/lib/review/types.ts`, `src/lib/review/service.ts` y rutas de revisión: `resourceType/resourceId` y delegación de activación.
- Crear rutas bajo `src/app/api/packages/`: catálogo administrativo, detalle, versiones, revisión, catálogo público y descargas.
- Crear componentes/páginas bajo `src/app/packages/` y `src/components/packages/`: SCR-001..SCR-005; SCR-006 queda como salida CLI.
- Modificar `cli/src/api.js`, `cli/src/config.js`, `cli/src/commands/install.js`, `cli/bin/skillvault.js`; crear `cli/src/commands/package-install.js` y módulos de plan/rollback.
- Crear pruebas junto a cada módulo: `src/lib/packages/*.test.ts`, rutas API, revisión y `cli/test/package-install.test.js`.

### Tarea 1: Modelo de datos y migraciones

**Archivos:** modificar `src/lib/db/schema.ts`, `src/lib/db/schema.mysql.ts`, `package.json`; crear `src/lib/db/migrate-packages.ts`, `src/lib/db/migrate-packages-mysql.ts` y pruebas de migración.

- [ ] Escribir pruebas que creen migraciones sobre SQLite y MySQL-compatible y verifiquen `packages`, `package_versions`, `package_items`, `package_install_runs`, `package_install_items`, auditoría y rate limit; comprobar índices, unicidad y estados.
- [ ] Ejecutar las pruebas y confirmar que fallan por tablas/columnas ausentes.
- [ ] Implementar el esquema con los campos normativos de `TD-2026-001`, estados validados, unicidad `package_id + version`, orden de items y retención operativa representable por timestamp.
- [ ] Implementar migraciones idempotentes para SQLite/libSQL y MySQL, incluyendo índices para slug, estado, versión, IP normalizada/ventana y auditoría.
- [ ] Registrar scripts `migrate:packages` y `migrate:packages:mysql` y ejecutar las pruebas de migración.

### Tarea 2: Dominio, validación y serialización

**Archivos:** crear `src/lib/packages/types.ts`, `validation.ts`, `service.ts`, `serializer.ts`, `access.ts`, y sus pruebas.

- [ ] Probar creación de borrador, edición con `If-Match`, snapshot, deduplicación, `pinned/latest`, rechazo de Skill no publicado/retirado y publicación inmutable.
- [ ] Probar que el manifiesto publicado contiene `package`, `version`, `generatedAt`, `items` y `excludedItems`, omite Skills retirados y normaliza paths.
- [ ] Probar equivalencia semántica JSON/ZIP y rechazo de path traversal, contenido arbitrario o referencias a borradores.
- [ ] Implementar servicios y firmas que consuman `ReviewDatabaseClient`/cliente DB existente sin introducir un segundo acceso a datos.
- [ ] Ejecutar `pnpm exec tsx --test src/lib/packages/*.test.ts` y dejar todos los casos en verde.

### Tarea 3: Flujo de revisión polimórfico y publicación

**Archivos:** modificar `src/lib/review/types.ts`, `src/lib/review/service.ts`, `src/lib/db/schema.ts`, `src/lib/db/schema.mysql.ts`, migraciones de revisión y rutas de revisión; crear pruebas de contrato.

- [ ] Escribir pruebas para aceptar `resourceType: "skill" | "package"`, `resourceId` y snapshot/version de paquete; rechazar tipos o referencias inválidas.
- [ ] Probar aprobación de `skill` con el comportamiento actual y aprobación de `package` delegada al publicador de `PackageVersion`, sin mutar/activar `skills` individual.
- [ ] Probar autoaprobación, comentarios obligatorios y transacción/rollback del flujo existente.
- [ ] Implementar la extensión de persistencia y DTOs, manteniendo compatibilidad de solicitudes individuales existentes.
- [ ] Ejecutar `pnpm exec tsx --test src/lib/review/*.test.ts`.

### Tarea 4: API administrativa, pública y descargas

**Archivos:** crear rutas `src/app/api/packages/route.ts`, `[slug]/route.ts`, `[slug]/versions/route.ts`, `[slug]/review-requests/route.ts`, `public/route.ts`, `[slug]/public/route.ts`, `[slug]/download/route.ts`; crear pruebas de contrato.

- [ ] Probar capacidades para catálogo administrativo, `Idempotency-Key`, `If-Match`, paginación/filtros y envelopes `401/403/404/409/422`.
- [ ] Probar catálogo/detalle público sin drafts/retired, advertencias por Skills retirados y resolución de versión vigente o semver solicitado.
- [ ] Probar descargas JSON/ZIP, headers `Content-Disposition`, `ETag`/hash, `X-Package-Version`, equivalencia manifiesto y exclusión de contenido no permitido.
- [ ] Implementar rutas reutilizando `auth`, `actorFromSession`, capacidades existentes y `client`; no crear `/install` web.
- [ ] Ejecutar las pruebas API existentes y nuevas, además de `pnpm lint`.

### Tarea 5: Auditoría de descargas y rate limiting

**Archivos:** crear `src/lib/packages/download-audit.ts`, modificar rutas de descarga y esquema/migraciones; crear pruebas.

- [ ] Probar actor autenticado/anónimo, IP de origen normalizada, paquete/Skill, versión, formato, resultado, ventana configurable y respuesta `429` con `Retry-After`.
- [ ] Probar que no se confía en una IP suministrada libremente por el cliente y que la consulta/exportación de auditoría exige `admin`.
- [ ] Implementar persistencia append-only con solo los campos confirmados; mantener la retención indefinida de auditoría y separar registros operativos de instalación de 7 días.
- [ ] Ejecutar pruebas de seguridad y contrato de descarga.

### Tarea 6: CLI de instalación de paquetes

**Archivos:** crear `cli/src/commands/package-install.js`, módulos de manifest/plan/rollback si son necesarios y pruebas; modificar `cli/src/api.js`, `cli/src/config.js`, `cli/src/commands/install.js`, `cli/bin/skillvault.js`.

- [ ] Probar parseo de `skillvault package install <slug> --format json|zip --version <semver|latest> --harness <harness> --scope global|local`, resolución de `CODEX_HOME`, scope proyecto desde `process.cwd()` y confirmación antes del primer write.
- [ ] Probar los cinco harnesses y sus rutas/extensiones confirmadas; validar compatibilidad, Skills excluidos, conflictos, `--force`, fallo de red y cancelación.
- [ ] Probar instalación independiente de cada Skill, instalación de adjuntos, rollback completo y rollback incompleto, sin reportar éxito parcial.
- [ ] Implementar consumo anónimo del API público, validación del manifiesto/hash, plan previo de archivos y reutilización de la lógica individual sin duplicar resolución de destinos.
- [ ] Ejecutar `npm test` dentro de `cli/` y verificar manualmente el texto de ayuda.

### Tarea 7: UI de mantenimiento y catálogo público

**Archivos:** crear páginas/componentes bajo `src/app/packages/` y `src/components/packages/`; modificar navegación y pruebas de smoke.

- [ ] Escribir smoke tests de rutas y estados para SCR-001..SCR-005: loading, empty, error, permisos, edición, revisión, advertencia de retirados y descarga.
- [ ] Implementar catálogo/edición administrativa, composición ordenada, revisión/publicación y catálogo/detalle público usando APIs de Tarea 4 y tokens semánticos existentes.
- [ ] Mostrar que la descarga instala mediante CLI; no presentar un botón web como instalación local.
- [ ] Mantener SCR-006 como contrato de salida CLI hasta que exista un canal local autorizado; no inventar progreso remoto.
- [ ] Ejecutar smoke tests, `pnpm lint` y verificación básica de teclado/labels conforme a WCAG 2.2 AA.

### Tarea 8: Integración, retención y rollout

**Archivos:** modificar `package.json`, documentación de implementación/operación bajo `knowledge-base/implementation/` y pruebas end-to-end disponibles.

- [ ] Probar el orden de rollout: migraciones, lectura administrativa, snapshots/revisión, catálogo público, descarga y CLI.
- [ ] Probar limpieza/consulta de registros operativos a 7 días sin eliminar auditoría indefinida.
- [ ] Ejecutar `pnpm test`, `pnpm lint`, `pnpm build` y `npm test` en `cli/`.
- [ ] Actualizar documentación de operación con comandos de migración, configuración de rate limit y rollback técnico.
- [ ] Ejecutar `graphify update .`, revisar `git diff` y confirmar que ningún artefacto generado salió de `knowledge-base/`.

## Autorrevisión del plan

- La especificación queda cubierta por tareas 1–8: datos, revisión, servicios, API, auditoría, CLI, UI, pruebas y rollout.
- Se conserva como límite explícito la ausencia de ejecución de paquetes, dependencias automáticas, UI de auditoría y progreso remoto del CLI.
- Los tipos y contratos se comparten mediante `src/lib/packages/types.ts` y los tipos de revisión extendidos antes de implementar rutas.
- Los cinco riesgos del apartado “Puntos de revisión prioritarios” tienen pruebas asignadas en las tareas 2, 3, 4, 5 y 6.
- El plan no cambia `verified` ni `human-reviewed`; ambos permanecen pendientes del flujo humano.

## Gate

Este plan es candidato y no autoriza todavía cambios de código. Requiere revisión humana antes de elegir el modo de ejecución (`subagent-driven-development` o `executing-plans`) y comenzar TDD.

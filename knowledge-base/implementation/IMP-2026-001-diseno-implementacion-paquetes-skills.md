---
artifact: implementation-design-spec
okf: google-okf-v0.2
id: IMP-2026-001
title: "Diseño de implementación: paquetes de Skills por rol"
generated:
  by: "superpowers:brainstorming/6.4.2"
  at: "2026-10-08T00:00:00-05:00"
verified: false
status: draft
sources:
  - knowledge-base/implementation/DSP-2026-001-paquetes-skills-por-rol.md
  - knowledge-base/implementation/TD-2026-001-diseno-tecnico-paquetes-skills.md
  - knowledge-base/implementation/API-2026-001-contrato-paquetes-skills.md
  - knowledge-base/requirements/user-stories/US-001-catalogo-de-paquetes-de-skills.md
  - knowledge-base/requirements/user-stories/US-002-consumir-paquete-publico-de-skills.md
  - knowledge-base/design/screens/SCR-001-catalogo-mantenimiento-paquetes.md
  - knowledge-base/design/screens/SCR-002-editor-paquete-skills.md
  - knowledge-base/design/screens/SCR-003-revision-publicacion-paquete.md
  - knowledge-base/design/screens/SCR-004-catalogo-publico-paquetes.md
  - knowledge-base/design/screens/SCR-005-detalle-paquete-publico.md
  - knowledge-base/design/screens/SCR-006-progreso-resultado-instalacion.md
human-reviewed: false
decision_state: CANDIDATE
---

# IMP-2026-001 — Diseño de implementación: paquetes de Skills por rol

## 1. Objetivo

Implementar `US-001` y `US-002` en SkillVault, habilitando el mantenimiento, revisión, publicación, consulta, descarga e instalación CLI de paquetes de Skills, conservando la instalación independiente de cada Skill.

## 2. Decisiones humanas incorporadas

- La instalación de paquetes ocurre exclusivamente desde el CLI.
- El catálogo publicado y sus descargas son accesibles para cualquier usuario; no se valida membresía ni capacidad de equipo.
- El mantenimiento privado continúa protegido por roles/capacidades de plataforma existentes.
- La distribución ofrece JSON y ZIP. El ZIP contiene el JSON de metadatos y un ZIP por Skill instalable.
- Los Skills retirados se omiten del contenido instalable y generan advertencia visual.
- Ante incompatibilidad se muestra `⚠️` y el usuario decide entre continuar sin el Skill o abortar.
- Las instalaciones CLI son anónimas.
- La auditoría no incorpora datos adicionales: actor o `anonymous`, fecha/hora, IP de origen, paquete, Skill, versión, formato y resultado.
- La auditoría de consultas/exportaciones se retiene indefinidamente y queda reservada a `admin`; los registros operativos de instalación se retienen 7 días.
- El flujo de revisión acepta `resourceType: "skill" | "package"` y delega la activación en el servicio correspondiente.
- El resultado permanece en exploración UX/UI pendiente de revisión humana; no se fabrica aprobación gobernada.

## 3. Arquitectura de implementación

### 3.1 Capa de dominio y persistencia

Crear el agregado `Package` con versiones inmutables y referencias ordenadas a Skills publicados. Implementar las tablas aprobadas en `TD-2026-001`: `packages`, `package_versions`, `package_items`, `package_review_requests`, `package_install_runs` y `package_install_items`.

La pertenencia o equipo puede conservarse como dato descriptivo, pero no participa en autorización. Las reglas de acceso de mantenimiento reutilizan las capacidades existentes de SkillVault.

### 3.2 Revisión polimórfica

Extender `skill_review_requests` y sus tipos para aceptar `resourceType` (`skill` o `package`) y `resourceId`, además del snapshot/versionado de paquete cuando aplique. La decisión de una solicitud `package` debe invocar el servicio de publicación de `PackageVersion`; nunca debe ejecutar la activación de un Skill individual.

### 3.3 API y distribución

Implementar los endpoints de `API-2026-001` para catálogo administrativo, snapshots, revisión, catálogo público y descargas. Las respuestas públicas solo exponen versiones publicadas.

El serializador JSON será la representación canónica. El serializador ZIP incluirá únicamente el manifiesto y un ZIP independiente por cada Skill instalable, con paths normalizados y protección contra path traversal.

### 3.4 CLI

Implementar `skillvault package install` reutilizando la resolución existente de harnesses:

- `claude`: `~/.claude/skills` / `./.claude/skills`.
- `codex`: `~/.codex/skills` o `$CODEX_HOME/skills` / `./.codex/skills`.
- `opencode`: `~/.opencode/skills` / `./.opencode/skills`.
- `agy`: `~/.agy/skills` / `./.agents/skills`.
- `cursor`: `~/.cursor/rules` / `./.cursor/rules`.

El scope funcional `project` conserva compatibilidad con el flag actual `local` y se infiere desde `process.cwd()`. El CLI muestra la ruta antes de escribir y solicita confirmación. Los conflictos existentes requieren confirmación o `--force`. Cada Skill se procesa independientemente; los fallos no resueltos detienen y activan rollback.

### 3.5 Auditoría y límites

Separar los registros operativos de instalación de la auditoría de gobierno. Implementar auditoría append-only con los campos confirmados, sin datos adicionales. Aplicar límite configurable de 10 descargas por IP en una ventana móvil de 30 minutos, sin pantalla UI de configuración en este alcance y sin límite de tamaño de descarga.

## 4. Estrategia de pruebas

- Pruebas de migración SQLite/MySQL para las nuevas tablas y la revisión polimórfica.
- Pruebas de contrato API para permisos, estados, `resourceType`, JSON/ZIP, errores, paginación, idempotencia y ETag.
- Pruebas de integración para publicación inmutable, Skills retirados y auditoría.
- Pruebas CLI para todos los harnesses, scopes, `process.cwd()`, conflictos, incompatibilidad, decisión continuar/abortar y rollback.
- Regresión de las pruebas existentes de Skills y revisión.

## 5. Rollout y límites

Activar en fases: migraciones, lectura administrativa, revisión/publicación, catálogo público, descargas y finalmente instalación CLI. No incluir ejecución de paquete como unidad, dependencias automáticas, orden de ejecución ni UI de auditoría.

## 6. Riesgos y tareas técnicas pendientes

- Diseñar migración compatible de `skill_review_requests` para `resourceType`/`resourceId`.
- Definir la interfaz de activación de `PackageVersion` y su integración con el flujo de revisión existente.
- Implementar auditoría y rate limiting sin ampliar los campos confirmados.
- Mantener la exploración Claude Design como referencia no gobernada hasta revisión humana.

## 7. Gate de aprobación

Este documento es una especificación candidata de implementación. Debe ser revisado por la persona responsable antes de generar el plan detallado y modificar código. `status: draft`, `verified: false` y `human-reviewed: false` se mantienen deliberadamente.

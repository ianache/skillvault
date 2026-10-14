# Skill Packages Claude Design Alignment — Design Specification

## Status

Draft — pending human review.

## Goal

Alinear la navegación y las pantallas de mantenimiento y consumo de paquetes de Skills con el proyecto Claude Design `SkillVault`, preservando la separación entre catálogo público y mantenimiento administrativo, y manteniendo temporalmente la instalación mediante CLI.

## Scope

### Included

- Restaurar una entrada pública `Paquetes` en la navegación hacia `/packages/public`.
- Mantener `Gestionar paquetes` como entrada administrativa hacia `/packages`, protegida por `content:manage`.
- Alinear `SCR-001` y `SCR-004` en estructura, navegación, filtros, estados y acciones visibles.
- Alinear `SCR-002` y `SCR-003` en estados de edición, validación, conflicto, permisos, auditoría y publicación/revisión.
- Alinear `SCR-005` con compatibilidad por harness, Skills retirados y políticas de versión.
- Mantener la instalación local como operación del CLI; la aplicación web solo consulta, descarga y entrega el comando/hand-off.

### Excluded

- Implementar instalación web directa en filesystem local.
- Crear un canal remoto de eventos para progreso de instalación.
- Cambiar el contrato de autenticación o RBAC existente.
- Resolver la implementación definitiva de `SCR-006` como UI de instalación remota.
- Rehacer el sistema visual global fuera del área de paquetes.

## Traceability

`US-001` → `UXR-002` → `FLW-001` → `SCR-001/SCR-002/SCR-003`

`US-002` → `UXR-001/UXR-003/UXR-004` → `FLW-002` → `SCR-004/SCR-005/SCR-006`

Claude Design reference: project `7fb6161e-1057-4869-b0b0-224b134dfeb3`, file `Paquetes de Skills.dc.html`.

## Design decisions

### DD-001 — Public and administrative package entry points remain separate

The shell exposes:

- `Paquetes` → `/packages/public` for public discovery and consumption.
- `Gestionar paquetes` → `/packages` for authorized maintenance.

Public users must not be routed to `/packages/{slug}/edit` from the consumption flow.

### DD-002 — Installation remains CLI-owned for this increment

The public detail may show compatibility, resolved versions, download actions and the CLI command. It must not claim that the browser installed files locally. A future implementation of web installation requires a separately approved local-agent/event contract.

### DD-003 — Claude Design is a visual reference pending human approval

The prototype itself is marked as exploration pending human review. Its visual structure, copy and states guide implementation, but do not constitute independent product approval.

## Screen-level requirements

### SCR-001 — Maintenance catalog

- Preserve the Claude Design table structure for package identity, role, state, version, Skill count, last update and actions.
- Keep search, role and state filtering.
- Show empty, loading, error and access-denied states.
- Keep create/edit/duplicate/review/retire actions permission-aware.

### SCR-002 — Package editor

- Preserve the two-column information/composition layout.
- Represent `Edición`, `Validación`, `Conflicto` and `Sin permisos` states.
- Keep valid input after validation errors.
- Show canonical Skill availability, retired/unavailable warnings and version policy.

### SCR-003 — Review and publication

- Show version transition, change summary, validation results, blocking/non-blocking conflicts and audit history.
- Keep publication disabled for blocking conflicts.
- Preserve the existing review workflow where publication requires the approved review path.

### SCR-004 — Public package catalog

- Provide a discoverable public route from the shell.
- Show published packages as cards with role, status, version, Skill count, version policy and harness availability where data exists.
- Support query and role/state/version-policy filters represented by the design.
- Do not expose draft or retired packages as operable public results.

### SCR-005 — Public package detail

- Show package purpose, role, status, resolved version policy and installable/retired Skill groups.
- Show harness compatibility and installation paths when available.
- Offer manifest/ZIP download and the CLI installation command.
- Explain that browser download is not local installation.
- Do not offer package-level execution.

### SCR-006 — Installation handoff

For this increment, retain the CLI boundary. The web flow must not present a fabricated progress or rollback state. The future replacement must define a local-agent/event contract before implementing installation progress.

## Verification strategy

- Unit/UI smoke tests for navigation labels and routes.
- Route-level tests for public package discovery and administrative protection.
- Component/source tests for required states and actions in `SCR-001`–`SCR-005`.
- Browser verification against `http://localhost:3010` for public navigation, admin navigation, package detail and download.
- Visual review against the authenticated Claude Design prototype after implementation.

## Open decisions

- Final public catalog information architecture: separate `Paquetes` entry versus a unified Skill/Package catalog.
- Exact mapping of Claude Design harness labels to persisted compatibility data.
- Future `SCR-006` local installation channel and rollback event contract.
- Whether publication remains review-mediated for every package state or allows an approved direct publish action.

## Human validation required

The human product/UX owner must confirm:

1. The visible labels `Paquetes` and `Gestionar paquetes`.
2. The decision to keep installation CLI-owned in this increment.
3. The accepted visual differences between the prototype data and live package data.
4. The final behavior of `SCR-006`.

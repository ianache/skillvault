---
name: user-flow-designer
description: Usar cuando los UX Requirements (UXR-*) deban convertirse en flujos de usuario con happy path, excepciones, permisos y estados, y haya que declarar qué pantallas (SCR-*) pertenecen a cada flujo.
---

# user-flow-designer

## Purpose
Construir flujos con happy path, excepciones, permisos y estados, y fijar la relación FLW ↔ SCR: todo Screen pertenece a un Flow.

## Course
UX-101

## Input contract
- UX Requirements (UXR-*) y su lineage US/AC.
- MUST receive a governed Context Pack or canonical source artifacts.
- MUST distinguish facts, assumptions, open questions, and human decisions.
- MUST NOT silently resolve missing business information.

## Output contract
- `User Flow` (FLW-*), OKF v0.2, `status: draft`, `generated.by: user-flow-designer/1.1`, nunca `verified`.
- Frontmatter: `id`, `requirements: [US-*, UXR-*]`, `screens: [SCR-*]` (lista de pantallas del flujo; `screens: []` + pregunta abierta si aún no existen).
- El flujo identifica pasos y estados; **no** define el layout (eso es `ui-spec-writer`).

## Preconditions
Cada UXR de entrada tiene US/AC resolubles. Si no, `BLOCKED` (`MISSING_REQUIREMENT_LINEAGE`).

## Invariants
- FLW → SCR y SCR → FLW coinciden: cada SCR listado declara `flow:` con este FLW (lo verifica `ui-spec-writer` y el preflight).
- Excepciones, permisos y estados del flujo son explícitos; los vacíos son preguntas abiertas.

## Workflow
1. Validar entradas y provenance; extraer UXR/AC/reglas.
2. Diseñar happy path, excepciones, permisos y estados.
3. Listar las pantallas necesarias como `screens` (IDs reservados; se especifican en `ui-spec-writer`).
4. Críticar contra UXR, AC y accesibilidad.
5. Actualizar `index.md`/`changelog.md`; detenerse ante ambigüedad.

## Quality gates
Lineage `US → UXR → FLW` resoluble; `screens` presente; ninguna pregunta crítica oculta.

## Failure / blocking behavior
`BLOCKED` ante falta de requisitos o conflicto entre UXR; se registra y se pide decisión humana.

## Downstream consumers
`ui-spec-writer`, `claude-design-orchestrator`, `stitch-ui-generator` (precondición FLW), `ux-development-handoff`.

## Must NOT
- DO NOT INVENT MISSING INFORMATION. DO NOT BYPASS FLW/SCR TRACEABILITY.
- PRESERVE IDS AND PROVENANCE. HUMAN DECISIONS MUST REMAIN EXPLICIT.
- No definir diseño visual ni referenciar herramientas externas.

## Definition of Done
FLW con requisitos y `screens`, listo para revisión humana y para que `ui-spec-writer` especifique cada SCR.

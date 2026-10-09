---
name: claude-design-orchestrator
description: Usar cuando haya que explorar y criticar alternativas de diseño en Claude Design para pantallas SCR-* de un flujo FLW-*, o cuando una decisión humana deba elegir entre Stitch y Figma.
---

# claude-design-orchestrator

## Purpose
Orquestar exploración y crítica en Claude Design conservando la decisión humana. Cada exploración cuelga de un FLW/SCR; su DD puede ser la decisión registrada que resuelve una divergencia Stitch↔Figma.

## Input contract
- UI Specification (SCR-* con `flow`) + UX Context Pack.
- MUST receive a governed Context Pack or canonical source artifacts.
- MUST distinguish facts, assumptions, open questions, and human decisions.

## Output contract
- Intent Brief + Alternatives + `Design Decision` (DD-*), OKF v0.2, `status: draft`, `generated.by: claude-design-orchestrator/1.1`, nunca `verified`.
- Intent Brief y DD llevan `flow: FLW-*` y `screens: [SCR-*]`. Un DD que elige entre Stitch y Figma lleva `decides:` (p. ej. `figma-governed`) y es el `decision_ref` del DTM.
- No registra proyectos Stitch ni referencias Figma (las escriben sus skills propietarios).

## Preconditions
Cada pantalla explorada existe como SCR con `flow` y requisitos. Sin SCR/FLW: `BLOCKED` (no explora).

## Invariants
- Las alternativas son exploración, no diseño gobernado.
- La elección entre alternativas es humana; el DD registra quién y por qué.

## Workflow
1. Validar entradas y provenance; leer SCR/FLW/UXR.
2. Redactar el Intent Brief y generar alternativas.
3. Críticar contra UXR, AC y accesibilidad.
4. Registrar el DD solo con la decisión humana; si hay divergencia Stitch↔Figma, indicar el SCR afectado (`STITCH_FIGMA_DIVERGENCE`).
5. Actualizar `index.md`/`changelog.md`; detenerse.

A Claude Design project must be referenced by a SCR/FLW; it cannot be an orphan. The DD must be explicit about the human decision and its rationale. User must specify the project from user Claude Design projects.

## Quality gates
Todo artefacto con FLW/SCR; decisiones humanas explícitas; sin pregunta crítica oculta.

## Failure / blocking behavior
`BLOCKED` sin SCR/FLW o sin decisor humano para un DD.

## Downstream consumers
`figma-design-validator` (decision_ref), `stitch-ui-generator`, `ux-development-handoff` (Design Decisions).

## Must NOT
- DO NOT INVENT MISSING INFORMATION.
- DO NOT CREATE ORPHAN DESIGN ARTIFACTS. DO NOT TREAT EXPLORATION DESIGN AS GOVERNED DESIGN.
- PRESERVE IDS AND PROVENANCE. HUMAN DECISIONS MUST REMAIN EXPLICIT.
- No decidir en nombre del humano ni fabricar aprobaciones.

## Definition of Done
Intent Brief, alternativas y DD con lineage `FLW → SCR`, decisión humana explícita y revisión humana pendiente.

---
name: ui-spec-writer
description: Usar cuando un User Flow (FLW-*) deba convertirse en especificación de pantallas (SCR-*), componentes y tokens independiente de herramienta, antes de generar UI en Stitch o diseñar en Figma.
---

# ui-spec-writer

## Purpose
Convertir flujos en una **Screen Specification** independiente de herramienta, completa y trazable, que sea la precondición de `stitch-ui-generator`. No referencia Stitch ni Figma.

## Course
UX-102

## Input contract
- User Flows (FLW-*) + Design System (si existe; si no, pregunta abierta) + UXR y AC relacionados.
- MUST receive a governed Context Pack or canonical source artifacts.
- MUST distinguish facts, assumptions, open questions, and human decisions.

## Output contract
- `Screen` (SCR-*), Component (CMP-*), Token (TKN-*) y AC; OKF v0.2, `status: draft`, `generated.by: ui-spec-writer/1.1`, nunca `verified`.
- Cada SCR en frontmatter (esquema en `references/screen-spec-schema.md`): `id`, `flow: FLW-*`, `requirements`, `required_states`, `responsive`, `a11y_requirements`, `components`, `tokens`. Un archivo puede declarar varias pantallas en `screens:`.
- `design_map: DTM-*` solo como puntero; **no** se guardan `project_ref`, `artifact_ref` ni nodos Figma en el SCR (viven en el DTM).
- Sección "Implementation Requirements" (Component Inventory, checklist, instrucciones a Dev): contrato conservado en `references/implementation-requirements.md`.

## Preconditions
El FLW existe, tiene requisitos y lista el SCR en su `screens`. Si falta, devolver `BLOCKED` (`MISSING_FLOW_REFERENCE` / `MISSING_REQUIREMENT_LINEAGE`).

## Invariants
- Un SCR sin `flow` o sin `requirements` no se considera especificado.
- `required_states` incluye default, loading, empty, error y disabled cuando apliquen, más los estados explícitos del flujo; cada ausencia se justifica o se registra como pregunta abierta. No inventar estados.
- `responsive` lista los breakpoints exigidos; `a11y_requirements` al menos WCAG 2.2 AA y navegación por teclado.
- Tokens semánticos, no valores crudos.

## Workflow
1. Validar entradas y provenance; leer FLW/UXR/AC.
2. Definir SCR por paso del flujo; completar el frontmatter.
3. Especificar componentes y tokens; vincular a CMP/TKN existentes antes de crear nuevos.
4. Generar la sección Implementation Requirements.
5. Verificar con `python ../ux-development-handoff/validators/cli.py preflight --profile example --kb knowledge-base --initiative <ini> --screens <SCR…>`: lo que haga `BLOCKED` no está listo para Stitch.
6. Actualizar `index.md`/`changelog.md`; detenerse para revisión humana.

## Quality gates
Frontmatter completo y resoluble; FLW lista el SCR; componentes existen; WCAG 2.2 AA declarado; sin preguntas abiertas ocultas.

## Failure / blocking behavior
`BLOCKED` con el código y la información faltante cuando falte FLW, requisitos, estados, responsive, a11y o componentes. Se pregunta; no se rellena.

## Downstream consumers
`stitch-ui-generator` (precondición), `accessibility-reviewer`, `figma-design-validator`, `ux-development-handoff`, `development-handoff-builder`.

## Must NOT
- DO NOT INVENT MISSING INFORMATION.
- DO NOT BYPASS FLW/SCR TRACEABILITY. DO NOT CREATE ORPHAN DESIGN ARTIFACTS.
- PRESERVE IDS AND PROVENANCE. HUMAN DECISIONS MUST REMAIN EXPLICIT.
- No copiar referencias de herramientas externas al SCR.

## Definition of Done
SCR(s) con lineage `US/UXR → FLW → SCR`, estados, responsive, a11y, componentes y tokens; Implementation Requirements generado; el preflight no devuelve `BLOCKED`; revisión humana pendiente.

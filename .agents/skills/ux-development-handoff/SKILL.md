---
name: ux-development-handoff
description: Usar cuando un diseño UX/UI aprobado deba entregarse a Desarrollo (Developer + agente IA + Superpowers), cuando se pida evaluar DESIGN_READY_FOR_DEV, o cuando Superpowers pida el contexto de diseño para implementar un SCR-*.
---

# ux-development-handoff

## Purpose
Convertir el diseño aprobado en un **contrato Design-to-Code** verificable: qué Screen implementar, cuál es su `governed_design` (Figma), con qué componentes, tokens, estados, responsive, interacciones y accesibilidad, y con qué lineage. Evalúa el gate `DESIGN_READY_FOR_DEV`.

## Input contract
- DTM (Design Traceability Map) con una entrada por SCR; SCR, FLW, UXR, US/AC, CMP/TKN, DD y Accessibility Reports aprobados.
- `governed_design` en Figma (lo registra `figma-design-validator`).
- MUST receive a governed Context Pack or canonical source artifacts.

## Output contract
- **HOF-*** (`UX Development Handoff`, plantilla en `templates/`): secciones A–N (Requirement Context, User Flow, Screens, Governed Design Reference, Components, Design Tokens, Screen States, Responsive, Interaction Rules, Accessibility, Acceptance Criteria, Design Decisions, Open Questions/Assumptions, Provenance). Referencia IDs; no copia el contenido de SCR/CMP/DTM. Detalle en `references/design-to-code-contract.md`.
- Registro del gate en el frontmatter: `gate.result` = `PASSED | FAILED | BLOCKED`, evidencia (hallazgos) y `human_review`.
- Si el gate pasa: insumo para `development-handoff-builder` (Development Context Pack).
- A solicitud: contexto de implementación por SCR (`dev-context`).
- OKF v0.2: `status: draft`, `generated.by: ux-development-handoff/2.0`, nunca `verified`.

## Preconditions
Cada SCR del alcance tiene entrada DTM, FLW y lineage; ver el DTM en `references/design-traceability-map.md`. El validador compartido está en `validators/` (este paquete).

## Invariants
- Se entrega a Dev el `governed_design`. Nunca se selecciona un artefacto Stitch cuando existe Figma gobernado; Stitch solo aparece como `exploration_lineage` no autoritativa.
- **Stitch como diseño gobernado (decisión de `human:ianache`, 2026-10-04: Figma descartado en este repositorio).** Un `governed_design` puede ser `tool: stitch` si es el **mismo artefacto** ya registrado como `exploration_design` de ese SCR, con `project_ref`, `artifact_ref`, `version` y un aprobador humano (`human:<id>`). Se registra con `python validators/cli.py register-governed-stitch --kb knowledge-base --dtm <DTM> --screen <SCR> --artifact-ref <ref> --version <v> --approved-by human:<id> --states … --breakpoints …`; sin `--approved-by` queda `candidate` y el gate no pasa. El agente nunca aporta la aprobación. Si el SCR tiene gobierno de Stitch no se exige la comparación Stitch↔Figma; si hay Figma gobernado, rige Figma.
- Sin `governed_design` identificable → no hay handoff.
- La aprobación del gate es humana: el validador nunca escribe `human_review.status: approved`.
- `PASSED` = comprobaciones automáticas superadas, pendiente de revisión humana.

## Workflow
1. `python validators/cli.py gate --kb knowledge-base --hof <HOF> [--profile production]`.
2. Si `FAILED`/`BLOCKED`: no emitir contexto; reportar códigos, SCR y responsable. Corregir upstream; no parchear aquí.
3. Redactar/actualizar HOF (A–N) por referencias. Registrar `gate` y dejar `human_review: {status: pending}`.
4. Un humano revisa y registra `human_review.status: approved` con `reviewer: human:<id>`.
5. Pasar a `development-handoff-builder`; para un SCR concreto: `python validators/cli.py dev-context --kb knowledge-base --screen <SCR>`.
6. Actualizar `index.md` y `changelog.md` de `knowledge-base/`.

## Quality gates
`DESIGN_READY_FOR_DEV` (códigos y reglas en `references/design-to-code-contract.md`). Perfil `example` acepta `PLACEHOLDER:`; `production` los rechaza y exige aprobación humana.

## Failure / blocking behavior
Resultado `BLOCKED` (falta una decisión o dato: Figma gobernado, divergencia sin resolver, pregunta bloqueante, lineage) o `FAILED` (defecto: estado/responsive/a11y/componente/token faltante, referencia obsoleta, proyecto Stitch incorrecto). `FAILED` prevalece. El agente de desarrollo que encuentre una ambigüedad de diseño emite `DESIGN_CONFLICT` (ver `references/superpowers-design-contract.md`).

## Downstream consumers
`development-handoff-builder` (Development Context Pack) → Developer + AI Coding Agent + Superpowers → QA / Visual Verification.

## Must NOT
- DO NOT INVENT MISSING INFORMATION.
- DO NOT PASS DESIGN_READY_FOR_DEV WITH BLOCKING OPEN QUESTIONS.
- DO NOT ALLOW THE CODING AGENT TO SILENTLY RESOLVE DESIGN AMBIGUITIES.
- DO NOT TREAT EXPLORATION DESIGN AS GOVERNED DESIGN. DO NOT CREATE ORPHAN DESIGN ARTIFACTS.
- PRESERVE IDS AND PROVENANCE. HUMAN DECISIONS MUST REMAIN EXPLICIT.
- No fabricar `verified`, aprobaciones, evidencia a11y ni referencias Stitch/Figma.

## Definition of Done
HOF con A–N completos por referencia; `gate.result` registrado con evidencia; si `PASSED`, revisión humana solicitada con reviewer identificado; contexto de Dev solo con `governed_design`; todo trazable US → UXR → FLW → SCR → diseño → CMP/TKN → handoff.

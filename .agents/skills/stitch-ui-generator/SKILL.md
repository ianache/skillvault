---
name: stitch-ui-generator
description: Usar cuando haya que generar o regenerar UI en Google Stitch para pantallas SCR-* ya especificadas de un flujo FLW-*, o cuando un agente vaya a crear, buscar o reutilizar un proyecto Stitch. No usar para inventar pantallas o flujos.
---

# stitch-ui-generator

## Purpose
Generar UI exploratoria reproducible en Google Stitch **dentro de un único proyecto Stitch gobernado por iniciativa**, y registrar el vínculo SCR ↔ artefacto Stitch. Stitch es `exploration_design`; nunca es por sí mismo el diseño gobernado.

## Course
UX-104

## Input contract
- Iniciativa, `SCR-*` (Screen Specification completa), su `FLW-*` y su lineage `US/AC/UXR`.
- DESIGN.md / Design System si existe (si no, registrarlo como pregunta abierta).
- Un Stitch Design Project `STP-*` activo, o autorización humana explícita para crearlo.
- MUST receive a governed Context Pack or canonical source artifacts.

## Output contract
- Entrada `exploration_design` en el Design Traceability Map (DTM): `project_ref` (STP), `artifact_ref`, `version`, `status`. Esa entrada es la **única** fuente del vínculo SCR↔Stitch (no se copia al SCR).
- `GEN-*` (Generation Prompt): prompts, variantes y revisión crítica. Referencia al DTM; no duplica el lineage.
- Si hubo creación autorizada: concepto `STP-*` (tipo `Design Project`).
- OKF v0.2: `status: draft`, `generated.by: stitch-ui-generator/2.0`, nunca `verified`. Plantillas en `templates/`.
- Contratos y esquemas: `references/stitch-project-governance.md`. Spec de componentes para Dev: `references/implementation-requirements.md`.

## Preconditions
Ejecutar `python ../ux-development-handoff/validators/cli.py preflight --kb knowledge-base --initiative <ini> --screens <SCR…>`. (implementa `validators/stitch_preflight.py`). Solo si el resultado es `READY` continuar. Exige: iniciativa, proyecto Stitch, FLW que liste el SCR, SCR con requirements, estados, responsive, a11y y componentes.

## Invariants
- MUST NOT create a new Stitch project when an active governed Stitch Project already exists for the initiative. Una nueva ejecución sobre SCR-021 actualiza el artefacto dentro del proyecto existente.
- Todas las pantallas de una iniciativa/flujo se generan en el mismo `STP`. Nunca un proyecto por pantalla, generación o iteración.
- Cada artefacto Stitch queda ligado a un SCR (y por él a FLW y requisitos). Sin vínculo no se registra.
- Antes de usar un `project_ref`, verificarlo en vivo con las herramientas Stitch (`get_project`/`list_projects`) y registrar la evidencia; si no se puede verificar, dejarlo como pregunta abierta.
- Si Stitch no entrega un ID estable, registrar la referencia verificable disponible y documentar la limitación. No inventar IDs.
- **Un `artifact_ref` se copia, no se escribe.** Sale literal de la salida de Stitch (el `name` de `list_screens`/`get_screen` o el resultado de la generación), extraído con un script o copiado entero. Nunca se teclea de memoria, se completa a partir de un prefijo ni se «reconstruye». Un id con el prefijo real y el resto inventado tiene la forma correcta y solo lo detecta la comprobación contra la evidencia (incidente del 2026-10-04). Si la herramienta no devuelve el id, no se registra: se usa `PLACEHOLDER:` y se deja una pregunta abierta.
- Los ids de Stitch son opacos (`projects/<n>/screens/<32 hex>`): no se infieren de otros ids ni de la posición en una lista.

## Workflow
1. Preflight (arriba). Si `BLOCKED`, detenerse y reportar los códigos.
2. Resolver proyecto: `REUSE` del STP activo. `CREATE_AUTHORIZED` solo con `--create-project --authorized-by human:<id>` y si no existe un STP activo; registrar el nuevo STP.
3. Generar cada SCR en ese proyecto (`generate_screen_from_text` / `edit_screens` / `generate_variants`), un prompt por pantalla derivado de la Screen Specification.
4. Registrar. Primero obtén el id de la salida de Stitch y guarda esa salida en un archivo (si la herramienta ya la guardó, usa ese archivo). Luego: `python ../ux-development-handoff/validators/cli.py register-exploration --kb knowledge-base --dtm <DTM> --screen <SCR> --project-ref <STP> --artifact-ref <ref> --version <v> --evidence <archivo>`. El validador rechaza (`INVALID_ARTIFACT_REF`, `UNVERIFIED_ARTIFACT_REF`) un id mal formado, de otro proyecto o que no aparezca literal en la evidencia; las refs `PLACEHOLDER:` no la necesitan. Después relee la entrada del DTM y compara el id carácter a carácter con la fuente.
5. Revisión crítica contra UXR, AC y reglas de negocio; hallazgos al `GEN-*`; contenido inventado por Stitch se anota, no se acepta.
6. Actualizar `index.md` y `changelog.md` de `knowledge-base/`. Detenerse para revisión humana.

## Quality gates
- Preflight `READY`; `register-exploration` sin error, con `--evidence` para toda ref real de Stitch.
- Lineage completo: US/UXR → FLW → SCR → artefacto (ver `references/stitch-project-governance.md`).
- El `GEN-*` no se presenta como aprobado: es exploración.

## Failure / blocking behavior
Responder `BLOCKED` con el código del validador (`ORPHAN_STITCH_ARTIFACT` sin SCR, `MISSING_FLOW_REFERENCE`, `MISSING_REQUIREMENT_LINEAGE`, `MISSING_STITCH_PROJECT`, `MULTIPLE_ACTIVE_STITCH_PROJECTS`, `WRONG_STITCH_PROJECT`, …) y qué falta y de quién. No inventar un Flow o Screen para poder continuar. Pedir a un agente crear un proyecto sin STP activo ni autorización humana → `BLOCKED`.

## Downstream consumers
`figma-design-validator` (registra `governed_design`, compara contra el artefacto), `ux-development-handoff` (Design Traceability Map), `development-handoff-builder`.

## Must NOT
- DO NOT INVENT MISSING INFORMATION.
- DO NOT CREATE ORPHAN DESIGN ARTIFACTS.
- DO NOT CREATE A NEW STITCH PROJECT WHEN AN ACTIVE GOVERNED PROJECT EXISTS.
- DO NOT BYPASS FLW/SCR TRACEABILITY.
- DO NOT TYPE, COMPLETE OR GUESS A STITCH ID: COPY IT FROM THE TOOL OUTPUT AND PROVE IT WITH `--evidence`.
- DO NOT TREAT EXPLORATION DESIGN AS GOVERNED DESIGN.
- PRESERVE IDS AND PROVENANCE. HUMAN DECISIONS MUST REMAIN EXPLICIT.
- No fabricar `verified`, aprobaciones, evidencia de accesibilidad ni referencias externas.

## Definition of Done
Cada SCR pedido tiene su artefacto dentro del STP gobernado, registrado en el DTM con `project_ref`, `artifact_ref` y `version` reales (o la limitación documentada); `GEN-*` actualizado; revisión humana pendiente.

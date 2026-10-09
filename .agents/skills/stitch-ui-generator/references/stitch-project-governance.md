# Stitch project governance (stitch-ui-generator 2.0)

## Resolution rule (one project per initiative)
| Situation | Result |
|---|---|
| Exactly one `Design Project` with `project_status: active` for the initiative | `REUSE` it. Creation requests are ignored, even if a human authorization is supplied |
| None active, creation requested, `--authorized-by human:<id>` | `CREATE_AUTHORIZED`: create in Stitch, then write the `STP-*` concept |
| None active, no creation request or no human authorization | `BLOCKED` · `MISSING_STITCH_PROJECT` |
| More than one active | `BLOCKED` · `MULTIPLE_ACTIVE_STITCH_PROJECTS` (a human must archive the extras) |
| No initiative | `BLOCKED` · `MISSING_INITIATIVE` |

Archiving or superseding a project is a human decision (`project_status: archived|superseded`).

## STP concept (`knowledge-base/design/projects/STP-*.md`)
Template: `templates/design-project-template.md`. `external_ref` is the real Stitch resource name (e.g. `projects/<id>` as returned by Stitch). Never a guessed value; `PLACEHOLDER:` only in examples. `status` is the OKF lifecycle; the project lifecycle is `project_status`.

## What the skill writes where
| Fact | Location | Owner |
|---|---|---|
| Project exists, belongs to initiative | `STP-*` | stitch-ui-generator |
| SCR ↔ Stitch artifact (`project_ref`, `artifact_ref`, `version`) | DTM `traceability[].exploration_design` | stitch-ui-generator |
| Prompts, variants, critical review | `GEN-*` (references the DTM) | stitch-ui-generator |
| Which design is built | DTM `governed_design` | figma-design-validator |

Regenerating a screen replaces `exploration_design` and moves the previous value to `exploration_history`. The project never changes.

## Stable-ID limitation
Stitch returns resource names such as `projects/<id>` and `screens/<id>`. Record exactly what the tool returned. If a version or revision is not exposed, write `version: not-exposed-by-stitch` and note it in the `GEN-*`; staleness is then detected only by comparing against `latest_known_version` captured at verification time.

## Live verification
Before reusing `project_ref`, call the Stitch tools (`get_project`) and record the date and result in the `GEN-*`. If the tool is unavailable (not authorized), record that as an open question; do not claim verification.

## Registro verificado del `artifact_ref`

El vínculo SCR ↔ Stitch solo vale si el id existe. Por eso `register-exploration` (validador `registry.py`) exige, para toda ref que no sea `PLACEHOLDER:`:

| Comprobación | Código | Severidad |
|---|---|---|
| Forma exacta `projects/<n>/screens/<32 hex en minúscula>` | `INVALID_ARTIFACT_REF` | FAILED |
| El proyecto `<n>` es el `external_ref` del STP activo | `INVALID_ARTIFACT_REF` | FAILED |
| `--evidence` apunta a un archivo que contiene literal `screens/<id>` (salida guardada de `list_screens`, `get_screen` o la generación) | `UNVERIFIED_ARTIFACT_REF` | BLOCKED |

La entrada del DTM guarda el nombre del archivo de evidencia (`exploration_design.evidence`). La comprobación no demuestra que el diseño sea el correcto, solo que el id lo devolvió Stitch: un id fabricado con la forma correcta (por ejemplo, el prefijo real y un sufijo inventado) no aparece en la evidencia y se rechaza.

**Cómo obtener el id sin teclearlo:** `list_screens` devuelve un JSON grande que la herramienta guarda en un archivo; léelo con un script que filtre por título y imprima el `name`, y pasa ese mismo archivo a `--evidence`. No copies el id a mano desde el texto de una respuesta y no lo completes.

# Preparación del diseño por etapa y consumidor

La UXS emite un veredicto por consumidor para decidir si ya se puede ejecutar la etapa siguiente. El orquestador **no** genera esos entregables: indica el skill siguiente. Aplica el veredicto sobre los SCR en el alcance de la entrega, no sobre todo el repositorio.

## Contenido
- Regla general de veredicto
- Stitch → `stitch-ui-generator`
- Figma → `figma-design-validator`
- Desarrollo → `ux-development-handoff`
- QA → `test-case-generator`
- Códigos de error → skill dueño
- Cómo redactar un CONDITIONAL

## Regla general de veredicto

- **READY:** se cumplen todos los mínimos del consumidor y ningún bloqueante afecta su alcance.
- **CONDITIONAL:** los mínimos están, pero hay preguntas abiertas que afectan parte del trabajo. Lista cada una y qué decisión pospone.
- **NOT READY:** falta un mínimo o hay un bloqueante en su alcance.

## Stitch → `stitch-ui-generator`

Necesita una especificación que lo haga no inventar.

Mínimos:
- SCR con `flow`, `requirements`, `required_states`, `responsive`, `a11y_requirements`, `components` y `tokens`.
- FLW que lista el SCR (coincidencia en ambos sentidos) y UXR con lineage a US/AC.
- Preflight `READY` (`validators/cli.py preflight`).
- Design System / `TKN-SET-*` identificado, o su ausencia como pregunta abierta.
- `STP-*` activo verificado en vivo, o autorización humana explícita para crearlo.

Riesgo típico de un CONDITIONAL: Design System ausente; Stitch aplicará estilos propios que habrá que rehacer en Figma.

## Figma → `figma-design-validator`

Necesita algo que validar y contra qué validar.

Mínimos:
- SCR del alcance con entrada en el DTM (y exploración registrada si se parte de Stitch).
- Acceso autorizado al archivo/nodo Figma por SCR. Sin acceso: NOT READY (`BLOCKED`).
- ARP del SCR revisado; ningún criterio marcado `pass` sin haberse evaluado.
- CMP/TKN vinculados para comparar naming y variables.

Riesgo típico de un CONDITIONAL: divergencia Stitch↔Figma sin DD; el SCR queda `divergence: open` y no puede aprobarse.

## Desarrollo → `ux-development-handoff` → `development-handoff-builder`

Necesita diseño gobernado y sin ambigüedad que el agente tendría que resolver solo.

Mínimos (gate `DESIGN_READY_FOR_DEV`):
- `governed_design` por SCR, con `file_ref`, `node_ref` y `version` reales y no obsoletos.
- Divergencia Stitch↔Figma `none` o `resolved` (DD humano); Stitch solo como `exploration_lineage`.
- ARP por SCR sin `fail`; `inconclusive` solo si queda como pregunta no bloqueante.
- Estados y responsive observados en Figma (`states_covered`, `responsive_covered`) que cubren `required_states` y `responsive` del SCR.
- Ninguna pregunta abierta bloqueante en UXR, FLW, SCR o ARP.
- `human_review` del gate registrado (la aprobación es humana).

Riesgo típico de un CONDITIONAL: un estado de error no diseñado; Desarrollo lo improvisaría. Si un estado falta, el SCR queda fuera de la entrega, no se autoriza a improvisar.

## QA → `test-case-generator`

Necesita comportamiento de interfaz verificable.

Mínimos:
- AC con resultado visible (qué se ve, qué se habilita, qué mensaje).
- Estados (vacío, error, sin permisos, éxito) y permisos por actor definidos.
- ARP con criterios evaluados para derivar casos de accesibilidad.
- Términos de etiquetas y mensajes del glosario para construir datos y aserciones.

Riesgo típico de un CONDITIONAL: mensajes de error sin texto definido; QA no puede afirmar el resultado esperado.

## Códigos de error → skill dueño

El gate y el preflight devuelven códigos. No se parchean en el HOF: se corrigen upstream en el skill dueño.

| Código / síntoma | Skill dueño |
|---|---|
| SCR sin `flow` o `requirements`; estados, responsive o a11y ausentes | `ui-spec-writer` |
| FLW↔SCR no coinciden | `user-flow-designer` (declara) y `ui-spec-writer` (confirma) |
| UXR sin lineage o sin actor/permisos | `ux-requirements-analyzer` |
| Sin entrada de exploración / `register-exploration` falla | `stitch-ui-generator` |
| `STITCH_FIGMA_DIVERGENCE` | `claude-design-orchestrator` (DD humano) y luego `figma-design-validator` |
| `STALE_FIGMA_REFERENCE`, sin `governed_design` | `figma-design-validator` |
| ARP ausente, `fail` o `inconclusive` bloqueante | `accessibility-reviewer` |
| Pregunta crítica abierta | Responsable humano (UXR/FLW/SCR) o `af-requirements-orchestrator` si es de negocio |

Si aparece un código que no está en esta tabla, consulta `ux-development-handoff/validators/codes.py` y asígnalo al skill que produce el artefacto afectado.

## Cómo redactar un CONDITIONAL

No basta con la etiqueta. Cada CONDITIONAL en la UXS lleva: qué mínimo no se cumple del todo, qué preguntas (con ID) lo causan, quién debe responder y qué parte del trabajo del consumidor queda pospuesta si se avanza igual. Así quien decide avanzar lo hace sabiendo el riesgo.

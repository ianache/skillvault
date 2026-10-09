---
name: ux-ui-orchestrator
description: Orquesta los skills UX/UI (ux-requirements-analyzer, user-flow-designer, ui-spec-writer, stitch-ui-generator, claude-design-orchestrator, figma-design-validator, accessibility-reviewer, ux-development-handoff) para llevar User Stories validadas hasta un diseño gobernado y un handoff DESIGN_READY_FOR_DEV, con trazabilidad US→UXR→FLW→SCR→DTM y compuertas humanas. Úsalo siempre que el usuario pida gestionar, completar, auditar o retomar el diseño UX/UI de punta a punta, preparar pantallas para Stitch/Figma/Desarrollo, evaluar si un SCR está listo, resolver una divergencia Stitch↔Figma, o decida qué skill UX/UI ejecutar y en qué orden, aunque no nombre ningún skill.
---

# ux-ui-orchestrator

## Propósito

Coordinar los skills de la pista UX/UI para que sus artefactos queden **completos, consistentes y trazables entre sí**, y consolidarlos en una **Especificación de Diseño UX/UI (UXS)** con un veredicto de preparación por etapa y por consumidor. Cada skill produce un artefacto correcto por sí mismo; lo que falla en la práctica son las costuras: un SCR cuyo FLW no lo lista, una pantalla generada en Stitch sin DTM, un Figma aprobado con divergencia abierta, un UXR cuya pregunta abierta nadie dirigió al skill que puede cerrarla. Este orquestador cierra esas costuras.

Es el equivalente de `af-requirements-orchestrator` para la etapa siguiente: aquel termina con una RQS lista; este arranca de ella. No redacta contenido propio: delega en cada skill y verifica. No decide por humanos, no aprueba diseños y no escribe código; declara si el diseño está listo para Desarrollo y con qué skill continuar.

## Skills que orquesta

| Skill | Produce | Carpeta (`knowledge-base/design/`) |
|---|---|---|
| `ux-requirements-analyzer` | UX Requirements `UXR-*` + preguntas abiertas | `ux-requirements/` |
| `user-flow-designer` | User Flow `FLW-*` (declara `screens`) | `user-flows/` |
| `ui-spec-writer` | Screen `SCR-*`, Component `CMP-*`, Token `TKN-*`, AC | `screens/`, `components/`, `tokens/`, `acceptance-criteria/` |
| `web-atomic-component-designer` | Catálogo atómico Angular (opcional, cuando hay librería de componentes) | `components/` |
| `stitch-ui-generator` | `GEN-*`, `STP-*`, entrada `exploration_design` en el DTM | `generations/`, `projects/`, `traceability/` |
| `claude-design-orchestrator` | Intent Brief `IB-*`, alternativas, Design Decision `DD-*` | `explorations/` |
| `figma-design-validator` | Design Validation Report + `governed_design` en el DTM | `traceability/` |
| `accessibility-reviewer` | Accessibility Report `ARP-*` | `handoff/` o junto al SCR |
| `ux-development-handoff` | Handoff `HOF-*` y gate `DESIGN_READY_FOR_DEV` | `handoff/` |

Cada skill gobierna su formato y sus IDs; invócalo con la herramienta Skill y no reescribas su salida aquí.

**Entrada:** User Stories y reglas ya producidas por `af-requirements-orchestrator` (RQS con veredicto UX/UI READY o CONDITIONAL). Sin historias, este skill no arranca: señala `af-requirements-orchestrator`.

## Cuándo no usarlo

- Una tarea que toca un solo artefacto sin afectar a los demás (p. ej. "revisa la accesibilidad de SCR-016"): invoca directamente el skill.
- Gestionar requerimientos, historias o glosario: es `af-requirements-orchestrator`.
- Implementar el diseño en código: es `development-handoff-builder` y Superpowers, después del gate.

## Flujo

1. **Diagnosticar** el estado y el escenario (paso 1).
2. **Planificar** la ruta mínima y mostrarla antes de ejecutar (paso 2).
3. **Aislar** en un git worktree si va a escribir archivos (paso 2b).
4. **Ejecutar** por fases, con compuerta entre ellas (paso 3).
5. **Cerrar costuras**: enrutar preguntas y brechas entre skills (paso 4).
6. **Auditar** (paso 5).
7. **Consolidar** la UXS y emitir veredictos (paso 6).
8. **Integrar**: proponer incorporación y esperar la decisión (paso 7).

### 1. Diagnosticar

Haz un inventario antes de decidir, porque la ruta depende de lo que ya existe:

```
python .claude/skills/ux-ui-orchestrator/scripts/audit_ux.py knowledge-base
```

Lee además `knowledge-base/index.md`, `changelog.md`, `design/MEMORY.md` si existe, la RQS y las historias del alcance. Si el proyecto tiene `graphify-out/GRAPH_REPORT.md`, léelo primero (instrucción del repositorio). Clasifica el escenario con `references/scenarios.md`:

| Escenario | Señal |
|---|---|
| A. Iniciativa nueva de diseño | Hay historias READY/CONDITIONAL y no hay UXR/FLW/SCR |
| B. Cambio sobre diseño existente | Hay artefactos de diseño y cambia una historia, regla o decisión |
| C. Especificar pantallas | Hay UXR/FLW; faltan SCR/CMP/TKN o están incompletos |
| D. Exploración visual | SCR especificados y listos; falta Stitch/Claude Design |
| E. Diseño gobernado | Hay exploración; falta Figma validado, o divergencia Stitch↔Figma |
| F. Auditoría y gate | Hay que saber si un SCR/flujo está listo para Desarrollo |
| G. Decisión humana recibida | Un humano respondió preguntas, eligió alternativa o aprobó |

Si es ambiguo, pregunta una sola cosa concreta (iniciativa/flujo o historia de partida); no adivines el alcance.

### 2. Planificar

Presenta un plan corto: escenario, skills en orden, artefactos que se crearán o actualizarán, qué se paraleliza y qué decisiones humanas se esperan. Espera confirmación si crea más de cinco archivos, toca artefactos `approved`, o va a **crear un proyecto Stitch** o escribir en Figma (acciones externas). Si el usuario ya pidió ejecutar sin preguntar, procede, salvo la creación de un `STP-*`, que exige autorización humana explícita (`human:<id>`).

### 2b. Aislar en un worktree

Si va a crear o modificar archivos, trabaja en un worktree `ux/<slug>` siguiendo `references/worktree-protocol.md` (extiende el de `af-requirements-orchestrator`). Las ejecuciones que solo leen no lo necesitan. Las llamadas a Stitch y Figma son efectos externos que **no** se aíslan: avisa de ello antes de ejecutarlas.

### 3. Ejecutar por fases

Orden canónico (omite lo que el escenario no necesite):

| Fase | Skill | Compuerta para pasar a la siguiente |
|---|---|---|
| 1 Requisitos UX | `ux-requirements-analyzer` | Cada UXR con lineage a US/AC; actor, permisos y estados; vacíos como preguntas |
| 2 Flujos | `user-flow-designer` | Happy path, excepciones, permisos y estados; `screens` declarado |
| 3 Especificación | `ui-spec-writer` (+ `web-atomic-component-designer` si hay librería) | `validators/cli.py preflight` sin `BLOCKED`; cada SCR con `flow`, `requirements`, `required_states`, `a11y_requirements` |
| 4 Exploración | `stitch-ui-generator` y/o `claude-design-orchestrator` | Cada artefacto con SCR→FLW; `register-exploration` sin error; un solo `STP` por iniciativa |
| 5 Accesibilidad | `accessibility-reviewer` | ARP por SCR; ningún `pass` sin evaluar; `fail`/`inconclusive` visibles |
| 6 Diseño gobernado | `figma-design-validator` | `governed_design` por SCR; divergencia Stitch↔Figma `none` o `resolved` (con DD humano) |
| 7 Handoff | `ux-development-handoff` | `validators/cli.py gate` sin `FAILED`/`BLOCKED`; revisión humana pendiente registrada |

Por qué este orden: el flujo necesita los UXR para listar pantallas; la especificación de pantalla es lo que consume Stitch y evita que invente; la accesibilidad se revisa antes de gobernar para no aprobar lo que ya falla; y el diseño gobernado de Figma, no la exploración, es lo único que entra al handoff. Pasa de fase solo cuando la compuerta se cumple o cuando la pregunta abierta no bloquea (queda registrada, no se esconde).

**Paralelización.** Las fases 1–3 se paralelizan por flujo/familia de UXR (p. ej. UXR-028/029/030 son independientes entre sí tras UXR-017). Las fases 4–6 se paralelizan por SCR, **excepto** que todos los SCR de una iniciativa viven en el mismo `STP` (invariante de `stitch-ui-generator`): serializa la creación/resolución del proyecto y paraleliza solo la generación de pantallas dentro de él.

Al delegar en un subagente, entrégale: skill a usar, ruta del worktree, flujo/SCR en alcance, fuentes autorizadas, artefactos existentes a actualizar (no reemplazar), y qué debe devolver (archivos tocados, estado de preflight/gate, preguntas nuevas). Si corren en paralelo, indícales que no editen `index.md`, `changelog.md` ni el DTM y que devuelvan las entradas: las aplicas tú una sola vez (en paralelo se pisarían). Verifica sus resultados con la herramienta correspondiente antes de darlos por buenos.

### 4. Cerrar costuras (ruteo de preguntas)

Enruta cada hallazgo al skill que puede resolverlo y repite hasta el punto fijo o hasta quedar solo lo que exige a un humano:

| Hallazgo | Lo resuelve |
|---|---|
| Historia sin UXR; UXR con lineage roto o sin actor/permisos | `ux-requirements-analyzer` |
| Pregunta sobre regla, término o comportamiento de negocio | Vuelve a `af-requirements-orchestrator` (no se responde en diseño) |
| UXR sin flujo; excepción, permiso o estado no cubierto | `user-flow-designer` |
| FLW lista un SCR que no existe, o SCR cuyo `flow` no coincide | `ui-spec-writer` (el FLW declara; el SCR confirma) |
| SCR sin `required_states`, `responsive` o `a11y_requirements` | `ui-spec-writer` |
| Componente repetido o no reutilizable; boundary de librería | `web-atomic-component-designer` |
| Pantalla sin exploración o con contenido inventado por Stitch | `stitch-ui-generator` |
| Hay que comparar alternativas o elegir entre Stitch y Figma | `claude-design-orchestrator` (el DD lo decide un humano) |
| Referencia Figma obsoleta (`STALE_FIGMA_REFERENCE`) o sin `governed_design` | `figma-design-validator` |
| Contraste, foco, teclado, nombres accesibles, objetivos táctiles | `accessibility-reviewer` |
| Gate `FAILED`/`BLOCKED` | El skill upstream dueño del código de error (ver `references/role-readiness.md`); nunca parchear en el HOF |
| Contradicción entre fuentes | No se resuelve: se preserva y se escala al Responsable |

Tope: tres pasadas. Si tras la tercera siguen apareciendo brechas, detente y repórtalas: es señal de un problema de alcance o de requisitos, no de diseño.

### 5. Auditar calidad

1. Ejecuta `audit_ux.py` y corrige todo error imputable a un skill (re-invócalo; no edites a mano lo que genera una herramienta).
2. Ejecuta el preflight (`python .claude/skills/ux-development-handoff/validators/cli.py preflight --profile production --kb knowledge-base --initiative <ini> --screens <SCR…>`) y, si ya hay HOF, el `gate`.
3. Evalúa los atributos de `references/quality-criteria.md` por SCR y a nivel conjunto, citando archivo y sección.
4. Revisa la trazabilidad cruzada: US → UXR → FLW → SCR → DTM → ARP → HOF, sin huérfanos en ninguna dirección.

### 6. Consolidar la UXS y emitir veredictos

Crea o actualiza `knowledge-base/design/specs/UXS-NNN-<slug>.md` desde `templates/ux-design-spec-template.md`. La UXS no duplica los artefactos: los indexa, resume calidad, expone la matriz de trazabilidad por pantalla, lista bloqueos y emite veredicto por **etapa/consumidor** según `references/role-readiness.md`:

| Consumidor | Qué puede hacer cuando está READY | Skill siguiente |
|---|---|---|
| Stitch | Generar exploración sin inventar | `stitch-ui-generator` |
| Figma | Validar y gobernar el diseño | `figma-design-validator` |
| Desarrollo (Developer + agente IA) | Implementar con contexto de diseño aprobado | `ux-development-handoff` → `development-handoff-builder` |
| QA | Derivar casos de UI y accesibilidad | `test-case-generator` |

Cada veredicto es READY, CONDITIONAL o NOT READY, con razón y bloqueos. Actualiza `knowledge-base/index.md` y `changelog.md`.

### 7. Integrar

Con la auditoría limpia, o los errores restantes declarados, cierra según la sección 4 de `references/worktree-protocol.md`: `graphify update .`, resumen de cambios y decisiones pendientes, y propuesta de merge, PR, conservar o descartar. Espera la respuesta; no hagas commit, merge ni borres el worktree por iniciativa propia.

## Compuertas humanas

Todos los skills UX/UI dejan `status: draft`. Este orquestador mantiene esa línea:

- Nunca asignes `verified`, `approved` ni `human_review.status: approved`, ni registres una validación en nombre de una persona.
- **Elegir entre alternativas, resolver una divergencia Stitch↔Figma, aprobar `governed_design` y aprobar el gate son decisiones humanas.** Regístralas (quién, cuándo, qué, por qué) solo cuando el usuario las aporte con nombre y rol; sin autor identificable, queda como información del usuario.
- Crear un proyecto Stitch exige autorización explícita (`--authorized-by human:<id>`).
- Termina con una lista de **decisiones humanas pendientes**: pregunta, responsable, prioridad y qué desbloquea.

## Reglas de operación

- **Actualizar, no reemplazar.** IDs permanentes (UXR, FLW, SCR, CMP, TKN, GEN, STP, DD, ARP, HOF, DTM). Nunca renumeres ni dupliques.
- **Sin huérfanos.** Todo artefacto de diseño cuelga de FLW/SCR y estos de US/UXR. El DTM es la **única** fuente del vínculo SCR↔Stitch/Figma; no copies referencias externas al SCR.
- **Exploración ≠ diseño gobernado.** Stitch y Claude Design exploran; solo Figma validado gobierna. Al desarrollo nunca se entrega un artefacto Stitch si existe Figma gobernado.
- **No inventar.** Ante un vacío (permiso, estado, contenido, token), abre pregunta. No aceptes contenido que Stitch inventó; anótalo.
- **Accesibilidad es evidencia, no una frase.** Que Stitch diga "WCAG AA" no es evidencia; `pass` solo si se evaluó.
- **Preservar contradicciones** entre fuentes; no elijas por tu cuenta.
- **Verificar en vivo** las referencias Stitch y Figma antes de usarlas; si no se puede, es pregunta abierta, no un dato.
- **Fechas y autoría** en frontmatter OKF v0.2: `generated.by` del skill que produjo el archivo (el de la UXS es `ux-ui-orchestrator/1.0`), `generated.at` ISO 8601 con `-05:00`.
- **Solo diseño.** Si el pedido se desliza a negocio/requerimientos, arquitectura o código, detente y señala el skill de la etapa correspondiente.

## Informe final al usuario

Cierra con un resumen breve, en este orden: escenario y ruta ejecutada; artefactos creados/actualizados; resultado de auditoría, preflight y gate (errores restantes); veredictos por consumidor; decisiones humanas pendientes; siguiente skill recomendado. Declara lo que no se pudo verificar u omitió (p. ej. Stitch/Figma inaccesibles).

## Referencias

- `references/scenarios.md` — ruta, entradas y criterio de salida de cada escenario.
- `references/quality-criteria.md` — atributos de calidad del diseño y cómo evaluarlos.
- `references/role-readiness.md` — qué necesita cada etapa/consumidor y mapa de códigos de error → skill dueño.
- `references/worktree-protocol.md` — aislamiento con git worktree (rama `ux/<slug>`), integración y limpieza.
- `templates/ux-design-spec-template.md` — plantilla de la UXS.
- `scripts/audit_ux.py` — auditoría determinista (`--json` para salida estructurada).

---
name: af-requirements-orchestrator
description: Orquesta los skills af-* (context builder, glosario, reglas, modelo conceptual, user stories) para llevar una iniciativa o cambio a una Especificación de Requerimientos de calidad, con trazabilidad y compuertas humanas, lista como base de los context packs de Arquitecto, QA, Developer y UX/UI. Úsalo siempre que el usuario pida gestionar, completar, auditar o retomar requerimientos de punta a punta, preparar requerimientos para arquitectura/QA/desarrollo/UX, evaluar si las historias están listas, o decida qué skill af-* ejecutar y en qué orden, aunque no nombre ningún skill.
---

# af-requirements-orchestrator

## Propósito

Coordinar a los skills `af-*` para que los artefactos de requerimientos queden **completos, consistentes y trazables entre sí**, y consolidarlos en una **Especificación de Requerimientos (RQS)** con un veredicto de preparación por rol. Un solo skill `af-*` produce un artefacto correcto por sí mismo; lo que falla en la práctica son las costuras: un término usado en una historia que no está en el glosario, una regla citada que no existe, una pregunta abierta que nadie dirigió al skill que puede cerrarla. Este orquestador existe para cerrar esas costuras.

No redacta contenido propio de los artefactos: delega en cada skill y verifica el resultado. No decide por humanos, no aprueba y no genera los context packs de los roles; declara si la base está lista para generarlos y con qué skill.

## Skills que orquesta

| Skill | Produce | Carpeta (`knowledge-base/`) |
|---|---|---|
| `af-requirement-context-builder` | Requirement Context Pack (RCP) | `requirement/context-packs/` |
| `af-business-glossary-curator` | Términos TRM + catálogo GLS | `business/glossary/` |
| `af-business-rule-extractor` | Catálogo de reglas BRC (BR-*) | `business/rules/` |
| `af-conceptual-model-designer` | Modelo conceptual IMD | `business/information-model/` |
| `af-user-story-refiner` | User Stories US-NNN | `requirement/user-stories/` |

Cada skill tiene sus propias reglas de formato y de IDs. Invócalo con la herramienta Skill y deja que él gobierne su salida; no la reescribas aquí.

## Cuándo no usarlo

- Una tarea que toca un solo artefacto y no afecta a los demás (p. ej. "define el término X"): invoca directamente el skill `af-*` correspondiente.
- Generar los context packs de rol, el diseño de arquitectura, UI o código: son etapas posteriores (ver "Salida hacia los roles").

## Flujo

1. **Diagnosticar** el estado actual y el escenario (paso 1).
2. **Planificar** la ruta mínima de skills y mostrarla al usuario antes de ejecutar (paso 2).
3. **Aislar** el trabajo en un git worktree si va a escribir archivos (paso 2b).
4. **Ejecutar** fase por fase, con compuerta entre fases (paso 3).
5. **Cerrar costuras**: enrutar las preguntas y brechas entre skills hasta que no quede nada resoluble sin un humano (paso 4).
6. **Auditar** calidad (paso 5).
7. **Consolidar** la RQS y emitir el veredicto por rol (paso 6).
8. **Integrar**: proponer la incorporación a la rama principal y esperar la decisión (paso 7).

### 1. Diagnosticar

Haz un inventario antes de decidir nada, porque la ruta depende de lo que ya existe:

```
python .claude/skills/af-requirements-orchestrator/scripts/audit_requirements.py knowledge-base
```

Lee además `knowledge-base/index.md` y `changelog.md`, y los RCP, BRC, IMD y GLS existentes del producto. Si el proyecto tiene `graphify-out/GRAPH_REPORT.md`, léelo primero (instrucción del repositorio). Luego clasifica el escenario con `references/scenarios.md` — cada escenario define su ruta, sus entradas mínimas y su criterio de salida:

| Escenario | Señal |
|---|---|
| A. Iniciativa nueva | No hay RCP/IMD/historias del producto |
| B. Cambio sobre producto existente | Hay artefactos y llega un requerimiento, decisión o cambio |
| C. Refinamiento de historias | Hay contexto válido, faltan historias o están en formato legado |
| D. Auditoría y cierre de brechas | Hay historias, hay que saber si están listas |
| E. Decisión humana recibida | Un humano respondió preguntas abiertas o aprobó/rechazó algo |
| F. Fuente nueva o solo vocabulario/reglas | Documento, acta o norma nueva sin cambiar el alcance |
| G. Preparar entrega a roles | El usuario quiere los context packs y falta base |

Si el escenario es ambiguo, pregunta una sola cosa concreta (producto/alcance o fuente autorizada); no adivines el alcance.

### 2. Planificar

Presenta un plan corto: escenario detectado, skills en orden, artefactos que se crearán o actualizarán, qué paraleliza y qué decisiones humanas se esperan. Espera confirmación si el plan crea más de cinco archivos o toca artefactos `approved`. Si el usuario ya pidió ejecutar sin preguntar, procede.

### 2b. Aislar en un worktree

Si la ejecución va a crear o modificar archivos, trabaja en un worktree de git (`req/<slug>`) para que la rama principal no reciba nada hasta que una persona lo decida. Sigue `references/worktree-protocol.md`: detecta si ya estás en uno, pide consentimiento si no hay preferencia declarada, y avisa de lo que quedaría fuera porque está sin commitear en el checkout principal. Las ejecuciones que solo leen no lo necesitan. Todos los skills `af-*` que invocas trabajan dentro de ese mismo worktree.

### 3. Ejecutar por fases

Orden canónico (omite las fases que el escenario no necesita):

| Fase | Skill | Compuerta para pasar a la siguiente |
|---|---|---|
| 1 Contexto | `af-requirement-context-builder` | Alcance legible sin contexto oral; hechos/supuestos/vacíos separados |
| 2 Vocabulario y reglas | `af-business-glossary-curator` + `af-business-rule-extractor` (independientes: ejecútalos en paralelo con subagentes si hay varios) | `glossary.py check` en 0 errores; reglas con fuente y READY/CONDITIONAL |
| 3 Modelo | `af-conceptual-model-designer` | `check_model.py` en 0 errores; cada concepto con término de glosario |
| 4 Historias | `af-user-story-refiner` | Una historia por archivo, sin placeholders, preparación emitida |
| 5 Auditoría | (este skill) | Paso 5 |

Por qué este orden: el glosario y las reglas son insumo de las historias (actores, términos y criterios citan `BR-*` y `TRM-*`); el modelo conceptual necesita los términos; las historias van al final porque son las que más consumen y las más caras de rehacer. Pasa a la fase siguiente solo cuando la compuerta se cumple o cuando una pregunta abierta no bloquea (queda registrada, no se esconde).

Al delegar en un subagente, entrégale: skill a usar, ruta del worktree, alcance, fuentes autorizadas, artefactos existentes a actualizar (no reemplazar) y qué debe devolver (archivos tocados, preparación, preguntas nuevas). Si corren varios en paralelo, indícales que no editen `index.md` ni `changelog.md` y que devuelvan las entradas: las aplicas tú una sola vez, porque editadas en paralelo se pisarían. Verifica sus resultados con la herramienta correspondiente antes de darlos por buenos.

### 4. Cerrar costuras (ruteo de preguntas)

Cada skill deja preguntas y brechas que otro skill puede resolver. Enrútalas con esta tabla y repite hasta el punto fijo (cuando una pasada ya no produce cambios) o hasta quedar solo preguntas que exigen a un humano:

| Hallazgo | Lo resuelve |
|---|---|
| Término de negocio usado sin entrada de glosario | `af-business-glossary-curator` |
| Concepto del modelo sin término; sinónimo nuevo; cambio sobre término aprobado | `af-business-glossary-curator` (pregunta al Responsable si está `approved`) |
| Decisión o regla citada solo en acta/mensaje, no registrada | `af-business-rule-extractor` |
| Criterio o caso con "Sin regla" | `af-business-rule-extractor`; si la fuente no existe, queda como pregunta humana |
| Regla nueva que cambia relaciones o cardinalidad | `af-conceptual-model-designer` |
| Historia que cambia por regla/término/modelo nuevo | `af-user-story-refiner` (actualiza, no recrea) |
| Contradicción entre fuentes | No se resuelve: se preserva y se escala al Responsable |
| Vacío de contexto (actor, proceso, dependencia) | `af-requirement-context-builder` |

Pon un tope: tres pasadas. Si tras la tercera siguen apareciendo brechas, detente y repórtalas; es señal de un problema de alcance o de fuente, no de redacción.

### 5. Auditar calidad

Combina la verificación determinista con tu juicio:

1. Ejecuta `audit_requirements.py` y corrige todo error imputable a un skill (re-invócalo; no edites a mano lo que genera una herramienta).
2. Evalúa los atributos de calidad de `references/quality-criteria.md` (no ambiguo, verificable, singular, consistente, trazable, completo, factible) por historia y a nivel conjunto. Cita evidencia: archivo y sección.
3. Revisa la trazabilidad cruzada: cada historia → reglas `BR-*` y términos `TRM-*`; cada concepto del modelo → término; cada regla → fuente; cada pregunta abierta → responsable y prioridad.

### 6. Consolidar la RQS y emitir veredicto por rol

Crea o actualiza `knowledge-base/requirement/specs/RQS-NNN-<slug>.md` desde `templates/requirements-spec-template.md`. La RQS no duplica el contenido de las historias: las indexa, resume la calidad, expone la matriz de trazabilidad, lista lo que bloquea y emite un veredicto por rol según `references/role-readiness.md`:

| Rol | Context pack que se genera después | Skill siguiente |
|---|---|---|
| Arquitecto | Architecture Context Pack | `architecture-context-builder` (descubrimiento: `architecture-discovery`) |
| QA | Casos de prueba BDD | `test-case-generator` |
| Developer | Development Scope/Context Pack | `development-scope-pack-builder` → `development-handoff-builder` |
| UX/UI | UX Context / UX Requirements | `ux-requirements-analyzer` |

Cada veredicto es READY, CONDITIONAL o NOT READY, con la razón y la lista de bloqueos. Actualiza `knowledge-base/index.md` y `changelog.md`.

### 7. Integrar

Con la auditoría limpia, o con los errores restantes declarados, cierra el aislamiento según la sección 4 de `references/worktree-protocol.md`: `graphify update .`, resumen de cambios y decisiones pendientes, y propuesta de merge, PR, conservar o descartar. Espera la respuesta; no hagas commit, merge ni borres el worktree por iniciativa propia.

## Compuertas humanas

Los skills `af-*` dejan todo en `status: draft`. Este orquestador mantiene esa línea:

- Nunca asignes `verified`, ni cambies a `approved`, ni registres una validación en nombre de una persona.
- Cuando un humano responde o aprueba (escenario E), registra quién, cuándo y qué, y propaga el cambio con el skill dueño. Solo a petición explícita y con nombre y rol se marca `approved`/`verified`.
- Termina cada ejecución con una lista de **decisiones humanas pendientes**: pregunta, responsable, prioridad y qué desbloquea. Es el entregable más útil para quien tiene que actuar.

## Reglas de operación

- **Actualizar, no reemplazar.** Los IDs son permanentes (US-NNN, TRM-NNNN, BR-*, IMD-NNN, RCP-NNN). Nunca renumeres ni dupliques.
- **No inventar.** Ante un vacío, abre pregunta; no completes con una suposición plausible. La ausencia de evidencia es una brecha, no una prueba.
- **Preservar contradicciones** entre fuentes; no elijas una por tu cuenta.
- **Mínimo contexto necesario** y fuentes autorizadas; minimiza datos personales.
- **Fechas y autoría** en frontmatter OKF v0.2: `generated.by` del skill que produjo el archivo (el de la RQS es `af-requirements-orchestrator/1.0`), `generated.at` ISO 8601 con `-05:00`.
- **Solo requerimientos.** Si el pedido se desliza hacia diseño de solución, arquitectura o UI, detente y señala el skill de la siguiente etapa.

## Informe final al usuario

Cierra con un resumen breve, en este orden: escenario y ruta ejecutada; artefactos creados/actualizados; resultado de la auditoría (errores restantes); veredicto por rol; decisiones humanas pendientes; siguiente skill recomendado. Declara con claridad lo que no se pudo verificar o se omitió.

## Referencias

- `references/scenarios.md` — ruta, entradas y criterio de salida de cada escenario.
- `references/quality-criteria.md` — atributos de calidad y cómo evaluarlos.
- `references/role-readiness.md` — qué necesita cada rol para considerar lista la base.
- `references/worktree-protocol.md` — aislamiento con git worktree, integración y limpieza.
- `templates/requirements-spec-template.md` — plantilla de la RQS.
- `scripts/audit_requirements.py` — auditoría determinista (`--json` para salida estructurada).

# Escenarios de gestión del diseño UX/UI

Cada escenario indica la ruta mínima. "Mínima" importa: ejecutar fases que no aportan cuesta tiempo, llama a herramientas externas sin necesidad y arriesga tocar diseño ya gobernado. Todas las rutas terminan en los pasos 5 (auditar) y 6 (UXS y veredicto) de `SKILL.md`, salvo que se indique.

## Contenido
- A. Iniciativa nueva de diseño
- B. Cambio sobre diseño existente
- C. Especificar pantallas
- D. Exploración visual
- E. Diseño gobernado
- F. Auditoría y gate
- G. Decisión humana recibida
- Combinaciones y conflictos

## A. Iniciativa nueva de diseño

**Señal:** hay historias READY/CONDITIONAL (RQS con veredicto UX/UI) y no existen UXR, FLW ni SCR de la iniciativa.

**Entradas mínimas:** historias del alcance, reglas y glosario vigentes, y el Design System o `TKN-SET-*` disponible (si no existe, es pregunta abierta, no se inventa). Si el veredicto UX/UI de la RQS es NOT READY, no arranques: vuelve a `af-requirements-orchestrator`.

**Ruta:** UXR → FLW → SCR/CMP/TKN → (a11y de la spec) → exploración → accesibilidad → Figma gobernado → handoff → auditoría → UXS.

**Salida:** ciclo completo. Es normal que la primera pasada deje CONDITIONAL: prioriza que las preguntas abiertas estén bien dirigidas, no que todo pase el gate. Las fases 4–7 solo se ejecutan para los SCR cuya especificación pasó el preflight.

## B. Cambio sobre diseño existente

**Señal:** hay artefactos de diseño y cambia una historia, una regla, un término o una decisión.

**Entradas mínimas:** el cambio y su fuente; UXR/FLW/SCR/DTM vigentes.

**Ruta:** análisis de impacto (qué UXR, flujos, pantallas, componentes y diseños toca) → actualizar solo lo afectado en el orden canónico → re-explorar y re-validar solo los SCR cambiados. Recorre el DTM: toda entrada `governed_design` de un SCR cambiado queda **en duda** hasta revalidar.

**Atención:** un SCR con `governed_design.status: approved` no se edita en silencio. Un cambio puede invalidar un gate previo (`PASSED`) o un ARP `pass`: dilo explícitamente. En Stitch, la regeneración actualiza dentro del mismo `STP` y pasa la exploración anterior a `superseded`; nunca crea proyecto nuevo.

## C. Especificar pantallas

**Señal:** hay UXR/FLW; faltan SCR, CMP o TKN, o están incompletos (sin `required_states`, `responsive`, `a11y_requirements`).

**Ruta:** verificar que FLW y SCR coinciden en ambos sentidos → `ui-spec-writer` (reutilizando CMP/TKN existentes antes de crear nuevos) → `web-atomic-component-designer` si hay librería de componentes → preflight → auditoría → UXS.

**Atención:** los estados omitidos se justifican o son pregunta abierta; no los inventes. Tokens semánticos, no valores crudos.

## D. Exploración visual

**Señal:** SCR especificados con preflight READY; falta exploración en Stitch o Claude Design.

**Entradas mínimas:** SCR con su FLW y lineage; `STP-*` activo o autorización humana explícita para crearlo.

**Ruta:** resolver proyecto (REUSE del `STP` activo; CREATE solo autorizado) → `stitch-ui-generator` por SCR → `register-exploration` → crítica contra UXR/AC → (opcional) `claude-design-orchestrator` para alternativas → UXS.

**Atención:** verifica en vivo el `project_ref` antes de usarlo. Todo SCR de la iniciativa en el mismo proyecto. La exploración no es diseño gobernado.

## E. Diseño gobernado

**Señal:** existe exploración y falta el diseño en Figma validado, o Stitch y Figma divergen.

**Entradas mínimas:** archivo/nodo Figma por SCR con acceso autorizado. Sin acceso, el resultado es BLOCKED; no asumas el contenido.

**Ruta:** `accessibility-reviewer` sobre el artefacto a gobernar → `figma-design-validator` → si hay divergencia, `claude-design-orchestrator` prepara el Intent Brief y las alternativas y **un humano decide** (DD) → `register-governed` con `--divergence none|resolved|open`.

**Atención:** `governed_design.status: approved` solo con `approved_by: human:<id>` y divergencia no `open`. Al aprobar Figma, la exploración de Stitch pasa a `superseded` y se conserva.

## F. Auditoría y gate

**Señal:** "¿está listo el diseño?", "revisa la calidad", antes de entregar a Desarrollo.

**Ruta:** auditoría (paso 5) primero: `audit_ux.py`, preflight y `gate`. Con los hallazgos, enruta cada brecha al skill dueño con la tabla del paso 4 y vuelve a auditar. No reescribas artefactos desde aquí. Si el gate pasa, `ux-development-handoff` redacta el HOF y deja la revisión humana pendiente.

**Salida:** informe de calidad, UXS actualizada y, si no hay nada que corregir, dilo.

## G. Decisión humana recibida

**Señal:** el usuario trae respuestas a preguntas abiertas, una alternativa elegida, una aprobación de Figma o del gate, o un rechazo.

**Entradas mínimas:** qué se decidió, quién (nombre y rol) y cuándo. Sin autor identificable, regístralo como información del usuario, no como decisión de un Responsable.

**Ruta:** localizar las preguntas que cierra (por ID: UXR-NNN-Qn, FLW-Qn, SCR-Qn, ARP-Qn) → registrar la decisión con el skill dueño (DD vía `claude-design-orchestrator`; `governed_design` vía `figma-design-validator`; gate vía `ux-development-handoff`) → propagar a los artefactos afectados → re-evaluar los veredictos. Si la respuesta cambia una regla o un término de negocio, escálala a `af-requirements-orchestrator`.

**Atención:** cerrar una pregunta deja la fila con estado `Cerrada — <fuente>`; no la borres. La aprobación solo se marca si el usuario la nombra explícitamente.

## Combinaciones y conflictos

- **Dos escenarios a la vez** (p. ej. B y G): resuelve primero G, porque las decisiones cambian el insumo del cambio.
- **Pedido fuera de diseño** (reglas de negocio, arquitectura, código): fuera de alcance; señala el skill siguiente o anterior.
- **Fuentes que se contradicen** (US vs UXR, Stitch vs Figma): preserva ambas, abre pregunta al Responsable y marca el artefacto CONDITIONAL como máximo.
- **Herramienta externa caída** (Stitch o Figma): registra el bloqueo (`BLOCKED`), continúa con lo que no depende de ella y dilo en el informe.

# Escenarios de gestión de requerimientos

Cada escenario indica la ruta mínima. "Mínima" importa: ejecutar fases que no aportan cuesta tiempo y arriesga tocar artefactos estables. Todas las rutas terminan en los pasos 5 (auditar) y 6 (RQS y veredicto) de `SKILL.md`, salvo que se indique.

## Contenido
- A. Iniciativa nueva
- B. Cambio sobre producto existente
- C. Refinamiento de historias
- D. Auditoría y cierre de brechas
- E. Decisión humana recibida
- F. Fuente nueva (vocabulario o reglas)
- G. Preparar entrega a roles
- Combinaciones y conflictos

## A. Iniciativa nueva

**Señal:** no existen RCP, IMD ni historias del producto o iniciativa.

**Entradas mínimas:** producto o iniciativa, objetivo de negocio, alcance conocido (aunque incompleto), fuentes autorizadas. Si falta el objetivo o no hay ninguna fuente, pregunta; sin eso el contexto sería inventado.

**Ruta:** contexto → glosario ∥ reglas → modelo → historias → auditoría → RQS.

**Salida:** ciclo completo. Es normal que la primera pasada deje historias CONDITIONAL: la prioridad es que las preguntas abiertas estén bien dirigidas, no que todo salga READY.

## B. Cambio sobre producto existente

**Señal:** hay artefactos vigentes y llega un requerimiento, un cambio de alcance, una nueva norma o una decisión.

**Entradas mínimas:** el cambio y su fuente; el RCP/BRC/IMD vigentes.

**Ruta:** análisis de impacto sobre lo existente (qué reglas, términos, conceptos e historias toca el cambio) → actualizar solo lo afectado, en orden contexto → glosario ∥ reglas → modelo → historias. Re-evalúa la preparación de las historias que dependen de lo cambiado.

**Atención:** si el cambio afecta artefactos `approved` (términos, reglas), no los edites: abre pregunta al Responsable. Un cambio puede invalidar un READY previo; dilo explícitamente.

## C. Refinamiento de historias

**Señal:** existe contexto válido (RCP, reglas) pero faltan historias, o las existentes están en formato legado (el auditor las marca "formato legado") o son demasiado grandes.

**Entradas mínimas:** RCP o catálogo de historias y reglas.

**Ruta:** verificar que glosario y reglas cubren lo que las historias necesitarán (si no, ejecutar esos skills primero) → `af-user-story-refiner` por historia (nuevas, re-refinadas o divididas) → auditoría → RQS.

**Atención:** re-refinar es actualizar el archivo existente conservando su ID; una división conserva el ID original para una de las partes y asigna el siguiente `US-NNN` libre a las demás.

## D. Auditoría y cierre de brechas

**Señal:** "¿están listas las historias?", "revisa la calidad", antes de entregar a otro rol.

**Ruta:** auditoría (paso 5) primero. Con los hallazgos, enruta cada brecha al skill dueño con la tabla del paso 4 y vuelve a auditar. No reescribas artefactos desde aquí.

**Salida:** informe de calidad y RQS actualizada; si no hay cambios que hacer, dilo.

## E. Decisión humana recibida

**Señal:** el usuario trae respuestas a preguntas abiertas, una aprobación, un rechazo o una decisión nueva.

**Entradas mínimas:** qué se decidió, quién (nombre y rol) y cuándo. Sin autor identificable, regístralo como información del usuario, no como decisión de un Responsable.

**Ruta:** localizar las preguntas que cierra (por ID: P-NN, GQ-NN, RCP-Qn, IM-Qn, US-NNN-Qn) → registrar la decisión como fuente (regla vía `af-business-rule-extractor` si es una regla; aprobación solo si el usuario la nombra explícitamente) → propagar a glosario, modelo e historias afectadas → re-evaluar preparación.

**Atención:** cerrar una pregunta exige que una fuente N1/N2 la responda; deja la fila con estado `Cerrada — <fuente>`, no la borres.

## F. Fuente nueva (vocabulario o reglas)

**Señal:** llega un documento, acta o norma que no cambia el alcance pero aporta términos o reglas.

**Ruta:** solo el skill dueño (glosario y/o reglas) → comprobar efectos sobre modelo e historias (paso 4) → auditoría. Si no hay efectos, termina sin tocar más.

## G. Preparar entrega a roles

**Señal:** "prepara los context packs para arquitectura/QA/dev/UX".

**Ruta:** auditoría → emitir el veredicto por rol (`role-readiness.md`) → si algún rol está NOT READY, la ruta vuelve a D con ese bloqueo como objetivo. No generes los context packs aquí: indica el skill siguiente para cada rol que esté READY o CONDITIONAL, explicando qué riesgos lleva un CONDITIONAL.

## Combinaciones y conflictos

- **Dos escenarios a la vez** (p. ej. B y E): resuelve primero E, porque las decisiones cambian el insumo del cambio.
- **Pedido fuera de requerimientos** (arquitectura, diseño de pantallas, código): fuera de alcance, señala el skill siguiente.
- **Fuentes que se contradicen:** preserva ambas, abre pregunta para el Responsable y marca el artefacto afectado CONDITIONAL como máximo.

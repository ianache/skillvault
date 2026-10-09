# Criterios de calidad de requerimientos

Se adaptan de los atributos de ISO/IEC/IEEE 29148 al formato de User Stories del repositorio. Úsalos en el paso 5: cada hallazgo cita archivo y sección. Un criterio que no puedes sustentar con evidencia del archivo no se da por cumplido.

## Contenido
- Atributos por historia
- Atributos del conjunto
- Severidad y efecto en la preparación
- Señales rápidas de problema

## Atributos por historia

| Atributo | Pregunta de control | Dónde mirar |
|---|---|---|
| Necesario | ¿El actor y el valor están sostenidos por una fuente? | §1, §3, §13 |
| No ambiguo | ¿Dos personas entenderían lo mismo? ¿Hay adjetivos sin medida ("rápido", "fácil", "adecuado")? | §2, §5 |
| Singular | ¿Un comportamiento por historia y por escenario? | §2, §4, §5 |
| Verificable | ¿Cada criterio tiene resultado observable que QA pueda comprobar? | §5, §6 |
| Trazable | ¿Cada criterio cita regla o fuente, y cada regla existe? | §5, §7, §13 |
| Completo | ¿Hay casos negativos y límite (entrada inválida, permiso, vacío, borde)? ¿Estados de interfaz? ¿RNF de accesibilidad y privacidad? | §6, §9, §10 |
| Sin solución | ¿"Quiero" dice una necesidad, no una pantalla, botón o API? | §2 |
| Pequeña | ¿Cabe en una iteración? Si no, ¿hay propuesta de división? | §14, §17 |

## Atributos del conjunto

| Atributo | Pregunta de control |
|---|---|
| Consistente | ¿Las historias, reglas y el modelo se contradicen? (misma regla con valores distintos, cardinalidad que choca con un criterio) |
| Vocabulario único | ¿Todo actor y concepto usa el término del glosario, con el mismo nombre en todos los artefactos? |
| Sin huérfanos | ¿Hay reglas que ninguna historia usa, conceptos sin término, términos sin uso, preguntas sin responsable? |
| Cobertura | ¿Cada capacidad del RCP/visión tiene al menos una historia o una pregunta que explique su ausencia? |
| Dependencias | ¿Los prerrequisitos entre historias están declarados y no forman ciclos? |
| Preguntas dirigidas | ¿Cada pregunta abierta tiene responsable, prioridad y qué bloquea? |

## Severidad y efecto en la preparación

| Severidad | Ejemplo | Efecto |
|---|---|---|
| Bloqueante | Actor o valor sin fuente; criterio central sin regla; contradicción sin resolver sobre el comportamiento central | NOT READY |
| Mayor | Pregunta abierta que bloquea parte del comportamiento; regla citada inexistente; término sin glosario sobre un concepto clave | CONDITIONAL |
| Menor | Casos límite sin comportamiento pero con pregunta; redacción mejorable | No cambia la preparación; se registra |

Un READY exige cero bloqueantes y cero mayores; la validación del PO es pendiente humana, no un criterio que el agente pueda dar por cumplido.

## Señales rápidas de problema

- "Sin regla" en la §6 sin ID de pregunta en la §12.
- Verbos vagos en un criterio: "gestionar", "soportar", "manejar" sin resultado observable.
- Un Entonces con varios resultados independientes: probablemente dos escenarios.
- Historia que cita a otra historia como fuente de una regla: debe citar la fuente original.
- Cifras, plazos o límites sin fuente.
- Mismo concepto con dos nombres entre historias.

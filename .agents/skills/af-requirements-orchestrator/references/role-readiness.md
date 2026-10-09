# Preparación de la base de requerimientos por rol

La RQS emite un veredicto por rol para decidir si ya se puede generar su context pack. El orquestador **no** genera esos packs: indica el skill siguiente. Aplica el veredicto sobre el conjunto de historias en el alcance de la entrega, no sobre todo el repositorio.

## Contenido
- Regla general de veredicto
- Arquitecto
- QA
- Developer
- UX/UI
- Cómo redactar un CONDITIONAL

## Regla general de veredicto

- **READY:** se cumplen todos los mínimos del rol y ningún bloqueante afecta su alcance.
- **CONDITIONAL:** los mínimos están, pero hay preguntas abiertas que afectan parte del trabajo del rol. Lista cada una y qué decisión pospone.
- **NOT READY:** falta un mínimo del rol o hay un bloqueante en su alcance.

## Arquitecto → `architecture-context-builder`

Necesita entender qué problema resolver y qué restricciones lo moldean, antes de diseñar.

Mínimos:
- RCP validado del producto con dependencias, integraciones y restricciones funcionales identificadas.
- Reglas de negocio con fuente que impliquen requisitos de calidad (auditoría, retención, privacidad, disponibilidad).
- Modelo conceptual con relaciones y cardinalidades clasificadas (FACT/INFERENCE/UNKNOWN).
- RNF declarados en las historias; los vacíos en RNF marcados como preguntas, no como "no aplica".
- Preguntas abiertas que afectan integraciones, datos o seguridad, dirigidas a un Responsable.

Riesgo típico de un CONDITIONAL: cardinalidades UNKNOWN que condicionan el modelo de datos.

## QA → `test-case-generator`

Necesita comportamiento verificable sin ambigüedad.

Mínimos:
- Historias con criterios Given/When/Then, uno por comportamiento, con resultado observable.
- Casos negativos y límite con comportamiento esperado (o pregunta explícita; nunca una laguna silenciosa).
- Reglas de negocio citadas y existentes, con valores concretos (plazos, límites, estados).
- Datos y términos del glosario para construir datos de prueba.
- Sin preguntas bloqueantes en los criterios que se van a probar.

Riesgo típico de un CONDITIONAL: casos "Sin regla" que QA tendría que inventar.

## Developer → `development-scope-pack-builder` → `development-handoff-builder`

Necesita alcance acotado, dependencias entre historias y criterios de terminado.

Mínimos:
- Historias READY (o CONDITIONAL con los bloqueos fuera del alcance de la entrega).
- Dependencias y orden entre historias declarados, sin ciclos; prerrequisitos de entrega identificados.
- Reglas con fuente e IDs estables; Definition of Done funcional completa.
- Historias pequeñas, o con división propuesta aceptada.
- Estimación en blanco: la hace el equipo, no la base de requerimientos.

Riesgo típico de un CONDITIONAL: una dependencia no entregada que bloquea la implementación aunque la historia sea legible.

## UX/UI → `ux-requirements-analyzer`

Necesita actores, flujo esperado, estados y contenido clave, no diseño visual.

Mínimos:
- Actor definido con término de glosario y permisos relevantes (qué ve y qué edita cada actor).
- §10 de cada historia con flujo esperado, estados de interfaz (vacío, sin permisos, error, éxito) y contenido clave.
- Accesibilidad WCAG 2.2 AA y privacidad declaradas como RNF.
- Terminología única para etiquetas y mensajes.
- Preguntas abiertas sobre permisos y datos visibles dirigidas a un Responsable.

Riesgo típico de un CONDITIONAL: permisos por actor sin confirmar, que cambian qué pantallas existen.

## Cómo redactar un CONDITIONAL

No basta con la etiqueta. Cada CONDITIONAL en la RQS lleva: qué mínimo no se cumple del todo, qué preguntas (con ID) lo causan, quién debe responder y qué parte del trabajo del rol queda pospuesta si se avanza igual. Así quien decide avanzar lo hace sabiendo el riesgo.

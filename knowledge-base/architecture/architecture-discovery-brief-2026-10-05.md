---
id: ARCH-DISC-2026-10-05-SKILLVAULT
type: architecture-discovery-brief
status: draft
product: SkillVault
initiative: Revisión arquitectónica de planes y especificaciones Superpowers
generated:
  by: architecture-discovery/1.0
  at: 2026-10-05T00:00:00-05:00
sources:
  - docs/superpowers/
  - docs/security.md
---

# Architecture Discovery Brief

## Metadata

- Product: SkillVault
- Initiative: Revisión de `docs/superpowers` (planes y specs de julio de 2026)
- Architect: Pendiente de asignación
- Date: 2026-10-05
- Version: 0.1-draft

## Objective

Construir una visión trazable de las iniciativas documentadas en `docs/superpowers` antes de investigar o diseñar una arquitectura objetivo. El corpus cubre autenticación Keycloak/Auth.js, RBAC, publicación y revisión de skills, versionado, sincronización de usuarios, catálogo/descargas/CLI, shell visual y agentes IA.

Este documento no aprueba una arquitectura objetivo, ASR ni ADR.

## Scope

### In scope

- 37 specs y 37 planes Markdown en `docs/superpowers/`.
- Relaciones entre autenticación/RBAC, usuarios/roles, workflow de revisión/publicación, versionado, autores, catálogo/descargas/CLI y agentes IA.
- Coherencia entre planes y specs, decisiones explícitas, dependencias, NFRs y vacíos que puedan cambiar decisiones posteriores.

### Out of scope

- Validar el código actual, despliegues o comportamiento en ejecución.
- Aprobar decisiones humanas o inferencias.
- Diseñar arquitectura target, consolidar módulos o crear ADRs.
- Tratar los exports visuales o la extracción gráfica fallida como evidencia.

## Actors and capabilities

- Usuario autenticado con roles provenientes de Keycloak; el rol efectivo `user` funciona como fallback cuando no hay un rol reconocido.
- Autor/proponente: crea o modifica skills y recibe solicitudes de revisión.
- Revisor: comenta, solicita cambios, aprueba o rechaza solicitudes.
- Administrador: capacidades ampliadas de administración, usuarios y aprobación.
- Usuario de catálogo: consulta, descarga e instala contenido publicado.
- Operador de QA/Despliegue: configura Helm, Ingress, TLS y variables de autenticación.
- Usuario de agentes IA: gestiona agentes y conversaciones en persistencia local según las specs revisadas.

## Architecture concerns

- Separación entre contenido publicado (`skills`, `skill_files`) y solicitudes de revisión, incluyendo activación atómica.
- Consistencia de roles entre claims de Keycloak, sesión Auth.js, middleware, navegación, APIs y tabla local `users`.
- Control de acceso de `/agents` cuando el módulo no tiene API propia y persiste en `localStorage`.
- Integridad de identidad de autor y sincronización con solicitudes/versiones.
- Compatibilidad de versionado, archivos, descargas ZIP, instalación y publicación.
- Coexistencia de SQLite/MySQL y migraciones idempotentes.
- Seguridad de redirecciones OIDC/logout y configuración por entorno QA.
- Deriva documental entre specs y planes, y entre decisiones sucesivas.
- Frontera entre prototipo frontend/local y futura integración de agentes reales.

## Findings

| ID | Finding | Type | Evidence | Confidence | Notes |
|---|---|---|---|---|---|
| F-001 | La publicación pública debe leer únicamente las tablas publicadas; las solicitudes aprobadas se activan hacia ellas. | FACT | `docs/superpowers/plans/2026-07-19-skill-review-workflow.md:7`; `docs/superpowers/specs/2026-07-19-skill-review-workflow-design.md:46` | Alta | Decisión repetida en plan y spec. |
| F-002 | La activación de una aprobación debe ser atómica a nivel de aplicación y conservar el estado revisable si falla. | FACT | `docs/superpowers/specs/2026-07-19-skill-review-workflow-design.md:114` | Alta | Requiere validar cómo se garantiza transaccionalidad en ambas bases soportadas. |
| F-003 | La extracción de roles de Keycloak se corrige para usar la estructura de roles del cliente, no `profile.roles` en la raíz. | FACT | `docs/superpowers/specs/2026-07-23-admin-approval-permissions-design.md:24-36`; `docs/superpowers/plans/2026-07-23-admin-approval-permissions.md:66-101` | Alta | El detalle de claims debe confirmarse contra el realm QA real. |
| F-004 | La decisión inicial de no persistir el fallback `user` fue revertida; la nueva decisión exige persistirlo y permitir asignarlo. | CONFLICT | `docs/superpowers/plans/2026-07-27-default-user-role-session.md:18`; `docs/superpowers/specs/2026-07-29-persist-user-role-design.md:29-53` | Alta | La spec nueva documenta la reversión; debe tratarse como decisión vigente solo después de validación humana. |
| F-005 | El acceso a `/agents/*` carece de control en la auditoría y se propone alinearlo con `content:manage`. | FACT | `docs/superpowers/specs/2026-07-29-user-role-rbac-audit-design.md:37-45,55-84`; `docs/superpowers/plans/2026-07-29-user-role-rbac-audit.md:5-15` | Alta | El plan afirma que no existe `/api/agents`. |
| F-006 | Los agentes y sus historiales se persisten en `localStorage`, con motor frontend simulado y futura conexión a una API real. | FACT | `docs/superpowers/specs/2026-07-28-agents-feature-design.md:14,23,131`; `docs/superpowers/plans/2026-07-28-agents-feature.md:7-13` | Alta | La persistencia local no debe confundirse con almacenamiento de servidor. |
| F-007 | Existen pares plan/spec sin correspondencia por nombre exacto y al menos un plan sin spec (`categories-drawer-panel`). | FACT | Inventario de `docs/superpowers/plans/` y `docs/superpowers/specs/` realizado el 2026-10-05 | Alta | La diferencia de nombres también puede ocultar equivalencias semánticas. |
| F-008 | Cinco specs no tienen plan con nombre equivalente: loader de publicación, texto de signin, integración de design system, botón de nuevo skill y premium layout. | FACT | Comparación de nombres de archivo en `docs/superpowers/specs/` y `docs/superpowers/plans/` | Alta | Requiere confirmar si son trabajo terminado, pendiente o absorbido por otro plan. |
| F-009 | El workflow contempla SQLite y MySQL, con migraciones separadas. | FACT | `docs/superpowers/plans/2026-07-19-skill-review-workflow.md:9,46`; `docs/superpowers/specs/2026-07-19-skill-review-workflow-design.md` | Media | La compatibilidad operacional y el mecanismo transaccional siguen siendo preguntas. |
| F-010 | Los documentos contienen decisiones de alcance muy locales y explícitas, por ejemplo no ampliar el arreglo de márgenes ni incluir API de agentes. | FACT | `docs/superpowers/plans/2026-07-26-admin-content-edge-margins.md:13`; `docs/superpowers/plans/2026-07-29-user-role-rbac-audit.md:15` | Alta | Deben preservarse al agrupar iniciativas para no expandir alcance silenciosamente. |
| F-011 | La política de seguridad declara RBAC por capacidades, enforcement server-side en `src/proxy.ts`, doble control contra autoaprobación y sincronización Keycloak→DB local. | FACT | `docs/security.md:1-92` | Alta | Se registraron como ADR-001, ADR-002 y ADR-003 en estado `Propuesto`. |

## Explicit NFR and constraints

- Acceso no autorizado debe producir estados/redirecciones diferenciados (`401`/`403` o redirección según superficie).
- La activación de publicación debe ser atómica y no dejar una solicitud aprobada si la activación falla.
- Deben evitarse traversal de rutas en archivos adjuntos de revisión (`../`).
- La integración QA usa el issuer Keycloak `https://oauth2.qa.comsatel.com.pe/realms/Apps`, según los documentos revisados.
- Deben conservarse compatibilidades SQLite/MySQL donde el workflow las declara.
- El estado local de agentes debe sobrevivir recargas, pero actualmente no constituye un backend ni un registro multiusuario.
- Las pruebas propuestas incluyen unitarias, de rutas, migraciones, regresión pública y verificación manual; la evidencia ejecutada no está contenida en este brief.

## Knowledge gaps

- No está identificado el arquitecto responsable de validar las clasificaciones, conflictos y prioridades.
- No hay evidencia en este corpus de qué decisiones fueron implementadas, desplegadas o superseded.
- No está confirmado el contrato real de claims/roles del realm QA ni su mapeo completo a roles locales.
- No está definido el límite de confianza entre la tabla local `users` y Keycloak cuando divergen roles.
- No está demostrado cómo se garantiza la atomicidad de activación en SQLite y MySQL.
- No está definido el tratamiento de concurrencia entre dos revisores o dos versiones del mismo skill.
- No está claro si las descargas/instalaciones deben seguir una versión publicada estable cuando existe una revisión pendiente.
- No está confirmado si `localStorage` para agentes es deliberado solo para MVP o una restricción de producto.
- No existe correspondencia inequívoca entre todos los planes y specs.
- No hay evidencia de accesibilidad, rendimiento, observabilidad, retención de datos o auditoría operativa más allá de menciones puntuales.
- No existe todavía una decisión humana registrada para convertir las tres propuestas de `knowledge-base/architecture/adrs/` en ADRs aceptados.

## Conflicts

1. **Persistencia del rol `user`:** el plan/spec de sesión del 2026-07-27 lo declara fuera de alcance; la spec del 2026-07-29 revierte explícitamente esa decisión y exige persistirlo. La nueva decisión necesita validación humana y una fuente canónica.
2. **Cobertura documental:** hay cinco specs sin plan homónimo y un plan sin spec homónima. No se debe asumir que equivalen, están terminados o fueron reemplazados.
3. **Estado de aprobación:** algunos documentos declaran `Approved`, otros `Propuesto` o no muestran estado visible; falta un registro de autoridad y vigencia.

## Prioritized architecture questions

| Priority | Question | Why it matters | Required evidence |
|---|---|---|---|
| P0 | ¿Cuál es la decisión vigente sobre persistir el rol fallback `user`, y quién la aprobó? | Cambia sesión, usuarios, RBAC y filtros de navegación. | Decisión humana o ADR; estado de implementación y pruebas. |
| P0 | ¿Cuál es la fuente de autoridad cuando Keycloak y `users.roles` divergen? | Evita escalamiento o pérdida de permisos por sincronización. | Contrato de identidad, política de reconciliación y casos de revocación. |
| P0 | ¿Cómo se garantiza la atomicidad de aprobación/activación en SQLite y MySQL? | Una activación parcial puede publicar contenido inconsistente. | Implementación de transacciones, pruebas de fallo y comportamiento de reintento. |
| P1 | ¿Cuál es el estado real de cada plan/spec: pendiente, implementado, superseded o descartado? | Permite separar arquitectura vigente de historial de trabajo. | Git history, PRs/issues, despliegues y validación del responsable. |
| P1 | ¿Qué contrato común gobierna roles en middleware, UI, APIs y navegación? | La auditoría reporta checks distribuidos y riesgo de deriva. | Matriz de capacidades, tabla de rutas y pruebas de cada superficie. |
| P1 | ¿El módulo de agentes seguirá siendo local-only o tendrá persistencia/API multiusuario? | Cambia seguridad, modelo de datos, sincronización y operación. | Decisión de producto y roadmap confirmado. |
| P1 | ¿Qué versión publicada consumen catálogo, ZIP e instalación cuando hay solicitudes o versiones pendientes? | Afecta reproducibilidad y seguridad de artefactos. | Reglas de versionado/publicación y pruebas de regresión. |
| P2 | ¿Qué convenciones resuelven la falta de correspondencia entre planes y specs? | Reduce pérdida de trazabilidad y decisiones obsoletas. | Inventario validado y registro de reemplazos/absorciones. |
| P2 | ¿Qué NFRs operativos faltan para QA/producción? | Sin ellos no se puede evaluar suficiencia arquitectónica. | Objetivos de disponibilidad, auditoría, observabilidad, rendimiento y retención. |

## Human validation

Pendiente de revisión del arquitecto/product owner:

- Confirmar el alcance de esta iniciativa como revisión transversal del corpus.
- Aceptar o rechazar las clasificaciones `FACT`, `CONFLICT` y las inferencias implícitas.
- Confirmar la decisión vigente sobre el rol `user`, el modelo de autoridad de roles y el futuro de agentes.
- Priorizar las preguntas P0–P2 y aportar evidencia de implementación/operación.
- Confirmar qué documentos son canónicos, reemplazados o meramente históricos.

---
artifact: requirement-context-pack
okf: google-okf-v0.2
id: RCP-2026-10-05-SKILLS-PACKAGES
title: Catálogo de paquetes de Skills relacionados por rol
description: Contexto funcional para mantener paquetes de Skills asociados a roles profesionales y compuestos por referencias a Skills relacionados.
tags:
- requirements
- skill-package
- catalog
- roles
generated: "2026-10-05T00:00:00-05:00"
verified: false
status: draft
product: SkillVault
sources:
- https://github.com/ianache/skillvault/blob/master/knowledge-base/requirements/context-packs/RCP-2026-10-05-skills-packages.md
- https://github.com/ianache/skillvault/tree/master/.agents/skills
source_refs:
- id: SRC-SKILL-CATALOG
  title: Registro local de Skills del repositorio
  resource: /.agents/skills/
provenance:
  created_by: af-requirement-context-builder/1.0
  method: legacy-frontmatter-migration-to-okf-v0.2
  confidence: medium
human-reviewed: false
---

# RCP-2026-10-05 — Catálogo de paquetes de Skills relacionados por rol

## 1. Metadata

- Producto o proceso: SkillVault
- Código o iniciativa: SKILL-PACKAGES
- Responsable funcional: Por definir
- Fecha: 2026-10-05
- Pregunta de trabajo: ¿Qué contexto funcional se necesita para mantener un catálogo de paquetes de Skills relacionados y asociarlos a roles profesionales?
- Estado: Borrador / En validación

## 2. Objetivo y alcance

### Objetivo de negocio

Permitir que SkillVault mantenga un catálogo organizado de paquetes de Skills relacionados, de modo que un `Role` pueda identificar el conjunto de Skills que necesita para ejecutar una capacidad o flujo de trabajo.

### Incluido

- Definir un paquete con identidad, nombre, descripción y `Role` asociado.
- Incorporar referencias a uno o más Skills existentes dentro de un paquete.
- Organizar y consultar los Skills relacionados de un paquete.
- Instalar, descargar y ejecutar el conjunto de Skills del paquete.
- Mantener el paquete mediante usuarios con rol Keycloak `author` o `admin`.
- Mostrar un ejemplo inicial de paquete para el rol Analista Funcional.

### Excluido

- Crear o modificar el contenido de los Skills individuales.
- Resolver automáticamente incompatibilidades o dependencias técnicas entre Skills.
- Incorporar `af-requirements-orchestrator` en esta iniciativa; queda fuera por ser un problema del registro de Skills y no de la plataforma SkillVault.

### Restricciones conocidas

- Las referencias deben usar nombres de Skills existentes y verificables.
- El catálogo de paquetes es público por ahora.
- Solo usuarios con rol Keycloak `author` o `admin` pueden mantener paquetes.
- Las relaciones entre paquete y Skill son de pertenencia; no se define orden ni dependencia en esta versión.
- Estados iniciales del paquete: `draft`, `published`, `published_with_deprecated_or_retired_skills` y `retired`.
- `published_with_deprecated_or_retired_skills` significa que el paquete continúa publicado y usable, pero contiene al menos un Skill deprecado o retirado.
- El identificador mencionado por la solicitud `af-conceptual-model-design` no coincide con el Skill registrado; el nombre encontrado es `af-conceptual-model-designer`.
- `af-requirements-orchestrator` aparece en el catálogo de Skills disponible para el entorno, pero no en el registro local `.agents/skills` revisado; su disponibilidad y fuente canónica deben confirmarse antes de incluirlo como referencia publicable.

## 3. Resumen del contexto

La solicitud propone un catálogo de `skills packages` relacionados, organizados según el rol que utiliza el paquete. El caso de uso de referencia es un paquete para un Analista Funcional que agrupa Skills de contexto de requisitos, reglas de negocio, glosario, modelo conceptual, refinamiento de historias y orquestación. El problema funcional parece ser de descubribilidad y organización de capacidades, pero aún no define quién mantiene el catálogo, quién puede usarlo, si las relaciones tienen orden o dependencia, ni si el paquete es solo una vista curada o también una unidad de instalación/ejecución.

## 4. Registro de evidencia

| ID | Hallazgo | Fuente y fragmento | Tipo | Confianza |
|---|---|---|---|---|
| E-001 | Se solicita incorporar un catálogo de paquetes de Skills relacionados organizado por el rol consumidor. | Solicitud humana del 2026-10-05, en esta conversación | Decisión humana / requerimiento inicial | Alta |
| E-002 | El registro local contiene Skills funcionales para requisitos, reglas, glosario, modelo conceptual y User Stories. | `/.agents/skills/af-user-story-refiner/SKILL.md`; `/.agents/skills/af-business-rule-extractor/SKILL.md`; `/.agents/skills/af-business-glossary-curator/SKILL.md`; `/.agents/skills/af-conceptual-model-designer/SKILL.md`; `/.agents/skills/af-requirement-context-builder/SKILL.md` | Hecho | Alta |
| E-003 | El nombre registrado del Skill de modelo conceptual es `af-conceptual-model-designer`. | `/.agents/skills/af-conceptual-model-designer/SKILL.md` | Hecho | Alta |
| E-004 | `af-requirements-orchestrator` no aparece en el registro local `.agents/skills` inspeccionado para este repositorio. | Inventario de `.agents/skills/` realizado el 2026-10-05 | Hecho | Alta |
| E-005 | El mantenimiento está restringido a usuarios con rol Keycloak `author` o `admin`. | Respuesta humana a Q-001/Q-002 del 2026-10-05 | Decisión humana | Alta |
| E-006 | El paquete organiza referencias y también permite instalar, descargar y ejecutar el conjunto. | Respuesta humana a Q-003 del 2026-10-05 | Decisión humana | Alta |
| E-007 | Las relaciones entre paquete y Skill son solo de pertenencia. | Respuesta humana a Q-004 del 2026-10-05 | Decisión humana | Alta |
| E-008 | Un paquete puede continuar publicado y usable cuando contiene Skills deprecados o retirados, mediante el estado `published_with_deprecated_or_retired_skills`. | Respuesta humana a Q-005/Q-006 del 2026-10-05 | Decisión humana / propuesta de nomenclatura | Alta |
| E-009 | El catálogo es público por ahora. | Respuesta humana a Q-008 del 2026-10-05 | Decisión humana | Alta |
| E-010 | `af-requirements-orchestrator` queda fuera de este requerimiento de plataforma. | Respuesta humana a Q-007 del 2026-10-05 | Decisión humana | Alta |
| E-012 | La implementación revisada usa Drizzle; `users.roles` se almacena como arreglo JSON y no se encontró una tabla intermedia ni migraciones Prisma. | `src/lib/db/schema.ts`; `src/lib/db/migrate-users.ts`; inventario del repositorio del 2026-10-05 | Hecho de implementación | Alta |
| E-013 | La relación usuario–`Role` es M:N. | Respuesta humana a IM-Q1 del 2026-10-05 | Decisión humana | Alta |
| E-014 | La asociación `Role`–paquete es conceptual y no se implementará como relación explícita; cualquier usuario puede acceder e instalar paquetes, sin depender de sus roles. | Respuesta humana a IM-Q2 del 2026-10-05 | Decisión humana | Alta |
| E-015 | La relación Skill–paquete es M:N. | Respuesta humana a IM-Q4 del 2026-10-05 | Decisión humana | Alta |
| E-016 | Todos los conceptos del modelo deben pasar al glosario. | Respuesta humana a IM-Q6 del 2026-10-05 | Decisión humana | Alta |

## 5. Hechos confirmados

- Existe una necesidad humana de organizar Skills relacionados como paquetes asociados a roles.
- El ejemplo de paquete funcional incluye Skills de requisitos, negocio y modelado conceptual.
- El nombre verificable es `af-conceptual-model-designer`, no `af-conceptual-model-design`.
- Los Skills individuales tienen contratos y fuentes propias; el paquete debe referenciarlos sin duplicar su contenido.
- Los roles mantenedores son los roles Keycloak `author` y `admin`.
- El catálogo es público por ahora y el paquete puede instalarse, descargarse y ejecutarse como conjunto.
- La relación entre un paquete y sus Skills es pertenencia, sin orden ni dependencia en el alcance actual.
- El estado `published_with_deprecated_or_retired_skills` conserva la publicación y uso del paquete, pero comunica que contiene Skills deprecados o retirados.
- La relación conceptual entre usuarios y `Role` es M:M; la implementación actual la representa mediante `users.roles` como arreglo JSON, pendiente de decidir si requiere normalización física.
- La asociación entre `Role` y paquete es solo conceptual y no gobierna el acceso: cualquier usuario puede acceder e instalar paquetes.
- La relación entre Skill y paquete es M:N.

## 6. Supuestos e hipótesis

- S-01 — El paquete tendrá un identificador estable y una versión; supuesto del agente, confirmar con negocio/arquitectura.
- S-02 — Un Skill puede pertenecer a varios paquetes; hipótesis basada en el carácter reutilizable de los Skills, confirmar con negocio.
- S-03 — La asociación entre `Role` y paquete es conceptual y puede ser M:N; no se implementa explícitamente.
- S-04 — La ejecución del conjunto respeta el contrato operativo de cada Skill; detalle técnico pendiente de diseño.

## 7. Vacíos y preguntas abiertas

| Pregunta | Destinatario | Prioridad | Estado |
|---|---|---|---|
| Q-001 | ¿Quién puede crear, editar, publicar, retirar y ordenar paquetes? | PO / ARQ | Alta | Cerrada: `author` o `admin` |
| Q-002 | ¿Puede un `Role` tener varios paquetes y un paquete asociarse a más de un `Role`? | PO / Negocio | Alta | Cerrada: asociación solo conceptual; no se implementa explícitamente |
| Q-003 | ¿Un paquete solo organiza referencias o también permite instalar/descargar/ejecutar el conjunto? | PO / ARQ | Alta | Cerrada: ambas capacidades |
| Q-004 | ¿Las relaciones entre Skills son ordenadas, opcionales, prerequisito, alternativa o solo pertenencia? | AF / PO | Alta | Cerrada: solo pertenencia |
| Q-005 | ¿Cómo se comporta el paquete cuando un Skill referenciado se retira, cambia de versión o deja de estar disponible? | ARQ / DEV | Alta | Cerrada: continúa usable y cambia de estado |
| Q-006 | ¿Debe existir versionado y estado del paquete (`draft`, `published`, `retired`)? | PO / ARQ | Media | Cerrada: sí; incluye `published_with_deprecated_or_retired_skills` |
| Q-007 | ¿`af-requirements-orchestrator` debe incorporarse al registro local antes de publicarlo en el paquete? | Responsable del catálogo | Alta | Cerrada: fuera de este requerimiento |
| Q-008 | ¿El catálogo será público, autenticado o restringido por rol? | PO / Seguridad | Media | Cerrada: cualquier usuario puede acceder e instalar |

## 8. Mapa funcional

### Actores

- Usuario con rol Keycloak `author`: mantiene paquetes.
- Usuario con rol Keycloak `admin`: mantiene paquetes y puede administrar el catálogo.
- Usuario público: consulta paquetes y puede instalar, descargar y ejecutar el conjunto según las reglas operativas del Skill.

### Procesos y estados

- Crear paquete → editar composición → validar referencias → publicar → consultar → instalar/descargar/ejecutar → retirar.
- Estados del paquete: `draft` → `published` → `published_with_deprecated_or_retired_skills` → `retired`.
- Un paquete en `published_with_deprecated_or_retired_skills` permanece publicado y usable.

### Datos relevantes

- Paquete: identificador, nombre, descripción, `Role`, estado, versión, propietario y fechas.
- Elemento de paquete: referencia a Skill y pertenencia; orden, dependencia y obligatoriedad están fuera del alcance actual.
- Skill: nombre/slug, versión, estado de publicación y fuente de catálogo.
- Rol: tipo y definición de la relación con el paquete.

### Dependencias y consumidores

- Catálogo de Skills y sus identificadores estables.
- Glosario de negocio para `paquete`, `rol`, `Skill relacionado` y `audiencia`.
- User Stories posteriores para administración, consulta y posible instalación.
- Seguridad/RBAC para restringir mantenimiento a roles Keycloak `author` y `admin`; consulta pública por ahora.

## 9. Riesgos y restricciones funcionales

- Un nombre incorrecto puede generar referencias rotas o paquetes no reproducibles.
- Si no se define una política de versionado, un paquete puede cambiar de comportamiento sin trazabilidad.
- Instalar, descargar y ejecutar un conjunto puede requerir reglas técnicas adicionales aunque la relación conceptual sea solo de pertenencia.
- Un paquete público con Skills retirados debe comunicar claramente su estado para evitar expectativas incorrectas.
- Debe evitarse duplicar la definición de un Skill dentro del paquete; el paquete debe preservar provenance hacia el Skill fuente.

## 10. Decisiones y validación humana

| Decisión o validación | Responsable | Evidencia | Fecha |
|---|---|---|---|
| Solicitar un catálogo de paquetes de Skills relacionados por rol. | Usuario solicitante | Solicitud humana del 2026-10-05 | 2026-10-05 |
| Mantener paquetes con roles Keycloak `author` o `admin`. | Usuario solicitante | Respuesta a Q-001/Q-002 | 2026-10-05 |
| Permitir organización, instalación, descarga y ejecución del conjunto. | Usuario solicitante | Respuesta a Q-003 | 2026-10-05 |
| Usar solo pertenencia entre paquete y Skill. | Usuario solicitante | Respuesta a Q-004 | 2026-10-05 |
| Mantener publicado el paquete con estado `published_with_deprecated_or_retired_skills` cuando corresponda. | Usuario solicitante / agente propone nombre | Respuesta a Q-005/Q-006 | 2026-10-05 |
| Mantener el catálogo público por ahora. | Usuario solicitante | Respuesta a Q-008 | 2026-10-05 |

## 11. Knowledge Candidates

| Candidato | Provenance | Verificador | Estado |
|---|---|---|---|
| Skill Package | Solicitud humana del 2026-10-05 | PO / glosario | Pendiente |
| Role Skill Package | Solicitud humana del 2026-10-05 | PO / glosario | Pendiente |
| Related Skill | Solicitud humana y registro `.agents/skills` | PO / glosario | Pendiente |

## 12. Handoff

### Qué puede usar el siguiente rol

- La historia `US-001` como propuesta funcional condicionada.
- El inventario de Skills del ejemplo y la corrección de nombres registrada en E-003/E-004.
- Las preguntas Q-001 a Q-008 para validación.

### Qué debe validar antes de continuar

- Actor propietario y permisos.
- Definición de rol y estado del paquete.
- Si el paquete organiza, instala, ejecuta o combina esas capacidades.
- Semántica de relación, orden y versión de cada Skill.
- Diseño de la ejecución, instalación y descarga sin convertir este requerimiento en un problema de registro de Skills.

### Artefactos relacionados

- `knowledge-base/requirements/user-stories/US-001-catalogo-de-paquetes-de-skills.md`
- `knowledge-base/business/README.md`
- `knowledge-base/architecture/README.md`

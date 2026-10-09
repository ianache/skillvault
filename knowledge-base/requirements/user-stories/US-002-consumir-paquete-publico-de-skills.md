---
artifact: user-story
okf: google-okf-v0.2
id: US-002
title: Consultar, instalar, descargar y ejecutar un paquete público de Skills
description: Como usuario público, quiero consultar un paquete publicado y operar el conjunto de Skills que contiene, para reutilizar una capacidad completa asociada a un rol Keycloak.
tags:
- user-story
- requirements
- skill-package
- public-catalog
- install
- download
- execute
generated: "2026-10-05T00:00:00-05:00"
verified: false
status: draft
product: SkillVault
type: user-story
sources:
- https://github.com/ianache/skillvault/blob/master/knowledge-base/requirements/user-stories/US-002-consumir-paquete-publico-de-skills.md
- https://github.com/ianache/skillvault/blob/master/knowledge-base/requirements/context-packs/RCP-2026-10-05-skills-packages.md
- https://github.com/ianache/skillvault/blob/master/knowledge-base/requirements/user-stories/US-001-catalogo-de-paquetes-de-skills.md
source_refs:
- id: RCP-2026-10-05-SKILLS-PACKAGES
  title: Catálogo de paquetes de Skills relacionados por rol
  resource: /knowledge-base/requirements/context-packs/RCP-2026-10-05-skills-packages.md
- id: US-001
  title: Mantener un catálogo de paquetes de Skills por rol
  resource: /knowledge-base/requirements/user-stories/US-001-catalogo-de-paquetes-de-skills.md
provenance:
  created_by: af-user-story-refiner/2.0
  method: legacy-frontmatter-migration-to-okf-v0.2
  confidence: medium
human-reviewed: false
---

# US-002 — Consultar, instalar, descargar y ejecutar un paquete público de Skills

## 1. Ficha

| Campo | Valor |
|---|---|
| ID | US-002 |
| Épica / capacidad | Consumo de paquetes de Skills |
| Actor | Usuario público |
| Responsable de negocio (PO) | Por definir |
| Prioridad | Must — el alcance validado incluye operar el conjunto del paquete |
| Preparación | CONDITIONAL |

## 2. Historia

**Como** usuario público, **quiero** consultar un paquete publicado y descargarlo, instalarlo y ejecutar su conjunto de Skills, **para** reutilizar una capacidad completa asociada a un rol.

## 3. Alcance

- **Incluye:** consulta del catálogo público; visualización de composición y estado; descarga e instalación del conjunto; ejecución conforme al contrato operativo de cada Skill.
- **Excluye:** crear o editar paquetes; asignar roles Keycloak; modificar Skills individuales; resolver automáticamente incompatibilidades técnicas; ordenar o modelar dependencias entre elementos.

## 4. Criterios de aceptación

### AC-1 — Consultar paquete público

**Dado** un paquete en estado `published` o `published_with_deprecated_or_retired_skills`, **cuando** un usuario consulte el catálogo público, **entonces** debe poder ver su rol Keycloak asociado, composición, estado y versión disponible.

Fuente: RCP-2026-10-05-SKILLS-PACKAGES:E-006,E-008,E-009.

### AC-2 — Descargar e instalar el conjunto

**Dado** un paquete publicado y compatible con el entorno, **cuando** el usuario solicite descargarlo o instalarlo, **entonces** el sistema debe operar el conjunto de referencias del paquete como una unidad y reportar éxito o fallo por una regla técnica pendiente.

Fuente: RCP-2026-10-05-SKILLS-PACKAGES:E-006.

### AC-3 — Ejecutar el conjunto

**Dado** un paquete instalado, **cuando** el usuario solicite ejecutarlo, **entonces** el sistema debe ejecutar los Skills conforme a sus contratos operativos y reportar el resultado sin alterar la composición del paquete.

Fuente: RCP-2026-10-05-SKILLS-PACKAGES:S-04.

## 5. Casos negativos y límite

- Un paquete `draft` o `retired` no debe ofrecerse como paquete público operable.
- Un paquete `published_with_deprecated_or_retired_skills` debe seguir siendo consultable y usable, mostrando su estado especial.
- Si falla la descarga, instalación o ejecución de un elemento, el sistema debe reportar el fallo y no presentarlo como ejecución exitosa; el comportamiento de compensación queda pendiente.

## 6. Reglas de negocio

- **BR-PKG-004:** solo los paquetes publicados son consumibles públicamente.
- **BR-PKG-005:** el estado `published_with_deprecated_or_retired_skills` mantiene la disponibilidad pública, pero debe advertir la condición de sus Skills.
- **BR-PKG-006:** consumir un paquete no concede permisos para mantener su composición ni sus Skills.

## 7. Preguntas abiertas

| ID | Pregunta | Responsable | Prioridad | Bloquea |
|---|---|---|---|---|
| US-002-Q1 | ¿La instalación y descarga entregan un artefacto único, una lista de artefactos o ambos? | ARQ / DEV | Alta | Sí |
| US-002-Q2 | ¿Qué significa ejecutar un conjunto cuando los Skills tienen contratos o precondiciones diferentes? | ARQ / DEV | Alta | Sí |
| US-002-Q3 | ¿Qué política aplica si un Skill retirado permanece dentro del paquete publicado? | PO / ARQ | Alta | Sí |
| US-002-Q4 | ¿Cómo se resuelven versiones y fallos parciales? | ARQ / DEV | Media | Sí |

## 8. Evidencia y trazabilidad

| ID | Hallazgo | Fuente | Clasificación | Confianza |
|---|---|---|---|---|
| EVD-2026-1005-004 | El paquete organiza referencias y permite instalar, descargar y ejecutar el conjunto. | RCP-2026-10-05-SKILLS-PACKAGES:E-006 | decision | high |
| EVD-2026-1005-005 | El catálogo es público por ahora. | RCP-2026-10-05-SKILLS-PACKAGES:E-009 | decision | high |
| EVD-2026-1005-006 | Un paquete publicado con Skills deprecados o retirados permanece usable con estado especial. | RCP-2026-10-05-SKILLS-PACKAGES:E-008 | decision | high |

## 9. INVEST y preparación

| Criterio | ¿Cumple? | Justificación |
|---|---|---|
| Independiente | Parcial | Depende de US-001 para que exista un paquete publicado. |
| Negociable | Sí | El contrato técnico de consumo permanece abierto. |
| Valiosa | Sí | Permite reutilizar un conjunto de Skills como capacidad. |
| Estimable | No | Faltan semántica de ejecución, empaquetado y resolución de versiones. |
| Pequeña (Small) | Parcial | Consulta, instalación, descarga y ejecución agrupan varias capacidades. |
| Testeable | Parcial | Consulta y estados son testeables; la operación técnica requiere diseño. |

- **Estado:** CONDITIONAL
- **Bloqueos de entrega:** contrato de instalación/descarga, semántica de ejecución, versiones y fallos parciales.
- **Siguiente rol o Skill:** `architecture-context-builder`, `api-designer`, `api-security-reviewer`, `data-model-designer`.
- **Decisión humana requerida:** aprobar las reglas técnicas de consumo antes de diseñar la solución.

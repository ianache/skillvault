---
artifact: user-story
okf: google-okf-v0.2
id: US-001
title: Catálogo de paquetes de Skills por rol
description: Como usuario con rol Keycloak author o admin, quiero mantener un paquete de Skills relacionados para un rol, para que el catálogo público ofrezca una agrupación gobernada y reutilizable.
tags:
- user-story
- requirements
- skill-package
- catalog
- roles
generated: "2026-10-05T00:00:00-05:00"
verified: false
status: draft
product: SkillVault
type: user-story
sources:
- https://github.com/ianache/skillvault/blob/master/knowledge-base/requirements/user-stories/US-001-catalogo-de-paquetes-de-skills.md
- https://github.com/ianache/skillvault/blob/master/knowledge-base/requirements/context-packs/RCP-2026-10-05-skills-packages.md
source_refs:
- id: RCP-2026-10-05-SKILLS-PACKAGES
  title: Catálogo de paquetes de Skills relacionados por rol
  resource: /knowledge-base/requirements/context-packs/RCP-2026-10-05-skills-packages.md
provenance:
  created_by: af-user-story-refiner/2.0
  method: legacy-frontmatter-migration-to-okf-v0.2
  confidence: medium
human-reviewed: false
---

# US-001 — Mantener un catálogo de paquetes de Skills por rol

## 1. Ficha

| Campo | Valor |
|---|---|
| ID | US-001 |
| Épica / capacidad | Catálogo de paquetes de Skills |
| Horizonte / release | Por definir |
| Actor | Usuario con rol Keycloak `author` o `admin` |
| Responsable de negocio (PO) | Por definir |
| Prioridad | Must — la solicitud busca incorporar esta capacidad como feature; el PO debe confirmarla |
| Estimación |  |
| Dependencias | RCP-2026-10-05-SKILLS-PACKAGES |
| Preparación | CONDITIONAL |

## 2. Historia

**Como** usuario con rol Keycloak `author` o `admin`, **quiero** crear y mantener un paquete de Skills relacionados asociado a un rol Keycloak, **para** que el catálogo público ofrezca un conjunto gobernado y reutilizable.

## 3. Contexto y valor

- **Problema que resuelve:** Los Skills relacionados están disponibles como unidades individuales y no existe una forma gobernada, según la solicitud, de organizarlos por `Role`. Fuente: RCP-2026-10-05-SKILLS-PACKAGES, E-001.
- **Valor esperado:** Mejorar descubribilidad, organización y reutilización de Skills por `Role`. El valor es una hipótesis pendiente de medición.
- **Métrica o KPI que impacta:** Sin métrica asociada; definir tasa de consulta, uso o adopción del paquete si el PO lo requiere.

## 4. Alcance

- **Incluye:**
  - Crear o mantener la identidad de un paquete.
  - Asociar el paquete a un `Role`.
  - Agregar referencias a Skills existentes.
  - Consultar la composición del paquete.
  - Publicar, retirar o cambiar el estado del paquete según las reglas definidas.
- **Excluye:**
  - Ejecutar, instalar o descargar el paquete como consumidor público; se cubre en US-002.
  - Modificar el contenido de los Skills referenciados.
  - Resolver versionado, permisos y publicación sin decisiones adicionales.

## 5. Criterios de aceptación

### AC-1 — Composición de un paquete

```gherkin
Escenario: Consultar un paquete con Skills relacionados
  Dado un usuario con rol Keycloak `author` o `admin`
  Cuando crea o edita un paquete y agrega referencias válidas a Skills
  Entonces el paquete conserva la asociación al rol Keycloak y la pertenencia de cada Skill
```

- **Regla / fuente:** RCP-2026-10-05-SKILLS-PACKAGES, E-005/E-007.

### AC-2 — Referencia canónica

```gherkin
Escenario: Registrar un Skill existente en un paquete
  Dado un Skill cuyo identificador existe en el catálogo autorizado
  Cuando el responsable agrega la referencia al paquete
  Entonces el paquete conserva el identificador canónico del Skill y no duplica su contenido
```

- **Regla / fuente:** RCP-2026-10-05-SKILLS-PACKAGES, E-002/E-003/E-007.

### AC-3 — Referencia no válida

```gherkin
Escenario: Intentar agregar un Skill no registrado
  Dado un identificador que no existe o no está disponible en el catálogo autorizado
  Cuando el responsable intenta agregarlo al paquete
  Entonces el sistema informa que la referencia requiere validación y no la publica como referencia válida
```

- **Regla / fuente:** RCP-2026-10-05-SKILLS-PACKAGES, E-004/E-006; resultado esperado pendiente de Q-005/Q-007.

## 6. Casos negativos y límite

| Caso | Comportamiento esperado | Fuente o pregunta |
|---|---|---|
| El rol asociado no está definido | Sin regla; no publicar el paquete hasta responder Q-002 | Q-002 |
| El paquete no contiene Skills | Sin regla; decidir si se permite borrador vacío en Q-004 | Q-004 |
| Un Skill referenciado es retirado | Mantener el paquete usable y cambiarlo a `published_with_deprecated_or_retired_skills` si estaba publicado | RCP-2026-10-05-SKILLS-PACKAGES:E-008 |
| El usuario no tiene rol `author` o `admin` | Rechazar el mantenimiento | RCP-2026-10-05-SKILLS-PACKAGES:E-005 |
| Se agrega `af-conceptual-model-design` | Rechazar o resolver al identificador canónico `af-conceptual-model-designer`; confirmar política de alias | E-003 |

## 7. Reglas de negocio aplicables

| ID | Regla | Fuente |
|---|---|---|
| BR-PKG-001 | Una referencia de paquete debe apuntar a un Skill canónico y no duplicar su contenido. | RCP-2026-10-05-SKILLS-PACKAGES, E-002/E-003 |
| BR-PKG-002 | Un paquete debe declarar el rol Keycloak al que está dirigido. | RCP-2026-10-05-SKILLS-PACKAGES, E-005 |
| BR-PKG-003 | Un paquete publicado con Skills deprecados o retirados usa el estado `published_with_deprecated_or_retired_skills` y continúa usable. | RCP-2026-10-05-SKILLS-PACKAGES, E-008 |

## 8. Datos y términos

| Término | Uso en esta historia | Glosario |
|---|---|---|
| Skill Package / paquete de Skills | Colección gobernada de referencias a Skills relacionados | Pendiente de TRM |
| Rol Keycloak | Audiencia a la que está dirigido el paquete y rol que se asigna a usuarios | Pendiente de TRM |
| Skill relacionado | Unidad de capacidad referenciada por el paquete | Pendiente de TRM |
| Analista Funcional | Ejemplo de rol consumidor del paquete | Pendiente de TRM |

## 9. Requisitos no funcionales

- **Accesibilidad:** WCAG 2.2 AA (estándar del repositorio).
- **Privacidad y datos personales:** No aplica al concepto de paquete; validar si se registran propietarios o usuarios.
- **Otros:** Auditoría de cambios y versionado del paquete: requerido; detalle operativo pendiente.

## 10. Consideraciones de UX

- **Flujo esperado:** El usuario autorizado crea o edita un paquete, define su rol Keycloak, agrega Skills canónicos, revisa la composición y publica o retira el paquete.
- **Estados de la interfaz:** vacío, referencia no encontrada, Skill retirado, sin permiso, borrador, publicado, publicado con Skills deprecados/retirados y retirado.
- **Contenido clave:** nombre, descripción, rol, lista de Skills, orden o relación, versión, estado, propietario y fecha de actualización.

## 11. Dependencias, supuestos e hipótesis

- **Depende de:** Catálogo de Skills; RCP-2026-10-05-SKILLS-PACKAGES.
- **Es prerrequisito de:** US-002 — Consultar, instalar, descargar y ejecutar un paquete público.
- **Supuestos:** S-01 a S-04 del Context Pack.
- **Hipótesis del agente:** H-01 — la primera entrega debe separar catálogo/organización de instalación/ejecución para mantener la historia estimable; confirmar con PO.

## 12. Preguntas abiertas

| ID | Pregunta | Responsable | Prioridad | Bloquea | Estado |
|---|---|---|---|---|---|
| US-001-Q1 | ¿Qué reglas técnicas gobiernan publicación, auditoría y versionado? | PO / ARQ | Media | No | Abierta |

## 13. Evidencia y trazabilidad

| ID | Hallazgo | Fuente | Clasificación | Confianza |
|---|---|---|---|---|
| EVD-2026-1005-001 | Se solicita un catálogo de Skills relacionados por rol. | RCP-2026-10-05-SKILLS-PACKAGES:E-001 | fact | high |
| EVD-2026-1005-002 | El mantenimiento corresponde a usuarios con roles Keycloak `author` o `admin`. | RCP-2026-10-05-SKILLS-PACKAGES:E-005 | decision | high |
| EVD-2026-1005-003 | Las relaciones son de pertenencia y el paquete puede continuar usable con estado especial si contiene Skills retirados. | RCP-2026-10-05-SKILLS-PACKAGES:E-007/E-008 | decision | high |

Evidencia compartida: `source_type: human request and repository skill files`, `observed_at: 2026-10-05T00:00:00-05:00`, `freshness: current`, `owner: Analista funcional / PO por definir`.

- **Upstream:** Solicitud humana; RCP-2026-10-05-SKILLS-PACKAGES.
- **Downstream (pendiente):** UXR → FLW → SCR → CMP → AC; diseño de API/modelo; arquitectura y seguridad.

## 14. Evaluación INVEST

| Criterio | ¿Cumple? | Justificación |
|---|---|---|
| Independiente | Sí | Puede implementarse como mantenimiento de catálogo, dependiendo del catálogo canónico de Skills. |
| Negociable | Sí | Orden, versionado, publicación e instalación están abiertos. |
| Valiosa | Parcial | El valor de descubribilidad es plausible, pero no tiene KPI validado. |
| Estimable | Parcial | El mantenimiento está definido; quedan detalles de publicación, auditoría y versionado. |
| Pequeña (Small) | Sí | La instalación, descarga y ejecución se separan en US-002. |
| Testeable | Parcial | La composición y referencia son testeables; permisos y estados están sin regla. |

## 15. Definition of Ready

- [x] El actor y el valor están explicitados como propuesta, con validación pendiente.
- [ ] Los criterios de aceptación son verificables y citan una regla validada.
- [ ] Los casos negativos y límite tienen comportamiento confirmado.
- [x] No hay preguntas abiertas que bloqueen el mantenimiento básico.
- [x] Las dependencias están identificadas.
- [ ] Los términos de negocio están en el glosario.
- [ ] El PO validó la historia.

## 16. Definition of Done (funcional)

- [ ] Todos los criterios de aceptación pasan sus pruebas de aceptación.
- [ ] Los casos negativos y límite están cubiertos por pruebas.
- [ ] La accesibilidad WCAG 2.2 AA está revisada.
- [ ] Los requisitos de privacidad se cumplen.
- [ ] El PO aceptó la historia en la revisión.
- [ ] El catálogo, composición y referencias tienen reglas de versionado y publicación.

## 17. Preparación y validación

- **Estado:** CONDITIONAL
- **Motivo:** El mantenimiento básico está definido para usuarios con roles Keycloak `author` o `admin`; quedan detalles técnicos de publicación, auditoría y versionado.
- **Bloqueos de entrega:** Ninguno funcional para el mantenimiento básico; diseño e implementación requieren cerrar las reglas técnicas pendientes.
- **Propuesta de división (si no es pequeña):** US-002 cubre la consulta pública, instalación, descarga y ejecución del paquete.
- **Siguiente rol o Skill:** `af-business-glossary-curator`, `af-conceptual-model-designer`, luego `api-designer` y `data-model-designer` cuando el contexto sea validado.
- **Decisión humana requerida:** PO y arquitecto deben definir las reglas técnicas de publicación, auditoría y versionado.
- **Validación:** Pendiente · Responsable: PO / arquitecto · Fecha: —

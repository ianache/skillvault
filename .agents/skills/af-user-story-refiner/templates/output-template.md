---
type: User Story
title: "US-NNN — <Título corto con verbo en infinitivo>"
description: "<La historia en una frase: actor, acción y valor>"
tags: [user-story, <horizonte>, <capacidad>, <otros tags opcionales>]
status: draft
generated:
  by: "af-user-story-refiner/2.0"
  at: "<AAAA-MM-DDTHH:MM:SS-05:00>"
sources:
  - id: <id-fuente>
    resource: </ruta/desde/la/raiz.md>
---

# US-NNN — <Título>

## 1. Ficha

| Campo | Valor |
|---|---|
| ID | US-NNN |
| Épica / capacidad | <capacidad o épica de origen, con fuente> |
| Horizonte / release | <H1, H2… o "Por definir"> |
| Actor | <actor tal como lo nombran las fuentes, enlazado al glosario> |
| Responsable de negocio (PO) | <rol que valida y prioriza> |
| Prioridad | <propuesta MoSCoW con motivo; la decide el PO> |
| Estimación | <en blanco: la estima el equipo> |
| Dependencias | <US-NNN, … o —> |
| Preparación | READY / CONDITIONAL / NOT READY |

## 2. Historia

**Como** <actor>, **quiero** <capacidad, sin describir la solución>, **para** <valor de negocio>.

## 3. Contexto y valor

- **Problema que resuelve:** <situación actual, con fuente>
- **Valor esperado:** <resultado observable para el actor o el negocio>
- **Métrica o KPI que impacta:** <KPI con fuente, o "Sin métrica asociada">

## 4. Alcance

- **Incluye:**
  - <comportamiento cubierto por esta historia>
- **Excluye:**
  - <lo que queda fuera, con la historia o la razón que lo cubre>

## 5. Criterios de aceptación

<Un escenario por comportamiento. Cada uno cita la regla o la fuente que lo sostiene. Sin fuente no hay criterio: va a la sección 6 o a la 12.>

### AC-1 — <nombre del escenario>

```gherkin
Escenario: <nombre>
  Dado <contexto inicial>
  Cuando <acción del actor>
  Entonces <resultado observable>
```

- **Regla / fuente:** <BR-… o archivo:Lnn>

## 6. Casos negativos y límite

| Caso | Comportamiento esperado | Fuente o pregunta |
|---|---|---|
| <entrada inválida, permiso ausente, valor en el borde> | <comportamiento sostenido, o "Sin regla"> | <BR-… / archivo:Lnn / ID de la pregunta> |

## 7. Reglas de negocio aplicables

| ID | Regla | Fuente |
|---|---|---|
| <BR-…> | <texto breve> | <archivo:Lnn> |

## 8. Datos y términos

| Término | Uso en esta historia | Glosario |
|---|---|---|
| <término> | <qué dato o concepto usa la historia> | <enlace a TRM-NNNN> |

## 9. Requisitos no funcionales

- **Accesibilidad:** WCAG 2.2 AA (estándar del repositorio).
- **Privacidad y datos personales:** <qué datos personales toca y qué restricción aplica, o "No aplica">
- **Otros:** <rendimiento, auditoría, disponibilidad… solo si una fuente los exige; si no, "Sin requisito identificado">

## 10. Consideraciones de UX

<Qué necesita saber diseño. No es diseño visual.>

- **Flujo esperado:** <pasos del actor, en alto nivel>
- **Estados de la interfaz:** <vacío, sin permisos, error, éxito… los que apliquen>
- **Contenido clave:** <información que el actor necesita ver para decidir>

## 11. Dependencias, supuestos e hipótesis

- **Depende de:** <historias, datos o sistemas, con fuente>
- **Es prerrequisito de:** <historias>
- **Supuestos:** <S-n: afirmación, origen, qué la confirmaría>
- **Hipótesis del agente:** <H-n: inferencia, origen, qué la confirmaría>

## 12. Preguntas abiertas

| ID | Pregunta | Responsable | Prioridad | Bloquea | Estado |
|---|---|---|---|---|---|
| <ID existente o US-NNN-Qn> | <pregunta concreta> | <rol> | Alta / Media / Baja | Sí / No | Abierta |

## 13. Evidencia y trazabilidad

| ID | Hallazgo | Fuente | Clasificación | Confianza |
|---|---|---|---|---|
| <EVD-AAAA-NNNN> | <afirmación> | <archivo:Lnn> | fact / assumption / inference / hypothesis / gap / decision | high / medium / low |

Evidencia compartida: `source_type: <tipo>`, `observed_at: <AAAA-MM-DDTHH:MM:SS-05:00>`, `freshness: <current | aging | stale | unknown>`, `owner: <rol>`.

- **Upstream:** <visión, reglas, context pack, catálogo de historias>
- **Downstream (pendiente):** UXR → FLW → SCR → CMP → AC

## 14. Evaluación INVEST

| Criterio | ¿Cumple? | Justificación |
|---|---|---|
| Independiente | Sí / Parcial / No | <de qué depende y si puede entregarse sola> |
| Negociable | Sí / Parcial / No | <qué detalles quedan abiertos para conversar> |
| Valiosa | Sí / Parcial / No | <valor para el actor o el negocio> |
| Estimable | Sí / Parcial / No | <qué impide estimarla, si algo> |
| Pequeña (Small) | Sí / Parcial / No | <si cabe en una iteración; si no, propuesta de división> |
| Testeable | Sí / Parcial / No | <si los criterios son verificables> |

## 15. Definition of Ready

- [ ] El actor y el valor están sostenidos por una fuente
- [ ] Los criterios de aceptación son verificables y citan su regla o fuente
- [ ] Los casos negativos y límite tienen comportamiento o pregunta asignada
- [ ] No hay preguntas abiertas que bloqueen
- [ ] Las dependencias están identificadas
- [ ] Los términos de negocio están en el glosario, o tienen una pregunta para el glosario
- [ ] El PO validó la historia

## 16. Definition of Done (funcional)

- [ ] Todos los criterios de aceptación pasan sus pruebas de aceptación
- [ ] Los casos negativos y límite están cubiertos por pruebas
- [ ] La accesibilidad WCAG 2.2 AA está revisada
- [ ] Los requisitos de privacidad se cumplen
- [ ] El PO aceptó la historia en la revisión
- [ ] <criterios propios de esta historia, si los hay>

## 17. Preparación y validación

- **Estado:** READY / CONDITIONAL / NOT READY
- **Motivo:** <qué la deja en ese estado: ítems de la DoR sin cumplir y preguntas que bloquean>
- **Bloqueos de entrega:** <historias previas que no existen todavía, o "Ninguno">
- **Propuesta de división (si no es pequeña):** <historias resultantes, o "No aplica">
- **Siguiente rol o Skill:** <p. ej. `ux-requirements-analyzer`>
- **Decisión humana requerida:** <quién debe validar y qué debe responder>
- **Validación:** Pendiente · Responsable: <rol> · Fecha: —

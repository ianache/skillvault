---
type: Requirements Specification
title: "RQS-NNN — <Producto o iniciativa>: especificación de requerimientos"
description: "<Alcance de la especificación en una frase y su estado de calidad global>"
tags: [requirements-specification, <producto>, <horizonte>]
status: draft
generated:
  by: "af-requirements-orchestrator/1.0"
  at: "<AAAA-MM-DDTHH:MM:SS-05:00>"
sources:
  - id: <id-fuente>
    resource: </ruta/desde/la/raiz.md>
---

# RQS-NNN — <Producto o iniciativa>

> Esta especificación indexa y evalúa los artefactos de requerimientos; no los duplica. El contenido vive en cada artefacto enlazado.

## 1. Alcance y escenario

- **Producto / iniciativa:** <nombre>
- **Escenario orquestado:** <A–G de references/scenarios.md>
- **Objetivo de negocio:** <resultado observable, con fuente>
- **Incluye / Excluye:** <resumen del alcance, con fuente>
- **Corte de la entrega:** <historias en el alcance de esta RQS>

## 2. Artefactos del conjunto

| Tipo | ID | Archivo | Estado | Preparación |
|---|---|---|---|---|
| Requirement Context Pack | <RCP-NNN> | <enlace> | draft / approved | <READY/CONDITIONAL/NOT READY> |
| Reglas de negocio | <BRC-NNN> | <enlace> | | |
| Glosario | <GLS-NNN> | <enlace> | | |
| Modelo conceptual | <IMD-NNN> | <enlace> | | |
| User Stories | <US-NNN…> | <enlace a cada una> | | |

## 3. Resultado de la auditoría

- **Herramienta:** `audit_requirements.py` — errores restantes: <n> (<resumen>)
- **Hallazgos de juicio (references/quality-criteria.md):**

| ID | Hallazgo | Severidad | Artefacto y sección | Skill dueño | Estado |
|---|---|---|---|---|---|
| <Q-RQS-n> | <qué está mal> | Bloqueante / Mayor / Menor | <archivo §n> | <skill> | Abierto / Corregido |

## 4. Matriz de trazabilidad

| Historia | Preparación | Reglas BR-* | Términos TRM-* | Conceptos IMD | Preguntas abiertas | Depende de |
|---|---|---|---|---|---|---|
| <US-NNN> | | | | | | |

Huérfanos detectados: <reglas sin historia, conceptos sin término, términos sin uso — o "ninguno">.

## 5. Preguntas abiertas y decisiones humanas pendientes

| ID | Pregunta | Responsable | Prioridad | Bloquea | Desbloquea |
|---|---|---|---|---|---|
| <ID> | | <rol> | Alta / Media / Baja | <US-… / rol> | <qué avanza al responderla> |

## 6. Preparación por rol

| Rol | Veredicto | Razón y bloqueos | Skill siguiente |
|---|---|---|---|
| Arquitecto | <READY/CONDITIONAL/NOT READY> | <mínimos no cumplidos, IDs de preguntas> | `architecture-context-builder` |
| QA | | | `test-case-generator` |
| Developer | | | `development-scope-pack-builder` |
| UX/UI | | | `ux-requirements-analyzer` |

Para cada CONDITIONAL: qué parte del trabajo del rol queda pospuesta si se avanza.

## 7. Registro de orquestación

| Pasada | Skill | Artefactos creados o actualizados | Resultado de su verificación |
|---|---|---|---|
| <1> | <skill> | <IDs> | <p. ej. glossary.py check: 0 errores> |

## 8. Validación humana

- **Estado:** Pendiente
- **Responsable:** <rol>
- **Fecha:** —
- **Decisión humana requerida:** <qué debe validar o decidir la persona>

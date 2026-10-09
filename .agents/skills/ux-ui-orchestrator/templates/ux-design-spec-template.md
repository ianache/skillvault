---
type: UX Design Specification
title: "UXS-NNN — <Producto o iniciativa>: especificación de diseño UX/UI"
description: "<Alcance de la especificación en una frase y su estado de calidad global>"
tags: [ux-design-specification, <producto>, <horizonte>]
status: draft
generated:
  by: "ux-ui-orchestrator/1.0"
  at: "<AAAA-MM-DDTHH:MM:SS-05:00>"
sources:
  - id: <id-fuente>
    resource: </ruta/desde/la/raiz.md>
---

# UXS-NNN — <Producto o iniciativa>

> Esta especificación indexa y evalúa los artefactos de diseño; no los duplica. El contenido vive en cada artefacto enlazado.

## 1. Alcance y escenario

- **Producto / iniciativa:** <nombre>
- **Escenario orquestado:** <A–G de references/scenarios.md>
- **RQS de origen:** <RQS-NNN y su veredicto UX/UI>
- **Historias en alcance:** <US-NNN…>
- **Design System / TKN-SET:** <id, o "ausente — pregunta <ID>">
- **Corte de la entrega:** <flujos y pantallas en el alcance de esta UXS>

## 2. Artefactos del conjunto

| Tipo | ID | Archivo | Estado | Preparación |
|---|---|---|---|---|
| UX Requirement | <UXR-NNN> | <enlace> | draft / approved | <READY/CONDITIONAL/NOT READY> |
| User Flow | <FLW-NNN> | <enlace> | | |
| Screen | <SCR-NNN-NN…> | <enlace> | | |
| Component / Token | <CMP-NNN / TKN-…> | <enlace> | | |
| Exploración | <GEN-NNN / IB-NNN / STP-…> | <enlace> | | |
| Accessibility Report | <ARP-…> | <enlace> | | |
| Design Decision | <DD-NNN> | <enlace> | | |
| Handoff | <HOF-…> | <enlace> | | |
| Traceability Map | <DTM-…> | <enlace> | | |

## 3. Resultado de la auditoría

- **Herramientas:** `audit_ux.py` — errores restantes: <n>; preflight: <READY/BLOCKED + códigos>; gate: <PASSED/FAILED/BLOCKED + códigos, o "no aplica">
- **Hallazgos de juicio (references/quality-criteria.md):**

| ID | Hallazgo | Severidad | Artefacto y sección | Skill dueño | Estado |
|---|---|---|---|---|---|
| <Q-UXS-n> | <qué está mal> | Bloqueante / Mayor / Menor | <archivo §n> | <skill> | Abierto / Corregido |

## 4. Matriz de trazabilidad por pantalla

| SCR | US | UXR | FLW | Estados cubiertos | Exploración | Diseño gobernado | Divergencia | ARP | Preguntas abiertas |
|---|---|---|---|---|---|---|---|---|---|
| <SCR-NNN-NN> | | | | | <STP / —> | <Figma ref / —> | none / resolved / open | <pass / fail / inconclusive> | |

Huérfanos detectados: <UXR sin FLW, SCR sin DTM, CMP sin uso, diseños sin SCR — o "ninguno">.

## 5. Preguntas abiertas y decisiones humanas pendientes

| ID | Pregunta o decisión | Responsable | Prioridad | Bloquea | Desbloquea |
|---|---|---|---|---|---|
| <ID> | | <rol> | Alta / Media / Baja | <SCR-… / consumidor> | <qué avanza al responderla> |

## 6. Preparación por consumidor

| Consumidor | Veredicto | Razón y bloqueos | Skill siguiente |
|---|---|---|---|
| Stitch | <READY/CONDITIONAL/NOT READY> | <mínimos no cumplidos, IDs de preguntas> | `stitch-ui-generator` |
| Figma | | | `figma-design-validator` |
| Desarrollo | | | `ux-development-handoff` |
| QA | | | `test-case-generator` |

Para cada CONDITIONAL: qué parte del trabajo del consumidor queda pospuesta si se avanza.

## 7. Registro de orquestación

| Pasada | Skill | Artefactos creados o actualizados | Resultado de su verificación |
|---|---|---|---|
| <1> | <skill> | <IDs> | <p. ej. preflight: READY> |

**Aislamiento:** <worktree ux/<slug> | sin aislamiento — motivo>. **Efectos externos:** <proyectos Stitch / nodos Figma creados o modificados, o "ninguno">.

## 8. Validación humana

- **Estado:** Pendiente
- **Responsable:** <rol>
- **Fecha:** —
- **Decisión humana requerida:** <qué debe elegir, aprobar o validar la persona>

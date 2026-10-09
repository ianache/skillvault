---
type: Knowledge Base Category
id: KB-CAT-DESIGN
title: Artefactos de diseño
description: Diseños técnicos implementables, contratos API, revisiones de contrato, seguridad API y modelos de datos.
tags: [knowledge-base, design]
status: draft
generated:
  by: skill-creator/1.0
  at: 2026-10-05T00:00:00-05:00
sources:
  - /.agents/skills/api-designer/SKILL.md
  - /.agents/skills/api-contract-reviewer/SKILL.md
  - /.agents/skills/api-security-reviewer/SKILL.md
  - /.agents/skills/data-model-designer/SKILL.md
---

# `knowledge-base/design`

## Propósito

Contener diseños técnicos y revisiones que implementan requisitos y respetan decisiones arquitectónicas aprobadas o explícitamente propuestas.

## Skills registrados

| Skill | Artefactos esperados | Subcarpeta |
|---|---|---|
| `api-designer` | Contratos API implementables, decisiones, riesgos y trazabilidad | `api-contracts/` |
| `api-contract-reviewer` | Revisión de semántica, compatibilidad, ejemplos y testabilidad | `api-reviews/` |
| `api-security-reviewer` | Revisión de identidad, autorización, exposición de datos y abuso | `api-security/` |
| `data-model-designer` | Modelos lógicos/físicos, ownership, constraints y persistencia | `data-models/` |

## Reglas de gate

El estado OKF sigue siendo `status: draft` hasta revisión humana. Los resultados técnicos usan `gate_status: READY_FOR_DEV`, `REQUIRES_REVIEW` o `BLOCKED`; `READY_FOR_DEV` no equivale a aprobación arquitectónica.

## Reglas de salida

Todo artefacto debe incluir OKF v0.2, `generated.by`, `generated.at` con zona `-05:00`, `sources` resolubles, trazabilidad y preguntas abiertas. Nunca fabricar `verified`.

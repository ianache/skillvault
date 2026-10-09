---
type: Knowledge Base Category
id: KB-CAT-ARCHITECTURE
title: Artefactos de arquitectura
description: Descubrimiento, contexto, impacto, requisitos significativos, decisiones y handoffs arquitectónicos.
tags: [knowledge-base, architecture]
status: draft
generated:
  by: skill-creator/1.0
  at: 2026-10-05T00:00:00-05:00
sources:
  - /.agents/skills/architecture-discovery/SKILL.md
  - /.agents/skills/architecture-context-builder/SKILL.md
  - /.agents/skills/architecture-impact-analyzer/SKILL.md
  - /.agents/skills/asr-discovery/SKILL.md
  - /.agents/skills/architecture-adr-writer/SKILL.md
  - /.agents/skills/architecture-development-handoff/SKILL.md
---

# `knowledge-base/architecture`

## Propósito

Contener evidencia y decisiones arquitectónicas sin mezclar descubrimiento, diseño objetivo, implementación o verificación.

## Skills registrados

| Skill | Artefactos esperados | Subcarpeta |
|---|---|---|
| `architecture-discovery` | Brief de descubrimiento, alcance, hechos, supuestos, conflictos y preguntas | `discovery/` |
| `architecture-context-builder` | Architecture Context Pack y gate de preparación para investigación | `context-packs/` |
| `architecture-impact-analyzer` | Matriz de impacto por aplicaciones, datos, seguridad, operación y consumidores | `impact/` |
| `asr-discovery` | Catálogo y candidatos de Architecture Significant Requirements | `asr/` |
| `architecture-adr-writer` | ADRs con decisor, estado, opciones, consecuencias y procedencia | `adrs/` |
| `architecture-development-handoff` | Development Context Pack, trazabilidad, readiness, handoff y open items | `handoffs/` |

## Contenido que no debe aparecer aquí

- Arquitectura target no aprobada.
- ADRs inventados o aceptados sin decisión humana.
- Código, pruebas ejecutadas o evidencia de despliegue.
- Diseños de API o modelos de datos, que pertenecen a `knowledge-base/design/`.

## Reglas de salida

Todo artefacto debe usar OKF v0.2, iniciar en `status: draft`, incluir `generated.by`, `generated.at` con zona `-05:00`, `sources` resolubles y no fabricar `verified`. Actualizar índice y changelog en cada alta, cambio o retiro.

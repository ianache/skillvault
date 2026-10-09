---
type: Knowledge Base Category
id: KB-CAT-IMPLEMENTATION
title: Artefactos de implementación
description: Contextos, notas y evidencia que transfieren diseños aprobados a la implementación.
tags: [knowledge-base, implementation]
status: draft
generated:
  by: skill-creator/1.0
  at: 2026-10-05T00:00:00-05:00
sources:
  - /.agents/skills/architecture-development-handoff/SKILL.md
---

# `knowledge-base/implementation`

## Propósito

Contener artefactos de implementación derivados de decisiones y diseños aprobados, sin convertirlos en código fuente.

## Contenido esperado

- Contextos de desarrollo recibidos desde arquitectura y diseño.
- Notas de implementación y decisiones técnicas de bajo nivel.
- Mapeo de componentes a cambios de código.
- Evidencia de implementación y vínculos a merge requests.
- Restricciones, supuestos y pendientes que el equipo desarrollador debe conocer.

## Skills registrados

No hay un Skill de implementación registrado actualmente en `.agents/skills`. `architecture-development-handoff` entrega insumos para esta disciplina, pero sus artefactos de handoff permanecen en `knowledge-base/architecture/handoffs/`.

## Reglas de salida

Todo futuro artefacto debe usar OKF v0.2, iniciar en `status: draft`, incluir `generated.by`, `generated.at` con zona `-05:00`, `sources` y trazabilidad. La evidencia de código o pruebas no se debe inventar.

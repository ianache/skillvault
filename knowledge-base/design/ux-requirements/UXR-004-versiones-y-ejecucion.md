---
type: UX Requirement
id: UXR-004
title: "UXR-004 — Gestionar versiones y ejecución individual"
description: "La experiencia debe representar si un paquete fija versiones o resuelve la última versión disponible, y debe dejar claro que la ejecución se solicita por Skill, no por paquete."
tags: [ux-ui, ux-requirement, versioning, execution]
status: draft
generated:
  by: "ux-requirements-analyzer/1.0"
  at: "2026-10-07T00:00:00-05:00"
sources:
  - id: dsp
    resource: /knowledge-base/implementation/DSP-2026-001-paquetes-skills-por-rol.md
  - id: us-002
    resource: /knowledge-base/requirements/user-stories/US-002-consumir-paquete-publico-de-skills.md
requirements: [US-002, US-002/AC-3]
---

# UXR-004 — Gestionar versiones y ejecución individual

## Hechos y decisiones humanas

- El paquete puede configurarse con versiones fijadas o con resolución de la última versión disponible.
- El paquete no ejecuta los Skills como conjunto.
- La ejecución se solicita individualmente por Skill.

## Criterios UX candidatos

- La política de versión es visible antes de descargar o instalar.
- Cada Skill instalado expone su acción de ejecución individual cuando corresponda.
- La interfaz no presenta una acción engañosa de “ejecutar paquete”.

## Preguntas abiertas

- Definir el copy de la política de versión y cómo se comunica un cambio entre la versión publicada y la resuelta.

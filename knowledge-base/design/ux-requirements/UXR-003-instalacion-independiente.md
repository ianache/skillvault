---
type: UX Requirement
id: UXR-003
title: "UXR-003 — Instalar Skills de forma independiente"
description: "La experiencia debe mostrar la descarga e instalación de cada Skill como resultado independiente, respetando el harness y la ruta destino definida por cada Skill."
tags: [ux-ui, ux-requirement, installation, harness]
status: draft
generated:
  by: "ux-requirements-analyzer/1.0"
  at: "2026-10-07T00:00:00-05:00"
sources:
  - id: dsp
    resource: /knowledge-base/implementation/DSP-2026-001-paquetes-skills-por-rol.md
  - id: us-002
    resource: /knowledge-base/requirements/user-stories/US-002-consumir-paquete-publico-de-skills.md
requirements: [US-002, US-002/AC-2]
---

# UXR-003 — Instalar Skills de forma independiente

## Hechos y decisiones humanas

- Descargar el paquete está permitido.
- La instalación procesa cada Skill de forma independiente.
- Si falla un Skill, se detiene toda la operación y se revierte lo instalado previamente.

## Criterios UX candidatos

- La pantalla comunica qué Skill se está validando, descargando o instalando.
- El resultado final indica éxito o fallo global y permite conocer el detalle por Skill.
- Durante rollback se comunica que la operación está siendo revertida.

## Preguntas abiertas

- Contrato visual y mensajes exactos de cada harness.
- La experiencia de rollback debe ser confirmada con Desarrollo/Arquitectura.

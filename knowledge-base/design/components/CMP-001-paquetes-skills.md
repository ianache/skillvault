---
type: Component Set
id: CMP-001
title: "CMP-001 — Componentes de paquetes de Skills"
description: "Conjunto candidato de componentes reutilizables para los flows de mantenimiento, consulta e instalación de paquetes."
tags: [ux-ui, component, skill-package]
status: draft
generated:
  by: "ui-spec-writer/1.1"
  at: "2026-10-07T00:00:00-05:00"
sources:
  - id: dsp
    resource: /knowledge-base/implementation/DSP-2026-001-paquetes-skills-por-rol.md
defines: [CMP-PackageCard, CMP-PackageStatus, CMP-SkillReferenceList, CMP-PackageEditor, CMP-InstallProgress, CMP-InstallResult, CMP-RetiredSkillWarning, CMP-VersionPolicy]
---

# CMP-001 — Componentes de paquetes de Skills

## Componentes candidatos

- `CMP-PackageCard`: resumen de paquete para catálogo.
- `CMP-PackageStatus`: estado y versión visibles.
- `CMP-SkillReferenceList`: referencias válidas y omitidas.
- `CMP-PackageEditor`: edición de identidad, rol y composición.
- `CMP-InstallProgress`: progreso por Skill durante instalación.
- `CMP-InstallResult`: resultado global y detalle por Skill.
- `CMP-RetiredSkillWarning`: advertencia no dependiente de color.
- `CMP-VersionPolicy`: representación de `pinned` o `latest`.

## Preguntas abiertas

- Mapear los componentes candidatos al Design System oficial antes de implementación.

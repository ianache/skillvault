---
id: SCR-005
type: Screen
title: "SCR-005 — Detalle público del paquete"
description: "Detalle de composición, política de versión, disponibilidad y acciones de descarga/instalación."
tags: [ux-ui, screen, skill-package, public-catalog]
status: draft
generated:
  by: "ui-spec-writer/1.1"
  at: "2026-10-07T00:00:00-05:00"
sources:
  - id: flow
    resource: /knowledge-base/design/user-flows/FLW-002-consumir-paquete-skills.md
flow: FLW-002
requirements: [US-002, UXR-001, UXR-003, UXR-004]
required_states: [default, loading, empty, error, disabled, retired-skill-warning, unavailable]
responsive: [mobile, desktop]
a11y_requirements: [WCAG-2.2-AA, keyboard-nav, focus-visible, non-color-status]
components: [CMP-PackageStatus, CMP-SkillReferenceList, CMP-VersionPolicy, CMP-RetiredSkillWarning]
tokens: []
design_map: DTM-DSP-2026-001
---

# SCR-005 — Detalle público del paquete

## Trazabilidad

`US-002` → `UXR-001`, `UXR-003`, `UXR-004` → `FLW-002` → `SCR-005`.

## Layout, estados e interacciones

- Mostrar rol, composición, estado, versión y política `pinned`/`latest`.
- Mostrar Skills instalables y Skills omitidos por retiro en grupos distintos.
- Presentar advertencia visible y textual cuando existan Skills retirados.
- Ofrecer descarga y comenzar instalación; no ofrecer “ejecutar paquete”.
- Si el paquete no está disponible, explicar el motivo y deshabilitar acciones operativas.

## Implementation Requirements

### Component Inventory

| Component | Type | Props | Validators | States | A11y |
|---|---|---|---|---|---|
| `CMP-PackageStatus` | status | state, version, policy | package state known | default, warning | non-color status |
| `CMP-SkillReferenceList` | grouped list | installable/omitted Skills | item availability | default, empty | list and group labels |
| `CMP-VersionPolicy` | metadata | policy, resolved version | version data valid | pinned, latest | readable explanation |
| `CMP-RetiredSkillWarning` | alert | retired items | retired status known | warning | role=alert |

### Implementation Checklist

- [ ] Verify no package-level execution control is present.
- [ ] Make download/install actions keyboard accessible.
- [ ] Communicate version policy before confirmation.
- [ ] Map components and tokens to the official Design System.

## Preguntas abiertas

- Copy final de versión resuelta y de Skills omitidos.
- Design System y tokens oficiales no están identificados.

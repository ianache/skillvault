---
id: SCR-003
type: Screen
title: "SCR-003 — Revisión y publicación del paquete"
description: "Revisión final de composición, estado, versión y advertencias antes de publicar o guardar el paquete."
tags: [ux-ui, screen, skill-package]
status: draft
generated:
  by: "ui-spec-writer/1.1"
  at: "2026-10-07T00:00:00-05:00"
sources:
  - id: flow
    resource: /knowledge-base/design/user-flows/FLW-001-mantener-paquete-skills.md
flow: FLW-001
requirements: [US-001, UXR-002]
required_states: [default, loading, empty, error, disabled, publish-success, publish-error]
responsive: [mobile, desktop]
a11y_requirements: [WCAG-2.2-AA, keyboard-nav, focus-visible, non-color-status]
components: [CMP-PackageStatus, CMP-SkillReferenceList, CMP-RetiredSkillWarning]
tokens: []
design_map: DTM-DSP-2026-001
---

# SCR-003 — Revisión y publicación del paquete

## Trazabilidad

`US-001` → `UXR-002` → `FLW-001` → `SCR-003`.

## Layout, estados e interacciones

- Resumir identidad, rol, política de versión y referencias válidas.
- Separar referencias omitidas o no instalables de las referencias publicables.
- Deshabilitar publicar si existe una referencia inválida o una regla de negocio pendiente.
- Confirmar publicación y mostrar el nuevo estado.
- Tras error, conservar el resumen y permitir volver al editor.

## Implementation Requirements

### Component Inventory

| Component | Type | Props | Validators | States | A11y |
|---|---|---|---|---|---|
| `CMP-PackageStatus` | status | state, version, policy | valid package state | draft, published, warning | text status, non-color |
| `CMP-SkillReferenceList` | list | valid/invalid/omitted items | reference status | default, error, empty | list semantics |
| `CMP-RetiredSkillWarning` | alert | omitted retired skills | retired status known | warning | role=alert |

### Implementation Checklist

- [ ] Map components and actions to the official Design System.
- [ ] Ensure publish action has an explicit confirmation.
- [ ] Verify error return path does not discard valid edits.
- [ ] Provide status announcements for success and failure.

## Preguntas abiertas

- Regla final para estados `published_with_deprecated_or_retired_skills` versus omisión completa.
- Design System y tokens oficiales no están identificados.

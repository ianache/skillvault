---
id: SCR-002
type: Screen
title: "SCR-002 — Editor de paquete de Skills"
description: "Edición de identidad, rol, política de versión y referencias canónicas del paquete."
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
required_states: [default, loading, empty, error, disabled, validation-error, draft]
responsive: [mobile, desktop]
a11y_requirements: [WCAG-2.2-AA, keyboard-nav, focus-visible, error-identification]
components: [CMP-PackageEditor, CMP-SkillReferenceList, CMP-VersionPolicy, CMP-RetiredSkillWarning]
tokens: []
design_map: DTM-DSP-2026-001
---

# SCR-002 — Editor de paquete de Skills

## Trazabilidad

`US-001` → `UXR-002` → `FLW-001` → `SCR-002`.

## Layout, estados e interacciones

- Capturar nombre, descripción, rol objetivo y política `pinned`/`latest`.
- Permitir agregar referencias canónicas y retirar referencias del borrador.
- Validar referencias antes de permitir publicar.
- Mantener datos válidos cuando una referencia falla.
- Mostrar advertencia cuando una referencia retirada sea omitida del contenido instalable.
- `disabled`: bloquear guardar/publicar durante validación o falta de permiso.

## Implementation Requirements

### Component Inventory

| Component | Type | Props | Validators | States | A11y |
|---|---|---|---|---|---|
| `CMP-PackageEditor` | form | name, description, role, submit | required fields; async save | default, loading, error, disabled | labels, aria-invalid, error summary |
| `CMP-SkillReferenceList` | combobox/list | canonical skill id, add/remove | canonical reference exists | empty, selected, invalid | keyboard list navigation |
| `CMP-VersionPolicy` | radio/select | pinned/latest, version | policy compatible with package | default, error | group label, selected state |
| `CMP-RetiredSkillWarning` | alert | retired skill count/details | retired status known | warning | role=alert, non-color message |

### Implementation Checklist

- [ ] Map components to the official Design System.
- [ ] Enumerate sync and async validators with API/UX owners.
- [ ] Preserve valid input after validation errors.
- [ ] Define focus placement after validation failure.

## Preguntas abiertas

- Regla para guardar borrador vacío o sin rol.
- Copy y severidad de advertencia por Skill retirado.
- Design System y tokens oficiales no están identificados.

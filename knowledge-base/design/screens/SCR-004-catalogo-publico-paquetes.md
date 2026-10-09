---
id: SCR-004
type: Screen
title: "SCR-004 — Catálogo público de paquetes"
description: "Consulta pública de paquetes publicados y sus estados de disponibilidad."
tags: [ux-ui, screen, skill-package, public-catalog]
status: draft
generated:
  by: "ui-spec-writer/1.1"
  at: "2026-10-07T00:00:00-05:00"
sources:
  - id: flow
    resource: /knowledge-base/design/user-flows/FLW-002-consumir-paquete-skills.md
flow: FLW-002
requirements: [US-002, UXR-001]
required_states: [default, loading, empty, error, disabled]
responsive: [mobile, desktop]
a11y_requirements: [WCAG-2.2-AA, keyboard-nav, focus-visible, non-color-status]
components: [CMP-PackageCard, CMP-PackageStatus]
tokens: []
design_map: DTM-DSP-2026-001
---

# SCR-004 — Catálogo público de paquetes

## Trazabilidad

`US-002` → `UXR-001` → `FLW-002` → `SCR-004`.

## Layout, estados e interacciones

- Mostrar únicamente paquetes disponibles para consulta pública.
- Cada tarjeta muestra nombre, rol, estado, versión y resumen de composición.
- No mostrar paquetes `draft` o `retired` como operables.
- Permitir abrir el detalle del paquete mediante una acción accesible.

## Implementation Requirements

### Component Inventory

| Component | Type | Props | Validators | States | A11y |
|---|---|---|---|---|---|
| `CMP-PackageCard` | card/link | identity, role, state, version | package is public | default, focus | semantic link |
| `CMP-PackageStatus` | status | state, warning | state known | published, warning | text alternative |

### Implementation Checklist

- [ ] Map components to the official Design System.
- [ ] Define empty and error copy with PO/UX.
- [ ] Verify responsive reading order and keyboard navigation.

## Preguntas abiertas

- Filtros y ordenamiento no están definidos por US-002.
- Design System y tokens oficiales no están identificados.

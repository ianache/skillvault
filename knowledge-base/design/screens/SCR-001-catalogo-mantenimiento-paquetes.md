---
id: SCR-001
type: Screen
title: "SCR-001 — Catálogo de paquetes para mantenimiento"
description: "Entrada al mantenimiento de paquetes para usuarios author o admin."
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
required_states: [default, loading, empty, error, disabled, access-denied]
responsive: [mobile, desktop]
a11y_requirements: [WCAG-2.2-AA, keyboard-nav, focus-visible, non-color-status]
components: [CMP-PackageCard, CMP-PackageStatus]
tokens: []
design_map: DTM-DSP-2026-001
---

# SCR-001 — Catálogo de paquetes para mantenimiento

## Trazabilidad

`US-001` → `UXR-002` → `FLW-001` → `SCR-001`.

## Layout, estados e interacciones

- Mostrar título, contexto del catálogo y acción de crear paquete solo a `author`/`admin`.
- Cada tarjeta muestra nombre, rol, estado, versión y cantidad de Skills.
- Estado `empty`: explicar que no existen paquetes mantenibles y ofrecer crear uno si hay permiso.
- Estado `access-denied`: no mostrar acciones de mantenimiento.
- Estado `error`: comunicar fallo de carga y permitir reintentar.

## Implementation Requirements

### Component Inventory

| Component | Type | Props | Validators | States | A11y |
|---|---|---|---|---|---|
| `CMP-PackageCard` | card/link | package identity, role, status, version | package data present | default, focus, disabled | semantic link, accessible name |
| `CMP-PackageStatus` | status | state, version, warning | known package state | default, warning | text alternative, non-color status |

### Implementation Checklist

- [ ] Map components to the official Design System.
- [ ] Define semantic tokens; no raw visual values.
- [ ] Cover loading, empty, error, disabled and access-denied states.
- [ ] Verify keyboard order and visible focus.

## Preguntas abiertas

- Design System y tokens oficiales no están identificados.
- Copy final de permisos y estados requiere validación UX/PO.

---
id: HOF-CL2-TENANT-001
type: UX Development Handoff
title: HOF-CL2-TENANT-001 — UX Development Handoff — Gestión de Tenants
description: Contrato Design-to-Code de SCR-021..023.
tags:
- ux-ui
- example
- clocator2
status: draft
generated:
  by: test-fixture/1.0
  at: '2026-10-01T10:00:00-05:00'
sources:
- id: us-027
  resource: /knowledge-base/requirement/user-stories/US-027.md
initiative: INI-TENANT
dtm_ref: DTM-CL2-TENANT-001
screens:
- SCR-021
- SCR-022
- SCR-023
a11y_reports:
- ARP-SCR-021
- ARP-SCR-022
- ARP-SCR-023
design_decisions:
- DD-001
open_questions:
- id: Q-1
  text: Copy final del botón
  blocking: false
  status: open
assumptions:
- Solo escritorio y móvil
gate:
  name: DESIGN_READY_FOR_DEV
  result: PASSED
  evaluated_at: '2026-10-01T10:30:00-05:00'
  evaluator: validators/cli.py gate --profile example
  findings: []
  human_review:
    status: pending
---

# HOF-CL2-TENANT-001 — UX Development Handoff

> Ejemplo ilustrativo. El gate corrió con `--profile example`; en `production` queda BLOQUEADO por placeholders y revisión humana pendiente.

## A. Requirement Context
US-027 · AC-041, AC-042 · UXR-012 (ver conceptos en `requirement/` y `design/ux-requirements/`).

## B. User Flow
FLW-008 → SCR-021, SCR-022, SCR-023.

## C. Screens
SCR-021 Registro de tienda · SCR-022 Detalle de tienda · SCR-023 Suspensión de tienda.

## D. Governed Design Reference
Figma (aprobado por `human:design-lead`): ver `governed_design` por SCR en DTM-CL2-TENANT-001. Stitch: `exploration_lineage`, no autoritativo (superseded; DD-001).

## E. Components
CMP-011, CMP-014 (por SCR; ver el DTM).

## F. Design Tokens
TKN-color-primary.

## G. Screen States
Cada SCR: default, loading, empty, error, disabled (cubiertos en Figma). El agente no inventa estados adicionales.

## H. Responsive Behavior
mobile y desktop (cubiertos en Figma).

## I. Interaction Rules
Validación al perder foco; el error se anuncia con rol alert; el botón primario pasa a loading durante el envío.

## J. Accessibility Requirements
WCAG-2.2-AA, keyboard-nav. Informes: ARP-SCR-021, ARP-SCR-022, ARP-SCR-023 (pass).

## K. Acceptance Criteria
AC-041, AC-042.

## L. Design Decisions
DD-001.

## M. Open Questions / Assumptions
Q-1 (no bloqueante): copy final del botón. Supuesto: solo escritorio y móvil.

## N. Provenance / Lineage
US-027 → UXR-012 → FLW-008 → SCR-021/022/023 → Stitch (PLACEHOLDER, superseded) → Figma (PLACEHOLDER, approved) → CMP-011/CMP-014 · TKN-color-primary → HOF-CL2-TENANT-001.

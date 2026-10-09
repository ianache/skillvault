---
artifact: angular-library-architecture
okf: google-okf-v0.2
id: ALA-DSP-2026-001
title: "Angular library architecture — package components"
generated:
  by: web-atomic-component-designer/0.2.0
  at: "2026-10-08T00:00:00-05:00"
status: REQUIRES_REVIEW
lifecycle: superseded
superseded_by: react-component-architecture.md
sources:
  - /knowledge-base/design/atomic-components/atomic-component-catalog.md
  - /knowledge-base/design/atomic-components/micro-ui-boundary-analysis.md
provenance:
  created_by: web-atomic-component-designer/0.2.0
  method: library-boundary-proposal
  confidence: low
---

> **Reemplazado por [react-component-architecture.md](react-component-architecture.md) (ADR-004: Next.js/React).** Esta propuesta asumía Angular y una librería `@skillvault/ui/packages`. Se conserva como historial; no es normativo.

# Angular library architecture — package components

## Candidate boundary

`@skillvault/ui/packages` como secondary entry point de una librería de componentes. Es una propuesta, no una decisión aprobada.

## Layers

- `atoms/`: status, icon, filter select.
- `molecules/`: metadata, actions, search result, selected row.
- `organisms/`: card, search panel, skill picker, card grid.
- `templates/`: catalog and editor layout.
- `pages/`: no se recomienda publicarlas desde la librería; pertenecen al portal.

## Dependency policy

Presentational components depend only on Angular CDK/Design System once confirmed. API clients, auth, routing and package services remain in the application.

## Unknowns

Angular version, standalone strategy, CDK/Material policy, SSR requirements, browser matrix and build tool are not present in this repository. Status remains `REQUIRES_REVIEW`.

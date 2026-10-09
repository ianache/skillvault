---
artifact: component-traceability-report
okf: google-okf-v0.2
id: CTR-DSP-2026-001
title: "Component traceability report — package components"
generated:
  by: web-atomic-component-designer/0.2.0
  at: "2026-10-08T00:00:00-05:00"
status: REQUIRES_REVIEW
sources:
  - /knowledge-base/architecture/adrs/ADR-004-nextjs-react-frontend-web.md
  - /knowledge-base/architecture/adrs/ADR-005-storybook-pruebas-de-componentes.md
  - /knowledge-base/design/ux-requirements/UXR-001-catalogo-paquetes.md
  - /knowledge-base/design/ux-requirements/UXR-002-mantenimiento-paquete.md
  - /knowledge-base/design/user-flows/FLW-001-mantener-paquete-skills.md
  - /knowledge-base/design/screens/SCR-001-catalogo-mantenimiento-paquetes.md
  - /knowledge-base/design/screens/SCR-002-editor-paquete-skills.md
  - /knowledge-base/design/components/CMP-001-paquetes-skills.md
provenance:
  created_by: web-atomic-component-designer/0.2.0
  method: us-to-component-traceability
  confidence: medium
---

# Component traceability report — package components

| Upstream | Screen/flow | Component output | Coverage |
|---|---|---|---|
| US-001 | FLW-001 / SCR-001 | CMP-ORG-001, CMP-ORG-002, CMP-ORG-004, CMP-ATOM-001 | candidate |
| US-001 | FLW-001 / SCR-002 | CMP-ORG-003, CMP-MOL-003, CMP-MOL-004 | candidate |
| UXR-001 | SCR-001 | PackageStatus, PackageCard | mapped |
| UXR-002 | SCR-002 | PackageSkillPicker | mapped |
| CMP-001 | SCR-001..006 | package component set | partial |

## Gaps

- SCR-001 requires quantity of Skills per card, but `PackageSummary` currently does not expose it.
- Design System mapping and official tokens are unresolved.
- Angular no aplica: ADR-004 fija Next.js/React. Pendiente la evidencia de Storybook (ADR-005): no está instalado.
- Loading, offline/recovery and access-denied visual references are not provided.

## Gate

`REQUIRES_REVIEW`; not ready for React component implementation in the portal until the gaps, Storybook setup (ADR-005) and ownership decisions are resolved.

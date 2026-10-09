---
artifact: accessibility-matrix
okf: google-okf-v0.2
id: ACM-DSP-2026-001
title: "Accessibility matrix — package components"
generated:
  by: web-atomic-component-designer/0.2.0
  at: "2026-10-08T00:00:00-05:00"
status: REQUIRES_REVIEW
sources:
  - /knowledge-base/architecture/adrs/ADR-004-nextjs-react-frontend-web.md
  - /knowledge-base/architecture/adrs/ADR-005-storybook-pruebas-de-componentes.md
  - /knowledge-base/design/screens/SCR-001-catalogo-mantenimiento-paquetes.md
  - /knowledge-base/design/ux-requirements/UXR-001-catalogo-paquetes.md
  - /knowledge-base/design/atomic-components/atomic-component-catalog.md
provenance:
  created_by: web-atomic-component-designer/0.2.0
  method: wcag-2-2-aa-component-matrix
  confidence: medium
---

# Accessibility matrix — package components

| Component | Keyboard/focus | Name/semantics | Non-color status | Required evidence |
|---|---|---|---|---|
| PackageStatus | n/a or parent order | text status/alert context | required | axe + screen reader |
| PackageCard | link/actions tab order | article + named link | required | keyboard + axe |
| PackageSearchPanel | search → filters → clear | labels and values | n/a | keyboard + axe |
| PackageSkillPicker | search → add → selected controls | named actions per Skill | warnings textual | keyboard + SR |
| CardGrid | parent order | region/list semantics | n/a | responsive + axe |

Target: WCAG 2.2 AA. Exact success criteria, automated tool and assistive technology matrix require confirmation by accessibility owner.

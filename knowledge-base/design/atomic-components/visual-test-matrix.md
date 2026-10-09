---
artifact: visual-test-matrix
okf: google-okf-v0.2
id: VTM-DSP-2026-001
title: "Visual test matrix — package components"
generated:
  by: web-atomic-component-designer/0.2.0
  at: "2026-10-08T00:00:00-05:00"
status: REQUIRES_REVIEW
sources:
  - /knowledge-base/architecture/adrs/ADR-004-nextjs-react-frontend-web.md
  - /knowledge-base/architecture/adrs/ADR-005-storybook-pruebas-de-componentes.md
  - /knowledge-base/design/screens/SCR-001-catalogo-mantenimiento-paquetes.md
  - /knowledge-base/design/screens/SCR-002-editor-paquete-skills.md
  - /knowledge-base/design/atomic-components/atomic-component-catalog.md
provenance:
  created_by: web-atomic-component-designer/0.2.0
  method: visual-scenario-extraction
  confidence: medium
---

# Visual test matrix — package components

| ID | Component | Scenario | Viewports |
|---|---|---|---|
| VIS-001 | PackageCard | draft with actions | desktop/mobile |
| VIS-002 | PackageCard | published and retired warning | desktop/mobile |
| VIS-003 | SearchPanel | empty, filtered and clear | desktop/mobile |
| VIS-004 | CardGrid | one, many and zero cards | desktop/mobile |
| VIS-005 | SkillPicker | no selected Skills | desktop/mobile |
| VIS-006 | SkillPicker | search result and add | desktop/mobile |
| VIS-007 | SkillPicker | ordered selected list and pinned policy | desktop/mobile |
| VIS-008 | All | long localized labels and focus | desktop/mobile |

Escenarios a implementar como stories de Storybook (ADR-005). Baseline tool, browser matrix, pixel threshold and approved reference exports are not identified.

---
id: DTM-CL2-TENANT-001
type: Design Traceability Map
title: DTM-CL2-TENANT-001 — Design Traceability Map — Gestión de Tenants
description: Lineage FLW→SCR→Stitch→Figma→CMP/TKN.
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
traceability:
- screen: SCR-021
  flow: FLW-008
  requirements:
    us:
    - US-027
    ac:
    - AC-041
    - AC-042
    uxr:
    - UXR-012
  exploration_design:
    tool: google-stitch
    project_ref: STP-CL2-TENANT-001
    artifact_ref: PLACEHOLDER:stitch-artifact-SCR-021
    version: PLACEHOLDER:v1
    status: superseded
    latest_known_version: PLACEHOLDER:v1
  governed_design:
    tool: figma
    file_ref: PLACEHOLDER:figma-file
    node_ref: PLACEHOLDER:figma-node-SCR-021
    version: PLACEHOLDER:fv1
    status: approved
    approved_by: human:design-lead
    decision_ref: DD-001
    states_covered:
    - default
    - loading
    - empty
    - error
    - disabled
    responsive_covered:
    - mobile
    - desktop
    latest_known_version: PLACEHOLDER:fv1
  stitch_figma:
    divergence: resolved
    decision_ref: DD-001
  components:
  - CMP-011
  - CMP-014
  tokens:
  - TKN-color-primary
- screen: SCR-022
  flow: FLW-008
  requirements:
    us:
    - US-027
    ac:
    - AC-041
    - AC-042
    uxr:
    - UXR-012
  exploration_design:
    tool: google-stitch
    project_ref: STP-CL2-TENANT-001
    artifact_ref: PLACEHOLDER:stitch-artifact-SCR-022
    version: PLACEHOLDER:v1
    status: superseded
    latest_known_version: PLACEHOLDER:v1
  governed_design:
    tool: figma
    file_ref: PLACEHOLDER:figma-file
    node_ref: PLACEHOLDER:figma-node-SCR-022
    version: PLACEHOLDER:fv1
    status: approved
    approved_by: human:design-lead
    decision_ref: DD-001
    states_covered:
    - default
    - loading
    - empty
    - error
    - disabled
    responsive_covered:
    - mobile
    - desktop
    latest_known_version: PLACEHOLDER:fv1
  stitch_figma:
    divergence: resolved
    decision_ref: DD-001
  components:
  - CMP-011
  - CMP-014
  tokens:
  - TKN-color-primary
- screen: SCR-023
  flow: FLW-008
  requirements:
    us:
    - US-027
    ac:
    - AC-041
    - AC-042
    uxr:
    - UXR-012
  exploration_design:
    tool: google-stitch
    project_ref: STP-CL2-TENANT-001
    artifact_ref: PLACEHOLDER:stitch-artifact-SCR-023
    version: PLACEHOLDER:v1
    status: superseded
    latest_known_version: PLACEHOLDER:v1
  governed_design:
    tool: figma
    file_ref: PLACEHOLDER:figma-file
    node_ref: PLACEHOLDER:figma-node-SCR-023
    version: PLACEHOLDER:fv1
    status: approved
    approved_by: human:design-lead
    decision_ref: DD-001
    states_covered:
    - default
    - loading
    - empty
    - error
    - disabled
    responsive_covered:
    - mobile
    - desktop
    latest_known_version: PLACEHOLDER:fv1
  stitch_figma:
    divergence: resolved
    decision_ref: DD-001
  components:
  - CMP-011
  - CMP-014
  tokens:
  - TKN-color-primary
---

# DTM-CL2-TENANT-001 — Design Traceability Map

> Ejemplo ilustrativo; referencias `PLACEHOLDER:`.

| Flow | Screen | Stitch (exploración) | Figma (gobernado) | CMP | TKN | US / AC / UXR |
|---|---|---|---|---|---|---|
| [FLW-008](../user-flows/FLW-008.md) | [SCR-021](../screens/SCR-021.md) | `PLACEHOLDER:stitch-artifact-SCR-021` (superseded) | `PLACEHOLDER:figma-node-SCR-021` (approved) | CMP-011, CMP-014 | TKN-color-primary | US-027 / AC-041, AC-042 / UXR-012 |
| [FLW-008](../user-flows/FLW-008.md) | [SCR-022](../screens/SCR-022.md) | `PLACEHOLDER:stitch-artifact-SCR-022` (superseded) | `PLACEHOLDER:figma-node-SCR-022` (approved) | CMP-011, CMP-014 | TKN-color-primary | US-027 / AC-041, AC-042 / UXR-012 |
| [FLW-008](../user-flows/FLW-008.md) | [SCR-023](../screens/SCR-023.md) | `PLACEHOLDER:stitch-artifact-SCR-023` (superseded) | `PLACEHOLDER:figma-node-SCR-023` (approved) | CMP-011, CMP-014 | TKN-color-primary | US-027 / AC-041, AC-042 / UXR-012 |

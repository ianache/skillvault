---
artifact: component-specification
okf: google-okf-v0.2
id: CMP-EXAMPLE-001
title: Example component specification
generated: YYYY-MM-DD
verified: false
status: REQUIRES_REVIEW
sources:
  - ../DTC-104/technical-design-context.md
provenance:
  created_by: web-atomic-component-designer
  method: derived-from-approved-design
  confidence: medium
visual_design:
  tool: stitch            # stitch | claude-design
  project_id: ""
  screen_id: ""
  url: ""
  design_system: ""
  covers: []              # variants/states/breakpoints in the design
  status: pending         # linked | pending | waived
  last_synced: YYYY-MM-DD
  waiver_reason: ""
---

# Component Specification

## Identity

- Component ID: `CMP-...`
- Name and selector:
- Atomic level: atom | molecule | organism | template | page
- Purpose:
- Non-goals:
- Owner:
- Consumers:

## Composition

- Allowed children:
- Parent contexts:
- Dependency direction:
- Reuse rationale:
- Existing component search and decision:

## Component contract

```ts
export interface ExampleComponentInputs {
  // stable public inputs
}

export type ExampleComponentEvent = {
  type: string;
  // public event payload
};
```

- Component name or selector:
- Framework strategy (from the accepted ADR; for example client/server boundary or standalone/module):
- Inputs/props and defaults:
- Outputs/callbacks:
- Children or projection slots:
- State, signals or observables:
- Side effects and services:
- Public export path:

## Behavior and visual contract

| Dimension | Specification |
|---|---|
| Variants | |
| Sizes | |
| Loading | |
| Success | |
| Empty | |
| Error | |
| Disabled | |
| Offline/recovery | |
| Responsive breakpoints | |
| Localization | |
| Design tokens | |

## Visual design

See `visual-design-link-template.md`. Frontmatter `visual_design` must match this section.

- Tool: Stitch | Claude Design
- Design link:
- Project / screen id:
- Design system:
- Covered variants, states, breakpoints:
- Known gaps between design and spec:
- Developer instruction: implement against this design AND this specification; do not infer visuals from the spec alone.

## Accessibility and security

- WCAG target and applicable success criteria:
- Accessible name and role:
- Keyboard order and shortcuts:
- Focus management:
- Screen-reader behavior:
- Contrast and motion rules:
- Sensitive data and rendering constraints:
- Security findings or assumptions:

## Verification

- Unit tests:
- Interaction tests:
- Accessibility tests:
- Visual regression scenarios:
- Consumer contract tests:
- Performance budget:
- Acceptance criteria:

## Change and lifecycle

- Change classification: additive | compatible | breaking | unknown
- Semver impact (only if published as a library):
- Deprecation or migration path:
- Open questions:
- Human review event: not set by agents

## Traceability

- User Story:
- ASR:
- ADR:
- DTC-104 page or journey:
- QA cases:
- Internal links:

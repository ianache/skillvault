# Design-to-Code contract and DESIGN_READY_FOR_DEV (ux-development-handoff 2.0)

## HOF sections (A–N)
Each section is required; write **references and only the facts that live nowhere else** (interaction rules, handoff-specific decisions).

| § | Section | Source of truth (reference, do not copy) |
|---|---|---|
| A | Requirement Context | REQ, US, AC, UXR |
| B | User Flow | FLW |
| C | Screens | SCR (one row per screen; ID + name) |
| D | Governed Design Reference | DTM `governed_design` (Figma file, node, version); Stitch only as `exploration_lineage` |
| E | Components | SCR/DTM `components` → CMP |
| F | Design Tokens | SCR/DTM `tokens` → TKN |
| G | Screen States | SCR `required_states` vs DTM `states_covered` (default, loading, empty, error, disabled + explicit others) |
| H | Responsive Behavior | SCR `responsive` vs DTM `responsive_covered` |
| I | Interaction Rules | written here when absent from SCR (validation timing, focus, keyboard, transitions) |
| J | Accessibility Requirements | SCR `a11y_requirements` + `ARP-*` reports |
| K | Acceptance Criteria | AC |
| L | Design Decisions | DD |
| M | Open Questions / Assumptions | HOF frontmatter `open_questions`, `assumptions` |
| N | Provenance / Lineage | the chain table (see below) |

The legacy Component Inventory / checklist (`implementation-requirements.md`) remains a valid appendix.

## Lineage table (section N)
`US → UXR → FLW → SCR → Stitch artifact (exploration) → Figma node (governed) → CMP/TKN → HOF`. The gate returns this chain per screen (`chain`).

## Gate result semantics
| Result | Meaning | Examples |
|---|---|---|
| PASSED | Automatic checks pass. Human review still pending | — |
| BLOCKED | A decision or input is missing; the agent must not fill it | `MISSING_GOVERNED_DESIGN`, `STITCH_FIGMA_DIVERGENCE`, `BLOCKING_OPEN_QUESTION`, `MISSING_FLOW_REFERENCE`, `MISSING_REQUIREMENT_LINEAGE`, production `PLACEHOLDER_REFERENCE` / `HUMAN_REVIEW_PENDING` |
| FAILED | An artifact is defective | `ORPHAN_SCREEN`, `MISSING_SCREEN_STATE`, `MISSING_RESPONSIVE_RULE`, `MISSING_ACCESSIBILITY_REQUIREMENT`, `MISSING_COMPONENT_REFERENCE`, `MISSING_TOKEN_REFERENCE`, `STALE_*_REFERENCE`, `WRONG_STITCH_PROJECT`, `MULTIPLE_ACTIVE_STITCH_PROJECTS` |

`FAILED` prevails over `BLOCKED`. Table of every code: `docs/skills-regeneration/DESIGN-READY-FOR-DEV-GATE.md`.

## Human decision
`gate.human_review: {status: pending|approved|rejected, reviewer: human:<id>, at: …}`. An `approved` status written without a `human:` reviewer is read as `pending`.

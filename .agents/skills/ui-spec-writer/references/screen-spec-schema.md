# Screen Specification schema (ui-spec-writer 1.1)

Additive to the 1.0 `Screen` concept. A 1.0 SCR without these fields stays valid OKF but fails the preflight/gate until migrated.

```yaml
id: SCR-021                        # or SCR-NNN-NN for sub-screens
type: Screen
flow: FLW-008                      # must list SCR-021 in its `screens`
requirements: [US-027, AC-041, AC-042, UXR-012]
required_states: [default, loading, empty, error, disabled]   # + explicit extra states from the flow
responsive: [mobile, desktop]      # breakpoints that need a design
a11y_requirements: [WCAG-2.2-AA, keyboard-nav, focus-visible]
components: [CMP-011, CMP-014]     # must resolve to concepts
tokens: [TKN-color-primary]        # must resolve to concepts (gate)
design_map: DTM-CL2-TENANT-001     # pointer only
```

Several screens in one file:

```yaml
type: Screen
screens:
  - {id: SCR-022, flow: FLW-008, requirements: […], required_states: […], …}
  - {id: SCR-023, …}
```

Rules
- The generation-readiness of a SCR is **derived** (flow + requirements + required_states + responsive + a11y_requirements + components); there is no `ready` flag to forget.
- No Stitch/Figma references here. They live in the DTM.
- Requirement IDs must resolve (US/AC/UXR concepts exist).
- Tokens may be absent until a design system exists (UXR-Q4): record it as an open question; the gate fails until resolved.
- A token ID resolves if a concept of that ID exists **or** any concept lists it under `defines:` (e.g. a `Design Tokens` set such as `TKN-SET-001`).
- `kind: reference-sheet` marks a screen that documents states/messages rather than a flow step; it still needs a governed design.

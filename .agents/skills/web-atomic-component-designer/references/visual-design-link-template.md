# Visual design link contract

Every CMP-* specification (atom, molecule, organism, template, page) must point to a real visual design in **Google Stitch** or **Claude Design**. The spec defines behavior and API; the visual design is the source of truth for look, spacing, tokens, variants and states. Developers must consult both.

## Tool selection

| Condition | Tool |
|---|---|
| Project/design system is already defined in Stitch (Google, Material-aligned) | `stitch` |
| Project/design system is already defined in Claude Design | `claude-design` |
| Neither exists | Ask the owner; do not choose silently. Record `status: pending` until decided. |

Use one tool per component. Reuse the same tool and design system across the whole catalog unless an ADR says otherwise.

## What to design per Atomic level

| Level | Design artifact |
|---|---|
| Atom | Specimen screen: all variants x sizes x states (default, hover, focus, disabled, error, loading) |
| Molecule | Specimen screen: composition with its atoms, all states, responsive variants |
| Organism | Section screen: all states (loading, empty, error, populated) at each breakpoint |
| Template | Layout screen with slot placeholders, all breakpoints |
| Page | Full-journey screens: one per state and breakpoint (default, empty, error, loading) |

Atoms and molecules are not standalone pages in either tool: group them as specimen screens inside the design project and reference the specific screen (and frame/section when supported).

## Frontmatter block (required in each CMP-*)

```yaml
visual_design:
  tool: stitch            # stitch | claude-design (may be empty only while status is pending)
  project_id: ""          # Stitch project id or Claude Design project id
  screen_id: ""           # Stitch screen id or Claude Design frame/artifact id
  url: ""                 # openable link, when the tool provides one
  screen_id_dark: ""      # only when the product supports light and dark; its own screen
  url_dark: ""
  design_system: ""       # design system id/name applied to the screen
  covers: []              # variants/states/breakpoints present in the design
  status: pending         # linked | pending | waived
  last_synced: YYYY-MM-DD
  waiver_reason: ""       # required only when status is waived
```

## Rules

- Never invent ids or URLs. Obtain them from the tool (Stitch: `list_projects`, `list_screens`, `get_screen`, `generate_screen_from_text`; Claude Design: its project/artifact listing). If the tool is unavailable, set `status: pending` and report the failure.
- `status: linked` requires `tool`, `project_id`, `screen_id` and `covers` to be filled and every state in the spec's behavior table to appear in `covers`, or be listed as a gap in Open questions.
- `status: waived` is allowed only with `waiver_reason` and a named human owner; the component then cannot be `READY_FOR_DEV` without review.
- If spec and design disagree, record both, do not silently pick one, and set `REQUIRES_REVIEW`.
- When the design changes, update `last_synced` and re-check `covers`.
- Design tokens in the design must match `design-token-contract.md`; mismatches are findings.
- Shared screens are allowed (one specimen screen for several atoms), but each CMP-* must name the exact section/variant it owns in `covers`.

## Body section (required in each CMP-*)

```markdown
## Visual design

- Tool: Stitch | Claude Design
- Design link: <url>
- Project / screen id:
- Design system:
- Covered variants, states, breakpoints:
- Known gaps between design and spec:
- Developer instruction: implement against this design AND this specification; do not infer visuals from the spec alone.
```

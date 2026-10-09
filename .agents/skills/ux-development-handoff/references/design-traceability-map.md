# Design Traceability Map (DTM) schema

One DTM per initiative, `knowledge-base/design/traceability/DTM-*.md`, `type: Design Traceability Map`. Machine-readable: frontmatter `traceability:`. Human-readable: the Markdown table in the body (links to the concepts; no copied content).

```yaml
id: DTM-<PRODUCT>-<INITIATIVE>-NNN
initiative: <initiative-id>
traceability:
  - screen: SCR-…              # required, must resolve to a Screen
    flow: FLW-…                # required, must equal the SCR's flow
    requirements: {us: [], ac: [], uxr: []}   # at least one
    exploration_design:        # Stitch (stitch-ui-generator)
      tool: google-stitch
      project_ref: STP-…       # must be THE active project of the initiative
      artifact_ref: <real ref | PLACEHOLDER:…>
      version: <…>
      status: current | superseded | stale
      captured_at: <ISO-8601 -05:00>
      latest_known_version: <…>   # set when verified live; != version ⇒ STALE_STITCH_REFERENCE
    exploration_history: []    # previous artifacts of the same SCR
    governed_design:           # Figma (figma-design-validator)
      tool: figma
      file_ref: <…>
      node_ref: <…>
      version: <…>
      status: candidate | approved | stale
      approved_by: human:<id>
      decision_ref: DD-…
      states_covered: []
      responsive_covered: []
      latest_known_version: <…>
    stitch_figma: {divergence: none | resolved | open, decision_ref: DD-…}
    components: [CMP-…]
    tokens: [TKN-…]
```

Rules
- `PLACEHOLDER:` marks an example value; the `production` profile rejects it.
- `exploration_design` becomes `superseded` when `governed_design` is approved. It stays as lineage.
- A SCR may exist before it has Stitch/Figma entries; the gate fails it (`ORPHAN_SCREEN`) until it does.
- Only these two skills write the DTM, through `validators/cli.py register-*`.

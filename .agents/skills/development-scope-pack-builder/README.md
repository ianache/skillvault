# development-scope-pack-builder

Builds a candidate Development Scope Pack from validated RCPs and User Stories before Sprint selection.

## Install

```text
python -m pip install PyYAML
```

## Run

```text
python scripts/build_scope_pack.py --rcp examples/RCP-001.md --story examples/US-001.md --product CLocator --scope-id DSP-001 --title "Candidate search scope" --output output/DSP-001.md
```

The output is Google OKF v0.2, keeps Sprint assignment null, and contains complete source URLs. It is suitable as a starting point for an internal team, Superpowers or an external supplier.

## Relationship to adjacent Skills

- `af-requirement-context-builder`: creates the RCP.
- `af-user-story-refiner`: creates independent User Stories.
- `development-scope-pack-builder`: creates a candidate delivery boundary.
- `development-handoff-builder`: creates an implementation-ready development handoff after the scope/design is approved.
- `gitlab-work-publisher`: projects approved User Stories into GitLab Issues.

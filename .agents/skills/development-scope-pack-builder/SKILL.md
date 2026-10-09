---
name: development-scope-pack-builder
description: Use when one or more validated RCPs and User Stories must be bounded into a candidate development scope before Sprint assignment, including handoff to Developers, QA, Superpowers or an external supplier.
---

# Development Scope Pack Builder

Build a candidate **Development Scope Pack (DSP)** before Scrum assigns work to a Sprint. The DSP is a delivery boundary, not a new business source of truth: RCPs remain the functional context and User Stories remain the behavior-level source.

## When to use

Use this Skill when the team needs to:

- group refined User Stories into a coherent candidate scope;
- state included and excluded work before Sprint planning;
- prepare a bounded handoff for Developers, QA, Superpowers or a supplier;
- preserve traceability from knowledge-base repository → RCP → User Story → delivery scope.

Do not use it to discover business context, write User Stories, make architecture decisions or assign a Sprint.

## Required inputs

- One or more Google OKF v0.2 RCP documents (`artifact: requirement-context-pack`).
- One or more Google OKF v0.2 User Stories (`artifact: user-story`).
- A common product name.
- Complete HTTP(S) source URLs, including repository, ref and path.

## Output contract

Produce one Google OKF v0.2 Markdown document with:

- `artifact: development-scope-pack`;
- `scope_state: DRAFT` or `READY_FOR_SPRINT_SELECTION`;
- `sprint.id: null` and `sprint.name: null` until Scrum planning assigns it;
- included stories and explicit exclusions;
- dependencies, constraints, QA evidence, provider handoff and open questions;
- source URLs for every RCP and User Story;
- `human-reviewed: false` until a human review event exists.

## Deterministic builder

For file-based generation, run:

```text
python scripts/build_scope_pack.py \
  --rcp path/to/RCP-001.md \
  --story path/to/US-001.md \
  --product CLocator \
  --scope-id DSP-001 \
  --title "Candidate search scope" \
  --output output/DSP-001.md
```

The builder rejects legacy frontmatter, missing sources, symbolic URLs, mixed products and non-User-Story inputs. It never edits source documents.

## Lifecycle

`DRAFT → REQUIRES_REVIEW → READY_FOR_SPRINT_SELECTION → ASSIGNED_TO_SPRINT → IN_PROGRESS → CLOSED`.

If a change alters the bounded work after assignment, create a new revision and review its impact; do not silently expand the pack.

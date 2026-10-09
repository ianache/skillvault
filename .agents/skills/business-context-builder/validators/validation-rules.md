# Validation Rules

## Structural
- SKILL frontmatter contains `name` and trigger-only `description`.
- Every concept template has YAML frontmatter.
- New concepts use `status: draft`.
- Generated concepts include `generated.by` and `sources`.

## Semantic failure conditions
Fail when a KPI target has no source/human decision; a User Story or functional requirement is generated; an assumption is presented as fact; contradictory sources are silently reconciled; `verified` is created by the Skill; scope lacks in/out distinction; blocking questions are hidden; or Business Objective lineage is lost.

Validation success is not human approval. Evaluate `BUSINESS_CONTEXT_READY` after validation.

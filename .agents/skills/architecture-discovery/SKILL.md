---
name: architecture-discovery
description: Build a traceable architecture discovery brief from requirements, user stories, NFRs, and available product knowledge before architecture research or design begins. Use this skill for Sprint 0, new initiatives, cross-cutting changes, new integrations or services, or any architecture task where scope, facts, assumptions, unknowns, conflicts, and architecture questions must be separated before proceeding. Do not use it to design the target architecture, approve ASRs, or create ADRs.
---

# Architecture Discovery

Build an evidence-first understanding of the initiative before deeper architecture analysis.

## Required inputs
- Requirements or User Stories
- Requirement Context Pack when available
- Explicit NFRs and known constraints
- Initial product documentation

## Procedure
1. Identify the product, initiative, and stated objective.
2. Delimit explicit in-scope and out-of-scope items.
3. Extract actors, capabilities, rules, data, integrations, and explicit NFRs.
4. Identify architecture concerns without proposing a solution.
5. Classify each material finding using `references/evidence-classification.md`.
6. Attach evidence to every FACT and preserve provenance using `references/provenance-rules.md`.
7. Record gaps and contradictory sources.
8. Form architecture questions whose answers could change a later decision.
9. Prioritize those questions.
10. Ask the architect to validate scope, classifications, and question priority.
11. Produce the output using `assets/architecture-discovery-brief.md`.

All documents generated must be aligned with Google OKF v0.2.

Store final documents inside `architecture` folder.

## Guardrails
- Keep current understanding separate from target design.
- Never invent dependencies or missing rules.
- Never silently convert inference or assumption into fact.
- Treat potential ASRs only as observations for later ARQ-102 analysis.
- Stop and surface a gap when evidence is insufficient.

## Human review
Require the architect to validate scope, accepted/rejected inferences, conflicts, and prioritized questions.

## Completion criteria
- Scope and exclusions are explicit.
- Material claims have evidence or an uncertainty classification.
- Critical gaps and conflicts are visible.
- Architecture questions are prioritized.
- No target architecture, formal ASR, or new ADR appears in the output.

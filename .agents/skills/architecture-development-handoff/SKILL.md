---
name: architecture-development-handoff
description: Use when approved solution architecture must be transferred to Developers and AI coding agents as a minimal, traceable, implementation-ready Development Context Pack without reopening or silently changing architectural decisions.
version: 1.0.0
---

# Architecture Development Handoff

## Purpose
Transform approved architecture knowledge into a minimal, traceable and implementation-ready Development Context Pack for Developers and AI coding agents.

This skill does **not** redesign the solution, approve ADRs, select technologies, or resolve architectural trade-offs.

## Use When
- The implementation scope and User Stories are known.
- Relevant ASRs have been identified.
- Required architecture decisions are approved or explicitly identified as open.
- Development is about to start.
- Claude Code + Superpowers or another coding agent requires bounded architecture context.

## Do Not Use When
- Architecture discovery is still incomplete.
- A technology or integration pattern still requires a decision.
- An ADR must be created, replaced, or approved.
- Critical evidence is missing and the gap would require guessing.
- The request is to implement code rather than prepare the handoff.

Route those cases to the appropriate ARQ workflow.

## Required Inputs
At minimum:
- User Stories / implementation scope.
- Architecture context and affected components.
- Applicable ASRs.
- Applicable ADRs or explicit open decisions.
- Architecture Rules derived from approved decisions.
- Applicable NFRs and security constraints.
- Fitness Criteria for critical rules when objectively verifiable.
- Evidence/provenance references.

Optional inputs include API, event and data contracts; diagrams; operational constraints; QA/testability requirements; and existing implementation evidence.

## Evidence Policy
Apply **Evidence before Assertion**.

Classify material statements as:
- `FACT`
- `INFERENCE`
- `ASSUMPTION`
- `UNKNOWN`
- `CONFLICT`

Never convert an assumption into a fact. Absence of evidence is not evidence of non-conformance.

## Context Policy
Apply **MINIMUM CONTEXT + PULL ON DEMAND**.

Include only the context necessary for implementation. Preserve identifiers and provenance so Developers and agents can retrieve deeper context when needed.

## Workflow
1. Establish implementation scope and User Stories.
2. Identify affected architecture components.
3. Map applicable ASRs.
4. Map approved ADRs and unresolved decisions.
5. Translate approved decisions into explicit Architecture Rules; do not invent new decisions.
6. Identify API, event and data contracts.
7. Identify NFR and security constraints.
8. Map critical Architecture Rules to Fitness Criteria.
9. Build traceability: `US -> ASR -> ADR -> Architecture Rule -> Fitness Criterion`.
10. Identify assumptions, unknowns, conflicts and stale evidence.
11. Validate evidence and provenance.
12. Run READY_FOR_DEV validation using `references/handoff-readiness-model.md`.
13. Generate the Development Context Pack using `assets/development-context-pack-template.md` and `assets/pack-template.yaml`.
14. Generate the Handoff Report using `assets/handoff-report-template.md`.
15. Request the Human Decision Gate defined in `references/human-decision-gate.md`.

## Architecture Constraints
Approved ADRs are constraints for implementation.

Implementation agents MAY decide implementation details such as internal code organization, refactoring sequence, test implementation and task decomposition when those choices remain inside approved architecture boundaries.

Implementation agents MUST NOT autonomously:
- replace an approved technology or integration pattern;
- violate an Architecture Rule;
- weaken a security constraint;
- change an ASR;
- supersede an ADR;
- treat an open architectural decision as resolved.

If implementation conflicts with approved architecture, emit `ARCHITECTURE_CONFLICT`, capture evidence, identify affected artifacts and escalate to Architecture. Do not silently continue down the conflicting path.

## Superpowers Contract
Follow `references/superpowers-contract.md`.

The Development Context Pack is input context for Superpowers. Superpowers may perform implementation brainstorming and planning **inside** the approved architecture boundary. It must not reopen approved ADRs as unconstrained design choices.

Expected execution chain:
`Development Context Pack -> brainstorming (bounded) -> writing-plans -> TDD / implementation -> code review -> Merge Request -> implementation evidence -> ARQ-104`.

## READY_FOR_DEV Recommendation
Possible skill recommendations:
- `READY_FOR_DEV`
- `READY_WITH_OBSERVATIONS`
- `NOT_READY`
- `NOT_VERIFIABLE`

The skill MUST NOT approve `READY_FOR_DEV`. Final approval belongs to the designated human Solution Architect.

## Outputs
Produce:
1. `development-context-pack.md`
2. `pack.yaml`
3. `traceability-map.md`
4. `ready-for-dev.md`
5. `handoff-report.md`
6. Explicit `open-items.md` when assumptions, unknowns or conflicts exist.

Templates are available under `assets/`.

## Completion
The handoff is complete only after a Human Decision Gate records one of:
- `READY_FOR_DEV`
- `RETURN_TO_ARCHITECTURE`
- `REQUEST_EVIDENCE`
- `REQUEST_DECISION`

A `READY_FOR_DEV` handoff must preserve enough traceability for the later Merge Request and ARQ-104 conformance review.

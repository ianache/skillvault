---
name: api-designer
description: Use when design an implementable api contract from stories, asrs and adrs. in the DTC track.
metadata:
  package: dtc-api
  version: 0.2.0
  standard: google-okf-v0.2
---

# api-designer

## Purpose
Design an implementable API contract from stories, ASRs and ADRs. This Skill sits between ARQ and DEV and remains traceable to AF and verifiable by QA.

## Triggers
Use for design, review, handoff, gate decisions or artifact repair. Do not implement production code or replace an ARQ decision.

## Inputs
Architecture Context Pack, requirements, user stories, ASRs, ADRs, standards, constraints, existing DTC artifacts, review criteria, security/privacy requirements and QA constraints.

## Procedure
1. Load and normalize sources; preserve identity, version, timestamp and trust.
2. Define scope, actors, boundaries, assumptions and non-goals.
3. Create or inspect the design with stable IDs and explicit decisions.
4. Apply domain rules: Cover resources, DTOs, errors, pagination, idempotency, versioning, compatibility, examples, contract tests and OAuth2/OIDC..
5. Check failure modes, security, observability, testability, rollout and rollback.
6. Run traceability and quality gates; link findings to evidence and IDs.
7. Write the artifact with the OKF envelope and status.
8. If READY_FOR_DEV, link the development handoff; otherwise name the owner and action.

## Rules
- Never invent requirements, fields, policies or architecture decisions; mark assumptions or blockers.
- Every normative choice has an ID, rationale and source or inferred provenance.
- An agent must never set human-reviewed: true; that requires a named human and review event.
- generated, verified and status describe evidence, not intent.
- Use repository-relative paths or stable IDs for internal links.
- Preserve versions and classify changes as compatible, breaking, additive or unknown.

## Outputs
Produce the applicable design/review/gate artifact with summary, scope, inputs, decisions, design, risks, open questions, traceability, verification evidence, provenance, lifecycle metadata and next action.

## Quality gates
Required sections and IDs exist; critical inputs have sources and freshness/trust; forward and backward traceability has no unexplained orphan; domain security/failure/observability/testing/rollout concerns are covered; status is exactly READY_FOR_DEV, REQUIRES_REVIEW or BLOCKED; READY_FOR_DEV has no blocking finding and a handoff path.

## Error handling
For missing or contradictory context, record the conflict and precedence and return BLOCKED or REQUIRES_REVIEW. For malformed artifacts, preserve the original and report field/line. Never lower severity to reach READY_FOR_DEV.

## Handoff
Link technical-design-context, the domain design, technical-design-review, traceability-report and development-context-pack. The receiving Developer or agent must know what to build, what not to assume, how to test it and which decisions remain open.

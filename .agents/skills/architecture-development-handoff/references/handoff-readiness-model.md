# Handoff Readiness Model

Evaluate these gates: Scope, Architecture Context, ASRs, ADRs/Open Decisions, Architecture Rules, Contracts, Security, NFRs, Fitness Criteria, Evidence/Provenance, Unknowns/Assumptions, Conflicts.

## Recommendation semantics
- `READY_FOR_DEV`: no blocking architecture decision or critical evidence gap; critical constraints are actionable and traceable.
- `READY_WITH_OBSERVATIONS`: implementation may start but explicitly documented non-blocking observations remain.
- `NOT_READY`: one or more blocking decisions, conflicts or missing critical constraints exist.
- `NOT_VERIFIABLE`: evidence is insufficient to determine readiness without guessing.

The skill recommends; a human Solution Architect approves.

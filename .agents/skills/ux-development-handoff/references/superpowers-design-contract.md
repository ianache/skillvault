# Contract with Developer + AI coding agent + Superpowers (design side)

## Input
The approved Development Context Pack plus `dev-context` output for each SCR. `authoritative_design` is always `governed_design`.

## The agent MAY
- choose internal code organization consistent with the architecture standards;
- decompose work, apply TDD, refactor without changing the visual contract;
- prepare visual-verification and functional-verification evidence per SCR.

## The agent MUST NOT
- implement from `exploration_lineage` (Stitch) when `governed_design` exists, or pick a stale artifact;
- invent a missing visual state, breakpoint or interaction;
- substitute a CMP-* or hard-code a value that has a TKN-*;
- reinterpret a critical layout;
- resolve a UX contradiction or an open question by assumption.

## Conflict protocol
On any of the above emit `DESIGN_CONFLICT` with: SCR, FLW, requirement IDs, what the design says, what blocks implementation, evidence, and proposals labeled as proposals. Stop that path and request UX review. `dev-context` returning `BLOCKED` is the same stop.

## Proof of what was implemented
Record per SCR: `handoff` (HOF id), `governed_design.file_ref/node_ref/version`, components used, tests/screenshots. Together with the DTM this closes `US → UXR → FLW → SCR → Design → CMP/TKN → Code → Test Evidence`.

## Expected flow
`HOF (gate PASSED + human approval) → Development Context Pack → bounded brainstorming → writing-plans → TDD → implementation → visual/functional verification → MR + evidence`.

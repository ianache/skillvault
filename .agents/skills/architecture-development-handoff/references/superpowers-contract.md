# Contract with Claude Code + Superpowers

## Input
The approved Development Context Pack is the architecture boundary for implementation.

## Superpowers MAY
- explore implementation details inside approved boundaries;
- decompose work into tasks;
- choose internal code organization consistent with standards;
- use TDD and implement tests;
- refactor without changing architecture intent;
- prepare code review and Merge Request evidence.

## Superpowers MUST NOT autonomously
- replace approved technology/integration choices;
- violate Architecture Rules;
- weaken security constraints;
- change ASRs;
- supersede ADRs;
- resolve an OPEN_DECISION by assumption.

## Conflict protocol
When implementation reveals a conflict, emit `ARCHITECTURE_CONFLICT` containing: affected US/ASR/ADR/rule, evidence, implementation impact, unknowns and possible alternatives clearly labeled as proposals. Stop the conflicting decision path and request Architecture review.

## Expected flow
`Context Pack -> bounded brainstorming -> writing-plans -> TDD -> implementation -> review -> MR + evidence -> ARQ-104`.

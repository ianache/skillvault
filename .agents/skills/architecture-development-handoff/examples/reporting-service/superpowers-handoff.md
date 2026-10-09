# Superpowers Handoff — Reporting Service Example

## Architecture boundary
Treat ADR-017 and ARCH-RULE-023 as constraints. Do not reopen Kafka vs REST during implementation brainstorming.

## Expected plan decomposition
- TASK-01: validate/implement event contract.
- TASK-02: implement Kafka position-event consumer.
- TASK-03: implement processing/persistence required by US-142.
- TASK-04: implement integration tests.
- TASK-05: verify FIT-012 and collect evidence.
- TASK-06: prepare Merge Request architecture traceability.

If implementation reveals that ADR-017 cannot be satisfied, emit `ARCHITECTURE_CONFLICT` and request Architecture review rather than substituting REST.

# Merge Request — Architecture Traceability Example

## Architecture Traceability
- User Story: US-142
- ASR: ASR-008
- ADR: ADR-017
- Architecture Rule: ARCH-RULE-023
- Fitness Criterion: FIT-012

## Implementation Evidence
- Kafka consumer implementation: `src/.../PositionEventConsumer.java`
- Integration test: `src/test/.../PositionEventConsumerIT.java`
- Configuration: `application.yaml`

## Fitness Result
- FIT-012: PASS (illustrative)
- Direct REST dependency for governed flow: NOT FOUND (illustrative)

## Architecture Conflicts
None in this illustrative example.

This evidence becomes input to ARQ-104 conformance verification.

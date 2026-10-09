# Development Context Pack — Reporting Service / US-142

## Scope
**US-142:** Generar un resumen de las últimas posiciones de la unidad y sus dispositivos GPS.

## Architecture Context
Affected component: `reporting-service`.

## ASR
**ASR-008:** Reporting must not introduce direct coupling with telemetry producers.

## ADR
**ADR-017:** Use Kafka for asynchronous distribution of telemetry position events.

## Architecture Rule
**ARCH-RULE-023**
- MUST consume applicable position events through Kafka.
- MUST NOT introduce a synchronous REST dependency to the telemetry producer for this flow.

## Fitness Criterion
**FIT-012:** Integration evidence demonstrates Kafka consumption and dependency inspection shows no direct REST client for the governed flow.

## Traceability
`US-142 -> ASR-008 -> ADR-017 -> ARCH-RULE-023 -> FIT-012`

## Open Items
None in this illustrative example.

## Handoff Recommendation
`READY_FOR_DEV`

Final approval remains pending until the Solution Architect records the Human Decision Gate.

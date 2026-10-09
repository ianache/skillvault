# Test Scenarios — architecture-development-handoff v1.0

Execute these before publishing the Skill.

## 1. Happy path
Input contains scoped US, affected components, ASRs, approved ADRs, rules, NFR/security constraints, fitness criteria and provenance.
Expected: recommend `READY_FOR_DEV`, generate complete pack and request human approval.

## 2. Missing architecture decision
A User Story requires an integration choice but no approved ADR exists.
Expected: `NOT_READY` or `READY_WITH_OBSERVATIONS` only if non-blocking; create an open item and `REQUEST_DECISION`. Never choose the technology.

## 3. Unsupported inference
Repository evidence suggests REST while an approved ADR mandates Kafka.
Expected: emit `ARCHITECTURE_CONFLICT`, preserve both pieces of evidence and escalate. Never rewrite the ADR or silently normalize the conflict.

## 4. Missing provenance
An architecture rule is supplied without traceable source/evidence.
Expected: mark provenance gap; do not present the rule as fully verified.

## 5. Superpowers attempts redesign
The implementation agent proposes replacing Kafka with synchronous REST for convenience.
Expected: stop that decision path, identify ADR/rule affected and escalate to Architecture.

## 6. Stale evidence
An old ADR conflicts with newer implementation evidence but there is no superseding decision.
Expected: classify as `CONFLICT`/potential stale architecture, require architecture review; do not infer which source is authoritative.

## 7. Non-applicable section
No event contract applies to the feature.
Expected: mark the section `NOT_APPLICABLE`; do not fabricate content.

## 8. Human authority pressure
User asks the skill to automatically approve READY_FOR_DEV.
Expected: recommendation may be produced, but final approval remains a Human Decision Gate.

## Invariants
- Evidence before Assertion.
- No hypothesis becomes fact.
- No autonomous architecture decision.
- Minimum context + pull on demand.
- Traceability reaches fitness criteria and remains usable by MR/ARQ-104.

---
name: architecture-impact-analyzer
description: Analyze how requirements and user stories may affect an evidence-backed existing architecture, tracing impact through capabilities, components, APIs, events, integrations, data, security, operations, quality, observability, and downstream consumers. Use this skill during Sprint 0, refinement, cross-cutting changes, contract changes, or new integrations after the relevant AS-IS architecture is understood. Classify impact as DIRECT, INDIRECT, POTENTIAL, UNKNOWN, or NO_IMPACT. Do not design the target architecture, formally approve ASRs, or create ADRs.
---

# Architecture Impact Analyzer

Trace requirements into the current architecture without turning impact analysis into solution design.

## Required inputs
- Requirements/User Stories
- Architecture Discovery Brief
- AS-IS Architecture Landscape
- Knowledge & Evidence Map
- Explicit NFRs

## Procedure
1. Read `references/impact-classification.md` and `references/architecture-perspectives.md`.
2. Take one requirement.
3. Identify the affected capability.
4. Link it to relevant AS-IS elements.
5. Expand dependencies only where evidence and scope justify expansion.
6. Review Application, Integration/contracts, Data/ownership, Security, Operations/resilience/observability, and Quality/testability.
7. Classify each impact as DIRECT, INDIRECT, POTENTIAL, UNKNOWN, or NO_IMPACT.
8. Attach evidence, confidence, risk, and status.
9. Check downstream consumers explicitly.
10. Record gaps and required investigations.
11. Record potential ASR candidates only as candidates for ARQ-102.
12. Ask the architect to reject false positives, add omissions, and validate classifications.
13. Produce `assets/architecture-impact-matrix.md`.

## Guardrails
- A relationship is not automatically an impact.
- Do not expand dependency graphs without a relevance boundary.
- Never promote POTENTIAL to DIRECT without evidence.
- Do not design mitigations or target architecture.
- Do not formalize ASRs or create ADRs.

## Completion criteria
- Every impact traces to a requirement and architecture element.
- Evidence/confidence are visible.
- Downstream consumers were considered.
- Applications, Data, and Security perspectives were considered.
- Unknowns remain explicit.

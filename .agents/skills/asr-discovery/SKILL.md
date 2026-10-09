---
name: asr-discovery
description: Identify evidence-backed Architecture Significant Requirement candidates from requirements, NFRs, constraints, risks, architecture impact, and an Architecture Context Pack. Use after architecture context and impact are understood, when an architect must distinguish ordinary requirements from concerns that may materially shape the architecture. Do not approve ASRs, invent quality targets, choose technologies, design the target architecture, or create ADRs.
---

# ASR Discovery

## Purpose
Identify **Potential ASR Candidates** that deserve architectural validation.

## Inputs
- Architecture Context Pack
- Requirements and User Stories
- explicit NFRs and constraints
- Architecture Impact Analysis
- risks, assumptions, unknowns and conflicts
- existing standards and ADRs when relevant

## Workflow
1. Confirm scope and requirement identifiers.
2. Extract explicit quality concerns and constraints.
3. Correlate each concern with architecture impact.
4. Identify cross-cutting effects and affected perspectives.
5. Create an ASR candidate only when there is a reason it may shape architecture.
6. Attach evidence, confidence and unresolved questions.
7. Distinguish NFR, constraint, ordinary requirement and ASR candidate.
8. Identify missing evidence needed to validate significance.
9. Ask the architect to classify each candidate as `CANDIDATE`, `REJECT`, or `INVESTIGATE`.
10. Produce the ASR Candidate Catalog using `assets\asr-candidate-catalog.md` as the markdown content for the Google OKF v0.2 generated file.

## Guardrails
- An NFR is not automatically an ASR.
- Do not invent SLO/SLA, latency, availability, RTO/RPO, throughput or security targets.
- Do not recommend technology as proof of significance.
- Do not approve an ASR in this skill.
- Preserve uncertainty and conflicting evidence.
- Human review is mandatory for candidate disposition.

## Completion
The catalog shows why each candidate may be architecture-significant, what evidence supports it, what is missing, and its human disposition.

All documents must be saved in `architecture\asr` folder, with the ASR Candidate Catalog in `asr-catalog.md` and each candidate in a separate file named `asr-<requirement-id>.md`.
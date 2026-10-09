---
name: architecture-context-builder
description: Build a complete, traceable Architecture Context Pack before solution design by orchestrating architecture discovery, evidence research, AS-IS reconstruction, impact analysis, critical review, and human validation. Use this skill for Sprint 0, cross-cutting changes, new services or integrations, or any initiative that must understand current architecture and likely impact before ARQ-102. It can perform the full workflow itself and may use specialized installed skills when available. Do not use it to design Solution Architecture, formally approve ASRs, make architecture decisions, create ADRs, or verify implementation conformance.
---

# Architecture Context Builder

Produce the handoff artifact: an evidence-backed Architecture Context Pack that explains current state, likely impact, uncertainty, and provenance before solution design.

## Required inputs
- Requirements/User Stories
- Known NFRs
- Requirement Context when available
- Available current architecture information
- Authorized repositories, ADRs, standards, and knowledge sources

## Workflow
Perform these stages in order:
1. Discovery — delimit scope; classify facts, assumptions, unknowns, and conflicts.
2. Evidence research — answer prioritized architecture questions with provenance.
3. AS-IS reconstruction — reconstruct Applications, Integration, Data, and Security.
4. Impact analysis — trace requirements into current architecture and downstream dependencies.
5. Critical review — challenge claims, omissions, conflicts, and evidence quality.
6. Human validation — require architect decisions at critical boundaries.
7. Consolidation — produce `assets/architecture-context-pack.md`.
8. Quality gate — decide whether the pack is `READY_FOR_ARQ_102`.

If specialized skills named `architecture-discovery`, `architecture-knowledge-researcher`, `as-is-architecture-reconstructor`, `architecture-impact-analyzer`, or `architecture-context-critic` are available, use them for their respective stages. If they are unavailable, execute the same procedures directly; this skill must remain self-contained.

Read the relevant files in `references/` only when their rules are needed.

## Stop conditions
Stop and surface the issue rather than guessing when:
- scope cannot be delimited;
- a critical source is inaccessible;
- current state cannot be reconstructed with adequate confidence;
- a contradiction invalidates the next stage;
- specialist Data or Security review is required.

## Required output sections
Include: executive context, scope, requirements, evidence sources, AS-IS architecture, Application/Integration/Data/Security landscapes, impact analysis, constraints, existing standards and ADRs, debt, risks, assumptions, unknowns, conflicting evidence, potential ASR candidates, open questions, provenance, Critic summary, quality gate, and ARQ-102 handoff.

## Guardrails
- Understand before designing.
- Preserve evidence, freshness, confidence, and uncertainty.
- Never invent dependencies.
- Keep current state separate from target state.
- Potential ASRs remain candidates for ARQ-102.
- Do not design Solution Architecture.
- Do not create new ADRs.
- The architect remains accountable for professional judgments.

## READY_FOR_ARQ_102 criteria
Mark ready only when:
- current state is understandable;
- impact is traceable;
- provenance is available;
- critical unknowns and conflicts are visible;
- critical findings received human disposition;
- no target architecture, formally approved ASR, or new ADR was introduced.

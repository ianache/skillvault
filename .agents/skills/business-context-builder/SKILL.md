---
name: business-context-builder
description: Use when an initiative, product change, project, or discovery effort needs governed business context before functional requirements, UX discovery, or solution architecture begin.
---

# Business Context Builder

## Overview
Build a governed **Business Context Pack** before requirements are derived. Core principle: **understand why the initiative exists, what value it seeks, and where its boundaries are before defining what the solution must do**.

This skill belongs to **AF-101** and produces context consumable by AF, UX/UI, and Solution Architecture.

## When to Use
Use when business information is fragmented, an initiative enters discovery, AF-101 needs context before Requirements Discovery, or UX-101/ARQ-101 need authoritative business context.

Do not use this skill to create User Stories, functional requirements, UI specifications, ASR, ADR, or implementation designs.

## Boundary
**This skill ends at business context.** If a source implies a feature or requirement, record the business need or an open question and hand it to downstream requirements analysis.

## Required Inputs
Use one or more governed sources:
- strategy, plans, proposals, PRD or initiative briefs;
- product vision, roadmap, validated commercial material;
- meeting minutes, agreements, interview notes;
- processes, policies, regulations or contracts;
- governed GitLab/GDrive/Knowledge Bundle/database/API/MCP evidence;
- authorized market/competitive evidence.

Record source identity, reference, date/version when known, and relevance.

## Workflow
1. Inventory sources and gaps.
2. Extract explicit facts.
3. Identify problem/opportunity, objectives/outcomes/KPI, scope, stakeholders, capabilities, constraints, dependencies, risks, assumptions and open questions.
4. Preserve conflicts; do not silently reconcile them.
5. Create draft OKF concepts using `templates/`.
6. Compose `business-context-pack.md` from concept references.
7. Apply `validators/validation-rules.md`.
8. Request human review.
9. Evaluate `BUSINESS_CONTEXT_READY` using `references/business-context-ready.md`.

## Output Contract
| Concept | Prefix | Purpose |
|---|---|---|
| Business Context Pack | BCP- | Context composition |
| Business Objective | BO- | Objective, outcome, KPI |
| Stakeholder | STK- | Actor, interest, responsibility |
| Business Capability | BC- | Capability/process impacted |
| Business Constraint | BCON- | Known constraint |
| Business Risk | BRISK- | Risk and treatment |
| Business Assumption | BAS- | Explicit unverified assumption |
| Open Question | BOQ- | Missing/conflicting information |

All generated Markdown concepts MUST start at `status: draft`, include `generated.by` and `sources`, preserve lineage, and MUST NOT fabricate `verified`.

All generated markdown must be stored in `knowledge-base\business` folder organized under the corresponding subfolder.

## Consumers
- **AF-101** → Requirements Context Pack
- **UX-101** → UX Context Pack
- **ARQ-101** → Architecture Context Pack

E2E lineage:
`Business Objective → Requirement → User Story → UXR → Flow → Screen → Component/Token → Acceptance Criterion → ASR/ADR → Implementation → Test Evidence → Business Outcome`

## Human Decision Rules
The agent may extract, classify, compare, flag and propose. Humans own business meaning, objective/scope acceptance, conflict resolution, assumption approval, prioritization and verification.

## Quick Reference
| Situation | Required behavior |
|---|---|
| Missing KPI | Create/open BOQ; never invent target |
| Conflicting scope | Preserve sources and flag conflict |
| Implied stakeholder | Mark inference until confirmed |
| Mandated technology | Constraint only when source-backed |
| Feature request | Record context; hand off to requirements |
| No source | Do not state as fact |
| Generated concept | `draft`; no fabricated `verified` |

## Common Mistakes
- Starting with User Stories before the business problem.
- Treating a proposed solution as the objective.
- Inventing KPI targets.
- Hiding uncertainty instead of creating BOQ.
- Copying source text instead of referencing governed concepts.
- Treating AI classification as human verification.

## Definition of Done
Required dimensions are represented or explicitly unknown; provenance is resolvable; assumptions/questions are visible; conflicts are resolved or open; validation passes; and a human can evaluate `BUSINESS_CONTEXT_READY`.

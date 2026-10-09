---
name: web-atomic-component-designer
description: Identify and specify web UI components with Atomic Design so they are reusable, accessible, testable and traceable to a real visual design. The target framework comes from the accepted architecture ADR, never from a default.
metadata:
  package: dtc-web
  version: 0.4.0
  standard: google-okf-v0.2
---

# web-atomic-component-designer

## Purpose

Translate a DTC-XXX web designs into an implementation-ready inventory and technical specification for web UI components, in the framework fixed by the accepted architecture ADR, organized as atoms, molecules, organisms, templates and pages. The output is a reusable-component contract for Developers, QA, UX, accessibility reviewers and agents; it does not silently implement production code or replace an ARQ decision.

## Triggers

Use when the request identifies, classifies, specifies, reviews or prepares web UI components for reuse in the product or in a library. Use after DTC-104 web solution design or when an existing component library needs a traceable gap analysis.

Do not use for visual branding alone, a one-off page mockup, backend/BFF design, or production coding without a component specification.

## Inputs

- Architecture Context Pack and DTC-XXX Web Design Pack.
- User Stories, ASRs, ADRs, acceptance criteria and design references.
- Accepted ADR that fixes the frontend framework (and rendering model), plus existing workspace conventions, framework and UI-library versions, and packaging constraints only if a library is decided.
- Accepted ADR for component test tooling (for example Storybook) when one exists.
- Design tokens, responsive breakpoints, supported browsers, WCAG target and localization requirements.
- Existing library inventory, public exports, dependency policy, test conventions and release policy.
- Visual design tool and project: Google Stitch or Claude Design (project/design-system ids, existing screens), per `references/visual-design-link-template.md`.

## Atomic classification

- **Atom:** indivisible visual or interaction primitive with no domain workflow of its own.
- **Molecule:** small composition of atoms that performs one coherent interaction or displays one coherent fact.
- **Organism:** reusable section with multiple molecules, domain-neutral inputs and a defined layout responsibility.
- **Template:** page-level layout and slots that define structure without binding to one business record.
- **Page:** route-level composition that binds template and organisms to a user journey, data contract, permissions and states.

Never classify by visual size alone. Classification must explain responsibility, reuse boundary, inputs, outputs and dependency direction.

## DDD and MicroUI boundary analysis

DDD is a boundary input, not an automatic one-to-one mapping. Do not assume `bounded context = microservice = MicroUI = team`. Analyze the bounded context together with the user journey, team ownership and deployment autonomy using `references/micro-ui-ddd-boundary-template.md`.

Recommend `MICROUI_CANDIDATE` only when the candidate has a coherent business capability and journey, a distinct language and rules, an accountable team, stable integration contracts, independent test/deploy potential and a benefit that exceeds the cost of distributed UX and runtime integration.

Recommend `FRONTEND_MODULE` when the capability is useful as a boundary inside the frontend application but lacks sufficient autonomy, change isolation or operational value for an independently deployed MicroUI.

Recommend `COMPOSITE_JOURNEY` when one user journey intentionally spans multiple bounded contexts and should be composed by a Shell, BFF or journey-focused frontend rather than fragmented by entity ownership.

Never create MicroUIs directly from tables, entities, aggregates, individual endpoints or internal services. Use DDD tactical elements to design internals, not to force frontend boundaries.

## Procedure

1. Load sources and preserve provenance, version, freshness and trust. Identify whether the source is normative, informative or an assumption.
2. Inventory screens, journeys, repeated UI, states, responsive variants and accessibility obligations. Assign stable IDs such as `CMP-ATOM-001` and `PAGE-ORDERS-001`.
3. Detect reuse candidates and duplicates. Prefer an existing compatible component; if a new one is proposed, record why extension or composition is insufficient.
4. Analyze DDD/MicroUI boundary candidates before page decomposition. Record bounded context, capability, journey, actor, team ownership, integration contracts, deployment autonomy and decision (`MICROUI_CANDIDATE`, `FRONTEND_MODULE` or `COMPOSITE_JOURNEY`).
5. Classify each candidate as atom, molecule, organism, template or page. Record responsibility, allowed dependencies and composition parents.
6. Specify the public component contract in the framework of the accepted ADR: component name or selector, framework strategy (for example client/server boundary or standalone/module), inputs/props, outputs/callbacks, children or projection slots, state or signals, TypeScript types, events and side effects.
7. Specify visual and behavioral contracts: variants, sizes, states, keyboard behavior, focus, responsive rules, localization, empty/loading/error/offline states and data privacy.
8. Define implementation evidence: unit, interaction, accessibility, visual-regression and contract tests; examples; Storybook or equivalent scenarios; performance budgets.
9. Define packaging from the accepted ADR: the internal module location and exports; only when an ADR decides a library, also entry points, peer dependencies, tree-shaking, semver impact and deprecation path. Never assume NPM publication.
10. Create or locate the visual design for every CMP-* (atom, molecule, organism, template, page) in Stitch or Claude Design, following `references/visual-design-link-template.md`: choose the tool, design the specimen/section/page screens with all variants, states and breakpoints, and record `visual_design` frontmatter plus the `## Visual design` section in each spec. Never invent ids or URLs; if the tool is unreachable set `status: pending`.
11. Run accessibility, security, dependency and design-system reviews. Link findings to component IDs and source evidence.
12. Generate `ui-inventory.md`, `micro-ui-boundary-analysis.md`, component specifications, `visual-design-registry.md`, token and module (or package) contracts, traceability and handoff. Set status only from evidence.

## Required component specification

Every component specification must include the fields in `references/component-spec-template.md`. At minimum it must define:

- stable ID, name, Atomic level, purpose and non-goals;
- selector, public API, TypeScript types, events and projection slots;
- composition and dependency direction;
- variants, states, responsive and localization behavior;
- WCAG behavior, keyboard/focus rules and accessible name strategy;
- tests, examples, performance expectations and change classification;
- a `visual_design` link (tool, project id, screen id, design system, covered variants/states/breakpoints, status) to the Stitch or Claude Design artifact;
- sources, generated, verified, status, provenance and internal links.

For page or MicroUI specifications also include the DDD boundary decision and its evidence. A page-level design cannot claim independent MicroUI status without the four-dimension boundary analysis.

## Rules

- Do not invent UX, data fields, permissions or design tokens. Mark assumptions and open questions.
- Do not turn a bounded context into a MicroUI automatically; verify journey, team ownership and deployment autonomy.
- Prefer business capabilities and user journeys over entity-oriented frontend slices.
- Keep the Shell responsible for global navigation, authentication, layout, cross-domain telemetry and composition policy.
- Do not share domain aggregates or global business state merely to make MicroUI integration easier.
- Pages may compose organisms and templates; atoms must not depend on pages or business services.
- Keep domain data orchestration outside presentational atoms and molecules unless explicitly justified.
- Public APIs must use stable TypeScript types and avoid leaking internal implementation details.
- Required states are explicit: loading, success, empty, error, disabled and offline or recovering when applicable.
- Accessibility is a release criterion, not a later enhancement.
- Every CMP-* needs a real visual design in Stitch or Claude Design; the spec alone is not enough to build from. Developers implement against both.
- Never fabricate Stitch or Claude Design ids/URLs; take them from the tool. Spec/design conflicts are recorded and set `REQUIRES_REVIEW`.
- A component is not reusable merely because it appears twice; its boundary and variation model must be documented.
- Framework and test tooling come from accepted ADRs; never default to one. The packaging decision is explicit before `READY_FOR_DEV`: internal module exports, or, only if an ADR decides a library, NPM exports, peer dependencies and semver impact.
- An agent must never set `human-reviewed: true`; only a named human review event can do so.
- `READY_FOR_DEV`, `REQUIRES_REVIEW` and `BLOCKED` are the only valid output statuses.
- Preserve original artifacts when repairing malformed input and report the exact field or ID affected.

## Outputs

- `ui-inventory.md` with screen, journey and reuse mapping.
- `micro-ui-boundary-analysis.md` with DDD context mapping and decisions.
- `atomic-component-catalog.md` with stable IDs and classification rationale.
- One specification per reusable component using `references/component-spec-template.md`.
- `visual-design-registry.md`: table of CMP-ID, Atomic level, tool, project id, screen id, URL, status, last synced.
- `design-token-contract.md` and `<framework>-component-architecture.md` (for example `react-component-architecture.md`).
- `component-module-contract.md` with internal exports and contract rules; `npm-package-contract.md` with peer dependencies and semver impact only when an ADR decides a library.
- `accessibility-matrix.md`, `visual-test-matrix.md` and `component-traceability-report.md`.
- `development-context-pack.md` and `technical-design-review.md` when the work is ready for handoff.

## Quality gates

The gate passes only when:

- every page and repeated UI element has an inventory ID and traceability link;
- every proposed MicroUI has a DDD boundary decision with capability, journey, actor, team and deployment evidence;
- every rejected MicroUI candidate records whether it became `FRONTEND_MODULE` or `COMPOSITE_JOURNEY` and why;
- every reusable component has a valid Atomic level and a complete public component contract;
- composition does not create forbidden dependency direction or hidden business orchestration;
- all applicable states, accessibility behavior, responsive rules and localization are specified;
- tests cover behavior, accessibility and visual contract;
- exports and package boundaries are explicit, with peer dependencies and semver impact only when a library is decided;
- every CMP-* has `visual_design.status: linked` with covered variants/states/breakpoints matching the spec (a `waived` link needs a reason and a human owner and blocks `READY_FOR_DEV`);
- no critical finding, unresolved contradiction or missing source blocks construction;
- status is exactly `READY_FOR_DEV`, `REQUIRES_REVIEW` or `BLOCKED`.

`READY_FOR_DEV` does not imply human approval. If the evidence is incomplete, return `REQUIRES_REVIEW` or `BLOCKED` and name the owner and next action.

## Error handling

- Missing DTC-104 context: return `BLOCKED` and list the missing artifact and why classification would be unsafe.
- Missing bounded-context, journey, team or deployment evidence: do not approve `MICROUI_CANDIDATE`; return `REQUIRES_REVIEW` or `FRONTEND_MODULE` with the missing evidence.
- Conflicting design references: preserve both sources, record precedence and return `REQUIRES_REVIEW` unless an authoritative decision exists.
- Duplicate component candidates: consolidate when compatible; otherwise create explicit variants with a rationale.
- Framework not fixed by an accepted ADR, or unclear version or packaging model: do not invent it or default to one; ask for the ADR, record the assumption and return `REQUIRES_REVIEW`.
- Visual design missing, tool unreachable or tool undecided: set `visual_design.status: pending`, return `REQUIRES_REVIEW`, and name the owner. Never fabricate links.
- Accessibility or security failure: never downgrade severity to reach `READY_FOR_DEV`.
- Invalid artifact metadata or missing OKF fields: repair only with evidence and report the repair.

## Handoff

Link DTC-XXX context, the component catalog, each specification, its Stitch/Claude Design visual design, the visual design registry, token contract, component architecture, module or package contract, review, traceability report and development context pack. The receiving Developer must know what to build, what not to assume, how to test it, what to export and which decisions remain open.

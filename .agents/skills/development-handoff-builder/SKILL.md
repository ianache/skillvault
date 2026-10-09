---
name: development-handoff-builder
description: Build a bounded, traceable development context pack for developers and coding agents.
metadata:
  package: dtc-common
  version: 0.2.0
  standard: google-okf-v0.2
---

# development-handoff-builder

Build a bounded Development Context Pack for Developers and coding agents. This Skill sits between approved architecture/design work and implementation, remaining traceable to AF and verifiable by QA.

## Inputs

Architecture Context Pack, requirements, User Stories, ASRs, ADRs, standards, constraints, existing DTC artifacts, review criteria, security/privacy requirements and QA constraints.

## Procedure

1. Load and normalize sources; preserve identity, version, timestamp and trust.
2. Define scope, actors, boundaries, assumptions and non-goals.
3. Create or inspect the design with stable IDs and explicit decisions.
4. Preserve the AF → ARQ → DTC → DEV → QA chain.
5. Check failure modes, security, observability, testability, rollout and rollback.
6. Run traceability and quality gates; link findings to evidence and IDs.
7. Write the artifact using the Google OKF v0.2 envelope and lifecycle status.
8. If `READY_FOR_DEV`, link the implementation handoff; otherwise name the owner and next action.

## Rules

- Never invent requirements, fields, policies or architecture decisions; mark assumptions or blockers.
- Every normative choice has an ID, rationale and source or inferred provenance.
- Never set `human-reviewed: true` without a named human and review event.
- Use repository-relative paths or stable IDs for internal links.
- Preserve versions and classify changes as compatible, breaking, additive or unknown.
- **NEW:** If receiving UX output (SCR/GEN), MUST validate presence before proceeding.
- **NEW:** Extract Component Inventory from GEN and include in DCP as binding contract.
- **NEW:** DCP status BLOCKED if GEN/SCR missing.

## Pre-DCP Validation Gate (BLOCKING)

### Input Validation

If this DCP is for UI/frontend feature, MUST receive:

**REQUIRED files:**
- [ ] `SCR-XXX.md` (Screen specification from ui-spec-writer)
- [ ] `GEN-XXX.md` (Stitch generation from stitch-ui-generator)

**IF MISSING:**
```
Status: BLOCKED
Message: "Cannot create DCP without design specs.
  Require UX team to complete:
  1. ui-spec-writer → SCR-XXX
  2. stitch-ui-generator → GEN-XXX
  
  Then re-submit DCP request with both files."
```

### Design Audit (Auto-executed if SCR/GEN present)

1. **Extract Component Inventory** from GEN-XXX
   - List all components (text-input, select, etc.)
   - Extract properties (label, placeholder, required, validators)
   - Extract states (normal, error, loading, success)
   - Extract accessibility (aria-*, role)

2. **Validate Component Traceability**
   - Each component in GEN must map to @gf/ui library
   - All validators must be implementable
   - All states must be testable

3. **Generate Component Audit Matrix**
   ```
   | Component | Library | Type | States | Validators | GEN Section |
   |-----------|---------|------|--------|------------|-------------|
   | nombres | @gf/ui | text-input | normal, error | required, minLength | GEN-015-02 |
   ```

## Quality gates

Required sections and IDs exist; critical inputs have sources and freshness/trust; forward and backward traceability has no unexplained orphan; security, failure, observability and testing concerns are covered; status is exactly `READY_FOR_DEV`, `REQUIRES_REVIEW` or `BLOCKED`; `READY_FOR_DEV` has no blocking finding and a handoff path.

**NEW gates for UI DCPs:**
- [ ] SCR/GEN files present (if UI feature)
- [ ] Component Inventory extracted
- [ ] Implementation Contract section created (binding)
- [ ] No component without design backing
- [ ] Cross-references to GEN-XXX valid

## Output

Use [`templates/development-context-pack.md`](templates/development-context-pack.md). The resulting Markdown document must use `okf: google-okf-v0.2` and include `artifact`, `id`, `title`, `generated`, `verified`, `status`, `sources`, `provenance` and `human-reviewed`.

### NEW REQUIRED SECTION: Implementation Contract

If DCP is for UI feature (has SCR/GEN backing), MUST include:

```markdown
## Implementation Contract (BINDING for Development)

This contract specifies what MUST be implemented. No deviations without written UX approval.

### Component Inventory (Extracted from GEN-XXX)

| Component | Library | Type | Required Props | Validators | States | A11y | GEN Ref |
|-----------|---------|------|---|---|---|---|---|
| text-input:nombres | @gf/ui | text-input | label, placeholder | required, minLength(2) | normal, error | aria-required, aria-invalid | GEN-015-02 |

### Acceptance Criteria for Implementation

Each component MUST be implemented with:
- [ ] Exact props listed (no substitutions)
- [ ] All validators working (sync + async)
- [ ] All states visually matching GEN-XXX
- [ ] Accessibility verified (WCAG 2.2 AA)
- [ ] Keyboard navigation working

### No Substitutions Policy

Developers CANNOT:
- Replace @gf/ui components with Material/other libraries
- Skip states or validators
- Modify accessibility attributes
- Change component structure without UX approval

### Verification Workflow

1. **Code Review:** Reviewer checks implementation against this inventory
2. **UI Test:** Visual regression test against GEN-XXX screenshots
3. **A11y Test:** Automated + manual WCAG 2.2 AA verification
4. **Final Gate:** All checks PASS before merge

### Cross-References

- Design: GEN-XXX (visual specification)
- Flow: FLW-XXX (user journey)
- Acceptance Criteria: SCR-XXX (detailed AC per screen)
- Implementation Plan: PLAN-XXX (tasks mapped to components)
```

### DCP Status Rules (Updated)

```
status: READY_FOR_DEV requires:
- [ ] If UI feature: SCR/GEN present + validated
- [ ] Component Inventory generated + complete
- [ ] Implementation Contract section included
- [ ] All dependencies clear
- [ ] No blocking findings

status: REQUIRES_REVIEW if:
- [ ] Questions about component choices
- [ ] Ambiguity in acceptance criteria
- [ ] UX sign-off not yet obtained

status: BLOCKED if:
- [ ] SCR/GEN missing (required for UI)
- [ ] Component inventory incomplete
- [ ] Critical design decisions undefined
```

# Implementation requirements (preserved from ux-development-handoff 1.0)

Content moved verbatim from SKILL.md 1.0 to keep SKILL.md concise. Still applies as a *required output* of the skill; where it conflicts with the Design-to-Code contract, the contract in SKILL.md prevails.

## Implementation Requirements Section (REQUIRED OUTPUT)

After producing Handoff Pack, MUST generate and include:

### Component Inventory & Implementation Checklist

Extract all components from UX specs and enumerate:

```markdown
## Implementation Requirements (for development-handoff-builder)

### Component Inventory (Auto-extracted)

| Component | Type | Library | Props | Validators | States | A11y | Design Ref |
|-----------|------|---------|-------|------------|--------|------|------------|
| nombres | text-input | @gf/ui | label, placeholder, required | required, minLength(2) | normal, error | aria-required | GEN-015-02 |

### Handoff Instructions for development-handoff-builder

**Next Step:** Pass this Handoff Pack + GEN-XXX to `development-handoff-builder`

**development-handoff-builder MUST:**
1. Read this Component Inventory
2. Extract from GEN-XXX all design specifications
3. Generate DCP with Implementation Contract
4. Bind components to development tasks

**What NOT to do:**
- Do NOT pass to writing-plans without DCP
- Do NOT create development tasks without component mapping
- Do NOT accept implementations that deviate from inventory
```

### Pre-Handoff Quality Gate

```markdown
## Gate Before Handoff: Design Complete?

MUST answer:
- [ ] All screens in SCR have corresponding GEN design?
- [ ] All components in GEN have properties enumerated?
- [ ] All validators specified (sync + async)?
- [ ] All states covered (normal, error, loading, success)?
- [ ] Accessibility (aria-*, role) defined for each?
- [ ] Ready for development-handoff-builder consumption?

If ANY is NO → Stop. Complete design first.
If ALL are YES → Ready to hand off.
```

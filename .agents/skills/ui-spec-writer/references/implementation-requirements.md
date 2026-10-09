# Implementation requirements (preserved from ui-spec-writer 1.0)

Content moved verbatim from SKILL.md 1.0 to keep SKILL.md concise. Still applies as a *required output* of the skill; where it conflicts with the Design-to-Code contract, the contract in SKILL.md prevails.

## Implementation Requirements Section (REQUIRED OUTPUT)

After producing SCR, MUST generate and include:

### Component Inventory

For each screen, extract all components with:
- Component name (mapped to @gf/ui library)
- Type (text-input, select, button, etc.)
- Props (label, placeholder, required, etc.)
- Validators (sync + async)
- States (normal, focused, filled, error, loading, success)
- Accessibility (aria-*, role)
- Cross-reference to SCR section

**Format:**
```markdown
### SCR-015-02: Datos de Persona — Component Inventory

| Component | Type | Props | Validators | States | A11y |
|-----------|------|-------|------------|--------|------|
| nombres | text-input | label, placeholder, aria-required | required, minLength(2) | normal, focused, error | aria-required, aria-invalid, aria-label |
```

### Implementation Checklist

```markdown
### Implementation Prerequisites

- [ ] All components in inventory mapped to @gf/ui v1.1.0
- [ ] All validators enumerated (sync: required, email, etc. + async: duplicate-check)
- [ ] All states covered in design (normal, error, loading, success, etc.)
- [ ] Accessibility attributes specified (aria-*, role, keyboard nav)
- [ ] Ready for development-handoff-builder consumption
```

### Handoff Instructions for Developers

```markdown
## Handoff to Development

**Framework & Dependencies:**
- Framework: Angular 22 (Standalone components)
- UI Library: @gf/ui v1.1.0
- Design System: Material Design 3
- Accessibility Standard: WCAG 2.2 AA (0 violations required)

**Implementation Binding:**
ALL components listed in Component Inventory above MUST be implemented.
NO SUBSTITUTIONS without UX review and approval.

**Design Verification:**
Post-implementation, code reviewer MUST verify against:
- GEN-XXX design specification (visual match)
- Component Inventory (all components present)
- States (all variations implemented)
- Accessibility (WCAG 2.2 AA verified via axe/WAVE)

**Cross-References:**
- Visual design: GEN-XXX
- Acceptance criteria: SCR-XXX (this document)
- Flow context: FLW-XXX
```

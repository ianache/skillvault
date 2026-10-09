# Implementation requirements (preserved from stitch-ui-generator 1.0)

Content moved verbatim from SKILL.md 1.0 to keep SKILL.md concise. Still applies as a *required output* of the skill; where it conflicts with the Design-to-Code contract, the contract in SKILL.md prevails.

## Implementation Requirements Section (REQUIRED OUTPUT)

After producing Stitch designs, MUST extract and include:

### Component Specification for Developers

For each design variation, enumerate:
```markdown
### GEN-015-02: Datos Persona — Components Specified for Implementation

**Component: Text Input (nombres)**
- Library: @gf/ui / text-input
- Label: "Nombres *"
- Placeholder: "ej. Juan Carlos"
- Type: text
- Required: true
- Validators: [required, minLength(2)]
- States: normal, focused, filled, error
- Error message: "Campo obligatorio" / "Mínimo 2 caracteres"
- Accessibility:
  - aria-required="true"
  - aria-invalid="true" (on error)
  - aria-label="Nombres, campo obligatorio"
- Focus visible: 2px solid border (high contrast)
- Keyboard: Tab order as per FLW-015

**Validation Behavior (Real-time):**
- On blur: Check required + minLength
- Show error: below input, role="alert"
- Clear error: on user input

**States Implemented:**
- [ ] normal: default styling
- [ ] focused: border highlight + label color change
- [ ] filled: show value + any icons
- [ ] error: red border + error message + aria-invalid
- [ ] disabled: greyed out (if applicable per FLW)
```

### Developer Implementation Checklist

Generate for each component:
```markdown
### Implementation Tasks (Auto-extracted from GEN-015)

- [ ] Create text-input component (nombres)
  - [ ] Props: label, placeholder, required, validators
  - [ ] Output: valueChange, blur events
  - [ ] States: normal, focused, filled, error
  - [ ] Accessibility: aria-required, aria-invalid, aria-label
  - [ ] Verify against GEN-015-02 screenshot

- [ ] Create text-input component (apellidos)
  - [ ] [same as above]

- [ ] Create select component (tipoIdentificacion)
  - [ ] Props: options, required, aria-label
  - [ ] Keyboard nav: Arrow keys, Enter
  - [ ] States: normal, open, selected, error
  - [ ] Verify against GEN-015-03 screenshot
```

### Handoff Contract for Development

```markdown
## Implementation Contract (BINDING)

**Components in this GEN-015:**
Generated at: [date]
Validated against: SCR-015, FLW-015

**ALL components below MUST be implemented:**

| Component Name | Type | Location (GEN Section) | Binding Status |
|---|---|---|---|
| text-input (nombres) | input | GEN-015-02 | MUST IMPLEMENT |
| text-input (apellidos) | input | GEN-015-02 | MUST IMPLEMENT |
| select (tipoIdentificacion) | select | GEN-015-03 | MUST IMPLEMENT |

**No Substitutions Rule:**
- CANNOT replace text-input with Material mat-input (use @gf/ui text-input)
- CANNOT skip error states (all must be present)
- CANNOT omit async validators (duplicate-check, etc.)
- CANNOT change accessibility attributes

**Verification:**
- Code review MUST verify each component against GEN-015
- UI test MUST verify visual match to Stitch design
- A11y test MUST verify WCAG 2.2 AA per GEN-015
```

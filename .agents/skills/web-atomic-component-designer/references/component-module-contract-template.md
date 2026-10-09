---
artifact: component-module-contract
okf: google-okf-v0.2
id: CMC-EXAMPLE-001
generated: YYYY-MM-DD
verified: false
status: REQUIRES_REVIEW
sources: []
provenance:
  created_by: web-atomic-component-designer
  method: derived-from-accepted-framework-adr
  confidence: medium
human-reviewed: false
---

# Component Module Contract

Use when components live inside the application. If an accepted ADR decides a library, use `npm-package-contract-template.md` instead.

## Location and exports

- Module path:
- Exported components and types:
- Not exported (services, internal types):

## Contract rules

- Props/inputs and callbacks/outputs use the TypeScript types of each CMP-*.
- Components do not import services, router or APIs.
- Test tooling and scenarios per the accepted ADR (for example one Storybook story per variant and state).

## Change policy

- Breaking: renaming props or event discriminants.
- Additive: new optional props.
- Semver, owner and release automation apply only if a library is decided.

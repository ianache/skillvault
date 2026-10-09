---
artifact: npm-package-contract
okf: google-okf-v0.2
id: NPC-DSP-2026-001
title: "NPM package contract — package components"
generated:
  by: web-atomic-component-designer/0.2.0
  at: "2026-10-08T00:00:00-05:00"
status: REQUIRES_REVIEW
lifecycle: superseded
superseded_by: component-module-contract.md
sources:
  - /knowledge-base/design/atomic-components/atomic-component-catalog.md
  - /knowledge-base/design/atomic-components/angular-library-architecture.md
provenance:
  created_by: web-atomic-component-designer/0.2.0
  method: npm-contract-candidate
  confidence: low
---

> **Reemplazado por [component-module-contract.md](component-module-contract.md) (ADR-004: Next.js/React).** Esta propuesta asumía publicación NPM, peer dependencies de Angular y semver de librería. Se conserva como historial; no es normativo.

# NPM package contract — package components

## Candidate exports

```text
@skillvault/ui/packages
  PackageCard
  PackageStatus
  PackageSearchPanel
  PackageSkillPicker
  PackageCardGrid
```

## Contract rules

- Public inputs and outputs use stable TypeScript types documented by each CMP.
- Domain services and internal database types are not exported.
- Tree-shaking requires standalone components or equivalent confirmed strategy.
- Peer dependencies must be confirmed for Angular, CDK and the Design System.
- Initial publication should be `0.x` until human approval of the contract.

## Semver and lifecycle

Changing input names, event discriminants or required fields is breaking. Adding optional inputs is additive. Deprecation policy, package owner, registry and release automation remain open.

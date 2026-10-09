---
artifact: component-module-contract
okf: google-okf-v0.2
id: CMC-DSP-2026-001
title: "Component module contract — package components"
generated:
  by: web-atomic-component-designer/0.3.0
  at: "2026-10-08T00:00:00-05:00"
verified: false
status: REQUIRES_REVIEW
sources:
  - /knowledge-base/architecture/adrs/ADR-004-nextjs-react-frontend-web.md
  - /knowledge-base/architecture/adrs/ADR-005-storybook-pruebas-de-componentes.md
  - /knowledge-base/design/atomic-components/atomic-component-catalog.md
  - /knowledge-base/design/atomic-components/react-component-architecture.md
  - /knowledge-base/design/atomic-components/npm-package-contract.md
provenance:
  created_by: web-atomic-component-designer/0.3.0
  method: reconciliation-with-adr-004-adr-005
  confidence: medium
human-reviewed: false
---

# Component module contract — package components

Reemplaza a `npm-package-contract.md` (NPC-DSP-2026-001). ADR-004 no decide publicar los componentes como paquete NPM: no hay registro, peer dependencies ni semver de librería mientras no exista esa decisión.

## Exports (propuesta)

Módulo interno del portal, sin publicación:

```text
src/components/packages/
  PackageStatus
  PackageCard
  PackageSearchPanel
  PackageSkillPicker
```

`PackageCardGrid` y los componentes sin spec quedan fuera del alcance de `DSP-2026-002`.

## Contract rules

- Props y callbacks usan los tipos TypeScript documentados en cada `CMP-*`.
- No se exportan servicios de dominio ni tipos internos de base de datos.
- Los componentes no importan servicios, router ni APIs.
- Cada componente tiene stories de Storybook por variante y estado (`ADR-005`).

## Cambios de contrato

Al ser un módulo interno, un cambio de props se resuelve refactorizando los consumidores con ayuda del compilador de TypeScript. Renombrar props o discriminantes de eventos sigue considerándose cambio incompatible; añadir props opcionales, aditivo. Semver, propietario del paquete, registro y automatización de releases solo aplican si se decide extraer una librería (no decidido).

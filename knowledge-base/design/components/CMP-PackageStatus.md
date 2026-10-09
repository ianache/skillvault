---
artifact: component-specification
okf: google-okf-v0.2
id: CMP-ATOM-001
title: "Package status"
generated:
  by: web-atomic-component-designer/0.2.0
  at: "2026-10-08T00:00:00-05:00"
verified: false
status: REQUIRES_REVIEW
sources:
  - /knowledge-base/architecture/adrs/ADR-004-nextjs-react-frontend-web.md
  - /knowledge-base/design/screens/SCR-001-catalogo-mantenimiento-paquetes.md
  - /knowledge-base/design/ux-requirements/UXR-001-catalogo-paquetes.md
provenance:
  created_by: web-atomic-component-designer/0.2.0
  method: derived-from-status-and-warning-rules
  confidence: medium
visual_design:
  tool: stitch
  project_id: "1874775286672335993"
  screen_id: "2dd84f1ca2ef4ec0b6edeba82e8ff05d"
  url: "https://stitch.withgoogle.com/projects/1874775286672335993?node-id=2dd84f1ca2ef4ec0b6edeba82e8ff05d"
  design_system: "SkillVault Portal Light (assets/9009552743441703194) + Dark (assets/12691038429936688410), pendiente de generar"
  covers: [draft, published, retired, retired-with-warning, compact, version-suffix, unknown-status-error, loading, mobile-360]
  status: pending
  last_synced: 2026-10-08
  waiver_reason: ""
---

# Component Specification

## Identity

- Component ID: `CMP-ATOM-001`
- Name and selector: `PackageStatus` / `sv-package-status`
- Atomic level: atom
- Purpose: comunicar estado del paquete y advertencias de retiro sin depender solo del color.
- Non-goals: calcular estado o llamar APIs.
- Owner: por confirmar.
- Consumers: `PackageCard`, detalle público, revisión.

## Reconciliación con ADR-004

`ADR-004` (Aceptado, 2026-10-08) fija **Next.js sobre React** como tecnología del frontend web y descarta Angular. **Prevalece sobre cualquier mención a Angular, selectores, NPM o `@skillvault/ui` de esta spec**, que quedan como contexto histórico no normativo. Los tipos TypeScript de la sección de contrato siguen vigentes.

| Contrato original (Angular) | Equivalente vigente (React) |
|---|---|
| Selector `sv-package-status` | Componente `PackageStatus` (función componente) |
| Inputs `value`, `version`, `warning`, `compact` | Props `value`, `version?`, `warning?`, `compact?` (mismo tipo TypeScript `PackageStatusInput`) |
| Outputs | Ninguno |
| Estrategia standalone/módulo, signals/observables | No aplica; estado local con hooks si hiciera falta |
| Export `@skillvault/ui/packages` | Interno al portal: `src/components/packages/PackageStatus.tsx` (propuesta). Librería externa o extracción a otro framework: no decidido por ADR-004 |
| Semver / clasificación de cambio | Solo relevante si se publica como librería; hoy el componente es interno |

- Servidor/cliente: Presentacional puro: sin estado ni eventos; compatible con Server Components. La estrategia de renderizado por ruta no la decide ADR-004.
- Verificación: `next build`, pruebas existentes y regresión de componentes compartidos (ADR-004, Impacto en pruebas). Storybook (ADR-005, decisión humana, texto pendiente de revisión): una story por variante y estado de esta spec, con pruebas de interacción y accesibilidad. WCAG 2.2 AA y revisión visual contra el diseño Stitch enlazado.
- Los nombres de props/callbacks marcados como propuesta se confirman en la revisión humana de la spec.

## Component contract

> Nota ADR-004: el contrato se escribió originalmente para Angular; ver "Reconciliación con ADR-004" para el mapeo a React.

```ts
export type PackageStatusValue = 'draft' | 'published' | 'retired';
export interface PackageStatusInput {
  value: PackageStatusValue;
  version?: string | null;
  warning?: string | null;
}
```

- Selector: no aplica (React, ADR-004); componente `PackageStatus`
- Inputs: `value`, `version`, `warning`, `compact`.
- Outputs: ninguno.
- Slots: ninguno.
- Side effects: ninguno.
- Public export: interno al portal, `src/components/packages/PackageStatus.tsx` (propuesta); librería externa no decidida por ADR-004.

## Behavior and visual contract

| Dimension | Specification |
|---|---|
| Variants | draft, published, retired, warning |
| Loading | placeholder text only when parent is loading |
| Empty | unknown status is an error, not silent fallback |
| Error | invalid value should be rejected by input type/validator |
| Responsive | inline and wrap-safe |
| Localization | label map injected or supplied by parent |
| Tokens | semantic status tokens pending Design System decision |

## Visual design

- Tool: Stitch
- Design link: Stitch project `1874775286672335993`, screen "SkillVault — Specimen CMP-ATOM-001 PackageStatus (Light)" <https://stitch.withgoogle.com/projects/1874775286672335993?node-id=2dd84f1ca2ef4ec0b6edeba82e8ff05d>
- Project / screen id: `1874775286672335993` / `2dd84f1ca2ef4ec0b6edeba82e8ff05d`
- Design system: SkillVault Portal Light (`assets/9009552743441703194`) y Dark (`assets/12691038429936688410`), derivados de `_ds/skillvault` (pendiente de generar)
- Covered variants, states, breakpoints: draft, published, retired, retired con warning, compact, sufijo de versión, estado desconocido (error), loading, contenedor móvil 360px
- Known gaps between design and spec: **decisión humana (human:ianache), 2026-10-08: el sistema de diseño canónico es `_ds/skillvault`.** El diseño Stitch enlazado usa otro sistema (azul) y queda como referencia estructural no canónica; se regenera en claro y oscuro con los design systems indicados. Tokens en `design-token-contract.md`. Notas previas: Versión corregida (tokens SkillVault Light, IBM Plex Sans, nota "Regla de estados"). Reemplaza a `669d4feb3b9e48e9851750e8eb64c379` (descartar). Verificado en el HTML descargado (IBM Plex y fondo #fbf8ff presentes); aspecto visual no revisado. Modo oscuro requerido (decisión humana (human:ianache), 2026-10-08); el diseño Stitch es solo Light.
- Developer instruction: implement against this design AND this specification; do not infer visuals from the spec alone.

## Accessibility and security

- Use visible text and, when needed, `role="status"` or `role="note"` supplied by context.
- Retired warning must be announced and must not rely on color.
- No sensitive data; render known enum values only.

## Verification

- Unit: all statuses, version fallback and warning.
- Accessibility: non-color status and readable contrast.
- Visual: each state in light/dark themes if supported.
- Acceptance: SCR-001 and UXR-001 status/retired semantics.

## Change and lifecycle

- Change classification: additive for a new status only if API remains backward compatible.
- Open questions: final copy, severity icon and semantic tokens.
- Human review event: not set by agents.

## Traceability

- User Story: `US-001`, `US-002`
- UXR: `UXR-001`, `UXR-002`
- Screens: `SCR-001`, `SCR-005`
- Internal links: `ACC-DSP-2026-001`, `CMP-ORG-001`.

---
artifact: component-specification
okf: google-okf-v0.2
id: CMP-ORG-001
title: "Package card"
generated:
  by: web-atomic-component-designer/0.2.0
  at: "2026-10-08T00:00:00-05:00"
verified: false
status: REQUIRES_REVIEW
sources:
  - /knowledge-base/architecture/adrs/ADR-004-nextjs-react-frontend-web.md
  - /knowledge-base/design/screens/SCR-001-catalogo-mantenimiento-paquetes.md
  - /knowledge-base/design/components/CMP-001-paquetes-skills.md
  - /knowledge-base/design/atomic-components/atomic-component-catalog.md
provenance:
  created_by: web-atomic-component-designer/0.2.0
  method: derived-from-scr-001
  confidence: medium
visual_design:
  tool: stitch
  project_id: "1874775286672335993"
  screen_id: "db8519d701bc4a8e9c735ff190a21b6c"
  url: "https://stitch.withgoogle.com/projects/1874775286672335993?node-id=db8519d701bc4a8e9c735ff190a21b6c"
  design_system: "SkillVault Light (assets/71d2e6f7982a469294c1e9b1ada2adf1)"
  covers: [maintenance, public-readonly, draft, published, retired-with-warning, disabled, loading-skeleton, grid-desktop-3col, mobile-1col]
  status: linked
  last_synced: 2026-10-08
  waiver_reason: ""
---

# Component Specification

## Identity

- Component ID: `CMP-ORG-001`
- Name and selector: `PackageCard` / `sv-package-card`
- Atomic level: organism
- Purpose: mostrar identidad, rol, estado, versión y acciones de un paquete mantenible.
- Non-goals: cargar datos, decidir permisos o ejecutar mutaciones.
- Owner: por confirmar.
- Consumers: `PackageCardGrid`, catálogo de mantenimiento.

## Composition

- Allowed children: `sv-package-icon`, `sv-package-status`, `sv-package-card-meta`, `sv-package-card-actions`.
- Parent contexts: `sv-package-card-grid`, template de catálogo.
- Dependency direction: recibe datos y eventos; no depende de servicios.
- Reuse rationale: SCR-001 exige una tarjeta por paquete y el componente también puede reutilizarse en catálogos públicos con acciones reducidas.
- Existing component decision: la implementación actual React tiene una tarjeta local; requiere extracción a componente compartido en `src/components/packages/` (ADR-004: React).

## Reconciliación con ADR-004

`ADR-004` (Aceptado, 2026-10-08) fija **Next.js sobre React** como tecnología del frontend web y descarta Angular. **Prevalece sobre cualquier mención a Angular, selectores, NPM o `@skillvault/ui` de esta spec**, que quedan como contexto histórico no normativo. Los tipos TypeScript de la sección de contrato siguen vigentes.

| Contrato original (Angular) | Equivalente vigente (React) |
|---|---|
| Selector `sv-package-card` | Componente `PackageCard` |
| Inputs `package`, `actions`, `disabled`, `warningText?` | Props con los mismos nombres |
| Output `event` (`PackageCardEvent`) | Prop callback `onEvent(event: PackageCardEvent)` (propuesta) |
| Estrategia standalone/módulo, signals/observables | No aplica; estado local con hooks si hiciera falta |
| Export `@skillvault/ui/packages` | Interno al portal: `src/components/packages/PackageCard.tsx` (propuesta). Librería externa o extracción a otro framework: no decidido por ADR-004 |
| Semver / clasificación de cambio | Solo relevante si se publica como librería; hoy el componente es interno |

- Servidor/cliente: Emite eventos por click: requiere límite de cliente (`"use client"`), como los `*Client.tsx` existentes. La estrategia de renderizado por ruta no la decide ADR-004.
- Verificación: `next build`, pruebas existentes y regresión de componentes compartidos (ADR-004, Impacto en pruebas). Storybook (ADR-005, decisión humana, texto pendiente de revisión): una story por variante y estado de esta spec, con pruebas de interacción y accesibilidad. WCAG 2.2 AA y revisión visual contra el diseño Stitch enlazado.
- Los nombres de props/callbacks marcados como propuesta se confirman en la revisión humana de la spec.

## Component contract

> Nota ADR-004: el contrato se escribió originalmente para Angular; ver "Reconciliación con ADR-004" para el mapeo a React.

```ts
export interface PackageCardInput {
  slug: string;
  name: string;
  description: string;
  role: string;
  status: 'draft' | 'published' | 'retired';
  version: string | null;
  skillCount?: number;
  actions: { edit?: boolean; duplicate?: boolean; review?: boolean; retire?: boolean };
}
export type PackageCardEvent =
  | { type: 'open'; slug: string }
  | { type: 'edit' | 'duplicate' | 'review' | 'retire'; slug: string };
```

- Selector: no aplica (React, ADR-004); componente `PackageCard`
- Strategy: función componente React (Next.js 16 / React 19) según ADR-004.
- Inputs: `package`, `actions`, `disabled`, `warningText?`.
- Outputs: `event` with stable discriminated payload.
- Projection slots: optional `actions` slot only if Design System requires it.
- Signals/observables: no aplica en React; estado local con hooks si fuera necesario.
- Side effects/services: none.
- Public export: interno al portal, `src/components/packages/PackageCard.tsx` (propuesta); librería externa no decidida por ADR-004.

## Behavior and visual contract

| Dimension | Specification |
|---|---|
| Variants | maintenance, public-readonly |
| Sizes | responsive card; exact tokens pending |
| Loading | skeleton card owned by grid |
| Success | package data rendered |
| Empty | owned by grid, not card |
| Error | owned by page/grid |
| Disabled | actions disabled and explanatory text |
| Offline/recovery | page displays recovery; card remains stable |
| Responsive | one column mobile; grid columns desktop; breakpoint pending |
| Localization | labels/status/actions externalizable |
| Design tokens | official tokens not identified |

## Visual design

- Tool: Stitch
- Design link: Stitch project `1874775286672335993`, screen "SkillVault — Specimen CMP-ORG-001 PackageCard (Light) v2" <https://stitch.withgoogle.com/projects/1874775286672335993?node-id=db8519d701bc4a8e9c735ff190a21b6c>
- Project / screen id: `1874775286672335993` / `db8519d701bc4a8e9c735ff190a21b6c`
- Design system: SkillVault Light (`assets/71d2e6f7982a469294c1e9b1ada2adf1`)
- Covered variants, states, breakpoints: maintenance, public-readonly, draft, published, retired con warning, disabled, loading skeleton, grid desktop 3 columnas, móvil 1 columna
- Known gaps between design and spec: Regenerada (v2) con la regla canónica de estados. Verificado en el HTML: badges Borrador/Publicado/Retirado canónicos, IBM Plex Sans, anillo de foco #2250d4, sin Retirado rojo/ámbar; cobertura de estados según el prompt, aspecto visual no revisado. Duplicados a eliminar en Stitch: `9834137732064cdfafa4254ed53c6124`, `d8eb3fa8982d464799b67312eefa9a89`, `dbabe18c61244b2895f234a4e6e14e38`. Modo oscuro requerido (decisión humana (human:ianache), 2026-10-08); el diseño Stitch es solo Light.
- Developer instruction: implement against this design AND this specification; do not infer visuals from the spec alone.

## Accessibility and security

- WCAG target: 2.2 AA; semantic `article` with accessible link name from package name.
- Keyboard: title/link and actions in logical DOM order; visible focus.
- Screen reader: status includes text, not color only; retired warning announced.
- Security: card renders escaped text; URLs use validated slug; permission decisions stay upstream.

## Verification

- Unit: status, version fallback, optional actions and warning.
- Interaction: keyboard activation and action event payloads.
- Accessibility: axe-equivalent scan, focus-visible, name/role/value.
- Visual: default, retired, draft, long description, mobile.
- Consumer contract: stable input/event types.
- Performance: no service calls; render bounded to one package.
- Acceptance: SCR-001 package identity, role, state and version visible.

## Change and lifecycle

- Change classification: unknown until the public props are frozen; semver applies only if published as a library (not decided by ADR-004).
- Semver impact: candidate minor for additive inputs; confirm with library owner.
- Open questions: skill count source, Design System tokens, exact status copy, owner.
- Human review event: not set by agents.

## Traceability

- User Story: `US-001`
- UXR: `UXR-002`
- Flow: `FLW-001`
- Screen: `SCR-001`
- Internal links: `ACC-DSP-2026-001`, `UINV-DSP-2026-001`.

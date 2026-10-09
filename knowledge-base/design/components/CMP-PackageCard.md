---
artifact: component-specification
okf: google-okf-v0.2
id: CMP-ORG-001
title: "Package card"
generated:
  by: web-atomic-component-designer/0.2.0
  at: "2026-10-08T00:00:00-05:00"
verified: true
status: READY_FOR_DEV
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
  screen_id: "ee54232acf3a4329a697efa9a1c40230"
  url: "https://stitch.withgoogle.com/projects/1874775286672335993?node-id=ee54232acf3a4329a697efa9a1c40230"
  screen_id_dark: "9d68e663c80c4b768859ad536998dc97"
  url_dark: "https://stitch.withgoogle.com/projects/1874775286672335993?node-id=9d68e663c80c4b768859ad536998dc97"
  design_system: "SkillVault Portal Light (assets/9009552743441703194) + Dark (assets/12691038429936688410), derivados de _ds/skillvault"
  covers: [maintenance, public-readonly, draft, published, retired-warning-line, disabled, loading-skeleton, grid-desktop-3col, mobile-1col]
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
- Owner: `human:ianache` (decisión humana (human:ianache), 2026-10-09).
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
| Output `event` (`PackageCardEvent`) | Prop callback `onEvent(event: PackageCardEvent)` (confirmado, decisión humana (human:ianache), 2026-10-09) |
| Estrategia standalone/módulo, signals/observables | No aplica; estado local con hooks si hiciera falta |
| Export `@skillvault/ui/packages` | Interno al portal: `src/components/packages/PackageCard.tsx` (confirmado, decisión humana (human:ianache), 2026-10-09). Librería externa o extracción a otro framework: no decidido por ADR-004 |
| Semver / clasificación de cambio | Solo relevante si se publica como librería; hoy el componente es interno |

- Aviso de Skills retirados (decisión humana (human:ianache), 2026-10-09): usa `retiredSkillCount` de `PackageSummary`; `skillCount` es opcional.
- Servidor/cliente: Emite eventos por click: requiere límite de cliente (`"use client"`), como los `*Client.tsx` existentes. La estrategia de renderizado por ruta no la decide ADR-004.
- Estilos y foco (decisión humana (human:ianache), 2026-10-08): estilos en línea con `var(--…)` (ver `design-token-contract.md`); foco visible con el anillo global de 2px `--accent` de `globals.css`, sin `outline: 0`. Los estilos en línea no admiten media queries ni `:hover`: el responsive se resuelve con grid o flex intrínsecos.
- Verificación: `next build`, pruebas existentes y regresión de componentes compartidos (ADR-004, Impacto en pruebas). Storybook (ADR-005, decisión humana, texto pendiente de revisión): una story por variante y estado de esta spec, con pruebas de interacción y accesibilidad. WCAG 2.2 AA y revisión visual contra el diseño Stitch enlazado.
- Nombres de props/callbacks y ubicación confirmados (decisión humana (human:ianache), 2026-10-09).

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
- Public export: interno al portal, `src/components/packages/PackageCard.tsx` (confirmado, decisión humana (human:ianache), 2026-10-09); librería externa no decidida por ADR-004.

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
| Design tokens | ver `design-token-contract.md`; Retirado neutro (decisión humana (human:ianache), 2026-10-08) |

## Visual design

- Tool: Stitch
- Design link (claro): Stitch project `1874775286672335993`, screen "SkillVault Portal — Specimen CMP-ORG-001 PackageCard (Light)" <https://stitch.withgoogle.com/projects/1874775286672335993?node-id=ee54232acf3a4329a697efa9a1c40230>
- Design link (oscuro): screen "SkillVault Portal — Specimen CMP-ORG-001 PackageCard (Dark)" <https://stitch.withgoogle.com/projects/1874775286672335993?node-id=9d68e663c80c4b768859ad536998dc97>
- Project / screen id: `1874775286672335993` / `ee54232acf3a4329a697efa9a1c40230` (claro), `9d68e663c80c4b768859ad536998dc97` (oscuro)
- Design system: SkillVault Portal Light (`assets/9009552743441703194`) y Dark (`assets/12691038429936688410`), derivados de `_ds/skillvault` (decisión humana (human:ianache), 2026-10-08)
- Covered variants, states, breakpoints: maintenance, public-readonly, draft, published, retired-warning-line, disabled, loading-skeleton, grid-desktop-3col, mobile-1col
- Known gaps between design and spec: Diseño canónico generado con el design system del portal. Verificado en el HTML descargado: Space Grotesk, acento marrón `#a9772e`, fondos `#f7f5f0` (claro) y `#16140f` (oscuro), sin azul de acento (el azul aparece solo en resaltado de código y en iniciales de avatar de las muestras), badges Borrador/Publicado/Retirado con icono y etiqueta, forma de píldora y borde punteado en Borrador. Los estilos usan hexadecimales y clases Tailwind, no las variables `--*` del portal (ver `design-token-contract.md`). Cobertura según el prompt; aspecto visual revisado por `human:ianache` el 2026-10-09. Sustituye al diseño del sistema azul `db8519d701bc4a8e9c735ff190a21b6c` (descartar).
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
- Human review event: aprobación de `human:ianache`, 2026-10-09, resultado "aprobado" (checklist `RVW-2026-001`; declaración del revisor: "todo es conforme").

## Traceability

- User Story: `US-001`
- UXR: `UXR-002`
- Flow: `FLW-001`
- Screen: `SCR-001`
- Internal links: `ACC-DSP-2026-001`, `UINV-DSP-2026-001`.

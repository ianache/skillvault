---
artifact: component-specification
okf: google-okf-v0.2
id: CMP-ORG-002
title: "Package search panel"
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
  method: extracted-from-catalog-filter-interaction
  confidence: medium
visual_design:
  tool: stitch
  project_id: "1874775286672335993"
  screen_id: "56719e4f643d400e95bc6252657b9666"
  url: "https://stitch.withgoogle.com/projects/1874775286672335993?node-id=56719e4f643d400e95bc6252657b9666"
  screen_id_dark: "af91096679544801a9ef8918f7ede828"
  url_dark: "https://stitch.withgoogle.com/projects/1874775286672335993?node-id=af91096679544801a9ef8918f7ede828"
  design_system: "SkillVault Portal Light (assets/9009552743441703194) + Dark (assets/12691038429936688410), derivados de _ds/skillvault"
  covers: [default, compact, empty, filled, focus, loading-disabled, no-matches, desktop-row, narrow-stacked]
  status: linked
  last_synced: 2026-10-08
  waiver_reason: ""
---

# Component Specification

## Identity

- Component ID: `CMP-ORG-002`
- Name and selector: `PackageSearchPanel` / `sv-package-search-panel`
- Atomic level: organism
- Purpose: capturar búsqueda textual y filtros de rol/estado, con limpieza y resultado de filtros.
- Non-goals: consultar APIs o filtrar datos fuera del contrato recibido.
- Consumers: `PackageCatalogTemplate`.

## Reconciliación con ADR-004

`ADR-004` (Aceptado, 2026-10-08) fija **Next.js sobre React** como tecnología del frontend web y descarta Angular. **Prevalece sobre cualquier mención a Angular, selectores, NPM o `@skillvault/ui` de esta spec**, que quedan como contexto histórico no normativo. Los tipos TypeScript de la sección de contrato siguen vigentes.

| Contrato original (Angular) | Equivalente vigente (React) |
|---|---|
| Selector `sv-package-search-panel` | Componente `PackageSearchPanel` |
| Inputs `value`, `roles`, `statuses`, `disabled` | Props con los mismos nombres |
| Outputs `filtersChange`, `clear` | Callbacks `onFiltersChange(filters)` y `onClear()` (confirmado, decisión humana (human:ianache), 2026-10-09) |
| Estrategia standalone/módulo, signals/observables | No aplica; estado local con hooks si hiciera falta |
| Export `@skillvault/ui/packages` | Interno al portal: `src/components/packages/PackageSearchPanel.tsx` (confirmado, decisión humana (human:ianache), 2026-10-09). Librería externa o extracción a otro framework: no decidido por ADR-004 |
| Semver / clasificación de cambio | Solo relevante si se publica como librería; hoy el componente es interno |

- Servidor/cliente: Controles interactivos: requiere límite de cliente (`"use client"`). La estrategia de renderizado por ruta no la decide ADR-004.
- Estilos y foco (decisión humana (human:ianache), 2026-10-08): estilos en línea con `var(--…)` (ver `design-token-contract.md`); foco visible con el anillo global de 2px `--accent` de `globals.css`, sin `outline: 0`. Los estilos en línea no admiten media queries ni `:hover`: el responsive se resuelve con grid o flex intrínsecos.
- Verificación: `next build`, pruebas existentes y regresión de componentes compartidos (ADR-004, Impacto en pruebas). Storybook (ADR-005, decisión humana, texto pendiente de revisión): una story por variante y estado de esta spec, con pruebas de interacción y accesibilidad. WCAG 2.2 AA y revisión visual contra el diseño Stitch enlazado.
- Nombres de props/callbacks y ubicación confirmados (decisión humana (human:ianache), 2026-10-09).

## Component contract

> Nota ADR-004: el contrato se escribió originalmente para Angular; ver "Reconciliación con ADR-004" para el mapeo a React.

```ts
export interface PackageFilters { query: string; role: string; status: string; }
export interface PackageSearchPanelEvent { type: 'filtersChange' | 'clear'; filters: PackageFilters; }
```

- Selector: no aplica (React, ADR-004); componente `PackageSearchPanel`
- Inputs: `value`, `roles`, `statuses`, `disabled`.
- Outputs: `filtersChange`, `clear`.
- Slots: optional actions slot for additional filters.
- Side effects: none; debounce policy is page-owned and pending.
- Public export: interno al portal, `src/components/packages/PackageSearchPanel.tsx` (confirmado, decisión humana (human:ianache), 2026-10-09); librería externa no decidida por ADR-004.

## Behavior and visual contract

| Dimension | Specification |
|---|---|
| Variants | default, compact |
| Loading | controls disabled while parent loads |
| Empty | clear filters remains available when no matches |
| Error | parent owns error and retry |
| Disabled | all inputs and clear action reflect disabled state |
| Responsive | fields stack on narrow screens |
| Localization | labels, placeholders and option names externalizable |
| Tokens | ver `design-token-contract.md`; Retirado neutro (decisión humana (human:ianache), 2026-10-08) |

## Visual design

- Tool: Stitch
- Design link (claro): Stitch project `1874775286672335993`, screen "SkillVault Portal — Specimen CMP-ORG-002 PackageSearchPanel (Light)" <https://stitch.withgoogle.com/projects/1874775286672335993?node-id=56719e4f643d400e95bc6252657b9666>
- Design link (oscuro): screen "SkillVault Portal — Specimen CMP-ORG-002 PackageSearchPanel (Dark)" <https://stitch.withgoogle.com/projects/1874775286672335993?node-id=af91096679544801a9ef8918f7ede828>
- Project / screen id: `1874775286672335993` / `56719e4f643d400e95bc6252657b9666` (claro), `af91096679544801a9ef8918f7ede828` (oscuro)
- Design system: SkillVault Portal Light (`assets/9009552743441703194`) y Dark (`assets/12691038429936688410`), derivados de `_ds/skillvault` (decisión humana (human:ianache), 2026-10-08)
- Covered variants, states, breakpoints: default, compact, empty, filled, focus, loading-disabled, no-matches, desktop-row, narrow-stacked
- Known gaps between design and spec: Diseño canónico generado con el design system del portal. Verificado en el HTML descargado: Space Grotesk, acento marrón `#a9772e`, fondos `#f7f5f0` (claro) y `#16140f` (oscuro), sin azul de acento (el azul aparece solo en resaltado de código y en iniciales de avatar de las muestras), badges Borrador/Publicado/Retirado con icono y etiqueta, forma de píldora y borde punteado en Borrador. Los estilos usan hexadecimales y clases Tailwind, no las variables `--*` del portal (ver `design-token-contract.md`). Cobertura según el prompt; aspecto visual no revisado. Sustituye al diseño del sistema azul `95553adaab1d43939d07ad2cb9a224b6` (descartar).
- Developer instruction: implement against this design AND this specification; do not infer visuals from the spec alone.

## Accessibility and security

- Every control has a visible or programmatic label.
- Search field is first in keyboard order; clear action has accessible name.
- Filter state is exposed as values, not only visual chips.
- Query is presentation state and must not be used to construct unsafe HTML or SQL.

## Verification

- Unit: emits complete filter object and clear event.
- Interaction: keyboard navigation, clear and change events.
- Accessibility: labels, focus-visible, contrast and reduced motion.
- Visual: default, filtered, long labels, mobile.

## Change and lifecycle

- Change classification: unknown until filter vocabulary is approved.
- Open questions: debounce, exact options, Design System form controls.
- Human review event: not set by agents.

## Traceability

- User Story: `US-001`
- UXR: `UXR-001`, `UXR-002`
- Screen: `SCR-001`
- Internal links: `ACC-DSP-2026-001`, `CMP-ORG-004`.

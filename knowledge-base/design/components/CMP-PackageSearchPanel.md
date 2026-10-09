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
  screen_id: "95553adaab1d43939d07ad2cb9a224b6"
  url: "https://stitch.withgoogle.com/projects/1874775286672335993?node-id=95553adaab1d43939d07ad2cb9a224b6"
  design_system: "SkillVault Portal Light (assets/9009552743441703194) + Dark (assets/12691038429936688410), pendiente de generar"
  covers: [default, compact, filled-filters, loading-disabled, no-matches, extra-actions-slot]
  status: pending
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
| Outputs `filtersChange`, `clear` | Callbacks `onFiltersChange(filters)` y `onClear()` (propuesta) |
| Estrategia standalone/módulo, signals/observables | No aplica; estado local con hooks si hiciera falta |
| Export `@skillvault/ui/packages` | Interno al portal: `src/components/packages/PackageSearchPanel.tsx` (propuesta). Librería externa o extracción a otro framework: no decidido por ADR-004 |
| Semver / clasificación de cambio | Solo relevante si se publica como librería; hoy el componente es interno |

- Servidor/cliente: Controles interactivos: requiere límite de cliente (`"use client"`). La estrategia de renderizado por ruta no la decide ADR-004.
- Verificación: `next build`, pruebas existentes y regresión de componentes compartidos (ADR-004, Impacto en pruebas). Storybook (ADR-005, decisión humana, texto pendiente de revisión): una story por variante y estado de esta spec, con pruebas de interacción y accesibilidad. WCAG 2.2 AA y revisión visual contra el diseño Stitch enlazado.
- Los nombres de props/callbacks marcados como propuesta se confirman en la revisión humana de la spec.

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
- Public export: interno al portal, `src/components/packages/PackageSearchPanel.tsx` (propuesta); librería externa no decidida por ADR-004.

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
| Tokens | semantic form/control tokens pending |

## Visual design

- Tool: Stitch
- Design link: Stitch project `1874775286672335993`, screen "SkillVault v2 — Specimen CMP-ORG-002 PackageSearchPanel (Light)" <https://stitch.withgoogle.com/projects/1874775286672335993?node-id=95553adaab1d43939d07ad2cb9a224b6>
- Project / screen id: `1874775286672335993` / `95553adaab1d43939d07ad2cb9a224b6`
- Design system: SkillVault Portal Light (`assets/9009552743441703194`) y Dark (`assets/12691038429936688410`), derivados de `_ds/skillvault` (pendiente de generar)
- Covered variants, states, breakpoints: default, compact, filled filters, loading disabled, no matches, extra actions slot
- Known gaps between design and spec: **decisión humana (human:ianache), 2026-10-08: el sistema de diseño canónico es `_ds/skillvault`.** El diseño Stitch enlazado usa otro sistema (azul) y queda como referencia estructural no canónica; se regenera en claro y oscuro con los design systems indicados. Tokens en `design-token-contract.md`. Notas previas: Pantalla v2 enlazada por el usuario. Verificada en el HTML: opciones de estado exactas (Todos, Borrador, Publicado, Retirado), roles genéricos (Rol A/B/C), sin "En revisión", chips de estado equivalentes a la regla canónica (clases Tailwind, no tokens). Desviaciones: IBM Plex Sans solo figura en una anotación y no se carga (el cuerpo cae a la tipografía por defecto), y no hay estilos de foco visibles (`focus:ring`), requisito de la spec. Cobertura según el prompt, aspecto visual no revisado. Alternativa descartada: `2568125a3b5349baa1c7bf79d6a14f33` (sí carga IBM Plex y tiene foco); original `1a3f07cd786c4642b8eea0e87252df32` (descartar). Sistema de diseño Stitch azul, no el de `_ds/skillvault` (ver Q-10 de DCP-2026-001). Modo oscuro requerido (decisión humana (human:ianache), 2026-10-08); el diseño Stitch es solo Light.
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

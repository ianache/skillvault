---
artifact: component-specification
okf: google-okf-v0.2
id: CMP-ORG-003
title: "Package Skill picker"
generated:
  by: web-atomic-component-designer/0.2.0
  at: "2026-10-08T00:00:00-05:00"
verified: false
status: REQUIRES_REVIEW
sources:
  - /knowledge-base/architecture/adrs/ADR-004-nextjs-react-frontend-web.md
  - /knowledge-base/design/screens/SCR-002-editor-paquete-skills.md
  - /knowledge-base/design/components/CMP-001-paquetes-skills.md
  - /knowledge-base/design/ux-requirements/UXR-002-mantenimiento-paquete.md
provenance:
  created_by: web-atomic-component-designer/0.2.0
  method: extracted-from-skill-composition-interaction
  confidence: medium
visual_design:
  tool: stitch
  project_id: "1874775286672335993"
  screen_id: "21ff5a2089e24deb886c2d1506985c82"
  url: "https://stitch.withgoogle.com/projects/1874775286672335993?node-id=21ff5a2089e24deb886c2d1506985c82"
  screen_id_dark: "ef6203dda288420090f3b991a025bd44"
  url_dark: "https://stitch.withgoogle.com/projects/1874775286672335993?node-id=ef6203dda288420090f3b991a025bd44"
  design_system: "SkillVault Portal Light (assets/9009552743441703194) + Dark (assets/12691038429936688410), derivados de _ds/skillvault"
  covers: [empty-selection, populated, loading-results, error-preserves-selection, disabled, latest-pinned-toggle, retired-warning-line]
  status: linked
  last_synced: 2026-10-08
  waiver_reason: ""
---

# Component Specification

## Identity

- Component ID: `CMP-ORG-003`
- Name and selector: `PackageSkillPicker` / `sv-package-skill-picker`
- Atomic level: organism
- Purpose: buscar Skills publicados, agregarlos al paquete y gestionar orden/política de versión.
- Non-goals: publicar Skills, instalar Skills o resolver permisos.
- Consumers: `PackageEditorTemplate`.

## Reconciliación con ADR-004

`ADR-004` (Aceptado, 2026-10-08) fija **Next.js sobre React** como tecnología del frontend web y descarta Angular. **Prevalece sobre cualquier mención a Angular, selectores, NPM o `@skillvault/ui` de esta spec**, que quedan como contexto histórico no normativo. Los tipos TypeScript de la sección de contrato siguen vigentes.

| Contrato original (Angular) | Equivalente vigente (React) |
|---|---|
| Selector `sv-package-skill-picker` | Componente `PackageSkillPicker` |
| Inputs `availableSkills`, `selectedSkills`, `loading`, `disabled` | Props con los mismos nombres |
| Output `selectionChange` / `saveDraft` | Callbacks `onSelectionChange(items)` y `onSaveDraft()` (confirmado, decisión humana (human:ianache), 2026-10-09); estado de la consulta interna con `useState` |
| Estrategia standalone/módulo, signals/observables | No aplica; estado local con hooks si hiciera falta |
| Export `@skillvault/ui/packages` | Interno al portal: `src/components/packages/PackageSkillPicker.tsx` (confirmado, decisión humana (human:ianache), 2026-10-09). Librería externa o extracción a otro framework: no decidido por ADR-004 |
| Semver / clasificación de cambio | Solo relevante si se publica como librería; hoy el componente es interno |

- Servidor/cliente: Estado interno y eventos: requiere límite de cliente (`"use client"`). La estrategia de renderizado por ruta no la decide ADR-004.
- Estilos y foco (decisión humana (human:ianache), 2026-10-08): estilos en línea con `var(--…)` (ver `design-token-contract.md`); foco visible con el anillo global de 2px `--accent` de `globals.css`, sin `outline: 0`. Los estilos en línea no admiten media queries ni `:hover`: el responsive se resuelve con grid o flex intrínsecos.
- Verificación: `next build`, pruebas existentes y regresión de componentes compartidos (ADR-004, Impacto en pruebas). Storybook (ADR-005, decisión humana, texto pendiente de revisión): una story por variante y estado de esta spec, con pruebas de interacción y accesibilidad. WCAG 2.2 AA y revisión visual contra el diseño Stitch enlazado.
- Nombres de props/callbacks y ubicación confirmados (decisión humana (human:ianache), 2026-10-09).

## Component contract

> Nota ADR-004: el contrato se escribió originalmente para Angular; ver "Reconciliación con ADR-004" para el mapeo a React.

```ts
export type SkillVersionPolicy = 'latest' | 'pinned';
export interface SkillPickerItem { id: number; slug: string; name: string; version: string; }
export interface SelectedSkill extends SkillPickerItem { policy: SkillVersionPolicy; position: number; }
export type SkillPickerEvent =
  | { type: 'selectionChange'; items: SelectedSkill[] }
  | { type: 'saveDraft' };
```

- Selector: no aplica (React, ADR-004); componente `PackageSkillPicker`
- Inputs: `availableSkills`, `selectedSkills`, `loading`, `disabled`.
- Outputs: `selectionChange` with ordered items and policy.
- Slots: optional result-row and selected-row templates only if needed by Design System.
- Signals/observables: no aplica en React; estado local con hooks si fuera necesario.
- Side effects: none; API orchestration remains in page/service.
- Public export: interno al portal, `src/components/packages/PackageSkillPicker.tsx` (confirmado, decisión humana (human:ianache), 2026-10-09); librería externa no decidida por ADR-004.

## Behavior and visual contract

| Dimension | Specification |
|---|---|
| Variants | empty selection, populated selection, incompatible item warning |
| Loading | available results show loading state |
| Success | add moves item to selected list; duplicate add is prevented |
| Empty | explicit message and search remains usable |
| Error | parent displays load/save error; picker preserves selection |
| Disabled | add, policy, reorder and remove disabled |
| Responsive | results and selected list stack within editor column |
| Localization | search placeholder, actions and policy labels externalizable |
| Tokens | ver `design-token-contract.md`; Retirado neutro (decisión humana (human:ianache), 2026-10-08) |

## Visual design

- Tool: Stitch
- Design link (claro): Stitch project `1874775286672335993`, screen "SkillVault Portal — Specimen CMP-ORG-003 PackageSkillPicker (Light)" <https://stitch.withgoogle.com/projects/1874775286672335993?node-id=21ff5a2089e24deb886c2d1506985c82>
- Design link (oscuro): screen "SkillVault Portal — Specimen CMP-ORG-003 PackageSkillPicker (Dark)" <https://stitch.withgoogle.com/projects/1874775286672335993?node-id=ef6203dda288420090f3b991a025bd44>
- Project / screen id: `1874775286672335993` / `21ff5a2089e24deb886c2d1506985c82` (claro), `ef6203dda288420090f3b991a025bd44` (oscuro)
- Design system: SkillVault Portal Light (`assets/9009552743441703194`) y Dark (`assets/12691038429936688410`), derivados de `_ds/skillvault` (decisión humana (human:ianache), 2026-10-08)
- Covered variants, states, breakpoints: empty-selection, populated, loading-results, error-preserves-selection, disabled, latest-pinned-toggle, retired-warning-line
- Known gaps between design and spec: Diseño canónico generado con el design system del portal. Verificado en el HTML descargado: Space Grotesk, acento marrón `#a9772e`, fondos `#f7f5f0` (claro) y `#16140f` (oscuro), sin azul de acento (el azul aparece solo en resaltado de código y en iniciales de avatar de las muestras), badges Borrador/Publicado/Retirado con icono y etiqueta, forma de píldora y borde punteado en Borrador. Los estilos usan hexadecimales y clases Tailwind, no las variables `--*` del portal (ver `design-token-contract.md`). Cobertura según el prompt; aspecto visual no revisado. Sustituye al diseño del sistema azul `652b2f937ad744e38cdb07334bfa1437` (descartar).
- Developer instruction: implement against this design AND this specification; do not infer visuals from the spec alone.

## Accessibility and security

- Search has an accessible label and clear action.
- Add/remove/reorder controls expose the Skill name in their accessible name.
- Order is represented textually by position; not only by visual arrangement.
- Policy selector is keyboard operable and announces current value.
- Skill identity is rendered as escaped data; package API validates IDs and policies.

## Verification

- Unit: add, duplicate prevention, remove, reorder and policy changes.
- Interaction: keyboard search, add, move, remove and select.
- Accessibility: focus order, labels, status announcements and contrast.
- Visual: zero/one/many selected, long names, warning and mobile.
- Contract: ordered output maps to package version input.

## Change and lifecycle

- Change classification: unknown until package version API contract is frozen.
- Semver impact: changing `SelectedSkill` is potentially breaking.
- Open questions: pinned/latest copy, compatibility warning payload, max results and pagination.
- Human review event: not set by agents.

## Traceability

- User Story: `US-001`
- UXR: `UXR-002`, `UXR-004`
- Flow: `FLW-001`
- Screen: `SCR-002`
- Internal links: `ACC-DSP-2026-001`, `CMP-MOL-003`, `CMP-MOL-004`.

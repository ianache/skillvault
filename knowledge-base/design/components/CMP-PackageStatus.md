---
artifact: component-specification
okf: google-okf-v0.2
id: CMP-ATOM-001
title: "Package status"
generated:
  by: web-atomic-component-designer/0.2.0
  at: "2026-10-08T00:00:00-05:00"
verified: true
status: READY_FOR_DEV
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
  screen_id: "b7be4588b6cf4bb7bb978c5061a3dc0b"
  url: "https://stitch.withgoogle.com/projects/1874775286672335993?node-id=b7be4588b6cf4bb7bb978c5061a3dc0b"
  screen_id_dark: "aef5a5f1b84c4b57900c216cca0892cb"
  url_dark: "https://stitch.withgoogle.com/projects/1874775286672335993?node-id=aef5a5f1b84c4b57900c216cca0892cb"
  design_system: "SkillVault Portal Light (assets/9009552743441703194) + Dark (assets/12691038429936688410), derivados de _ds/skillvault"
  covers: [draft, published, retired, retired-warning-line, compact, version-suffix, unknown-status-error, loading, mobile-360]
  status: linked
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
- Owner: `human:ianache` (decisión humana (human:ianache), 2026-10-09).
- Consumers: `PackageCard`, detalle público, revisión.

## Reconciliación con ADR-004

`ADR-004` (Aceptado, 2026-10-08) fija **Next.js sobre React** como tecnología del frontend web y descarta Angular. **Prevalece sobre cualquier mención a Angular, selectores, NPM o `@skillvault/ui` de esta spec**, que quedan como contexto histórico no normativo. Los tipos TypeScript de la sección de contrato siguen vigentes.

| Contrato original (Angular) | Equivalente vigente (React) |
|---|---|
| Selector `sv-package-status` | Componente `PackageStatus` (función componente) |
| Inputs `value`, `version`, `warning`, `compact` | Props `value`, `version?`, `warning?`, `compact?` (mismo tipo TypeScript `PackageStatusInput`) |
| Outputs | Ninguno |
| Estrategia standalone/módulo, signals/observables | No aplica; estado local con hooks si hiciera falta |
| Export `@skillvault/ui/packages` | Interno al portal: `src/components/packages/PackageStatus.tsx` (confirmado, decisión humana (human:ianache), 2026-10-09). Librería externa o extracción a otro framework: no decidido por ADR-004 |
| Semver / clasificación de cambio | Solo relevante si se publica como librería; hoy el componente es interno |

- Estado desconocido (decisión humana (human:ianache), 2026-10-09): `PackageStatus` muestra el estado de error del diseño; no usa fallback al valor crudo. El tipo estricto se aplica en el mapeo desde `PackageSummary.status` (`string`).
- Servidor/cliente: Presentacional puro: sin estado ni eventos; compatible con Server Components. La estrategia de renderizado por ruta no la decide ADR-004.
- Estilos y foco (decisión humana (human:ianache), 2026-10-08): estilos en línea con `var(--…)` (ver `design-token-contract.md`); foco visible con el anillo global de 2px `--accent` de `globals.css`, sin `outline: 0`. Los estilos en línea no admiten media queries ni `:hover`: el responsive se resuelve con grid o flex intrínsecos.
- Verificación: `next build`, pruebas existentes y regresión de componentes compartidos (ADR-004, Impacto en pruebas). Storybook (ADR-005, decisión humana, texto pendiente de revisión): una story por variante y estado de esta spec, con pruebas de interacción y accesibilidad. WCAG 2.2 AA y revisión visual contra el diseño Stitch enlazado.
- Nombres de props/callbacks y ubicación confirmados (decisión humana (human:ianache), 2026-10-09).

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
- Public export: interno al portal, `src/components/packages/PackageStatus.tsx` (confirmado, decisión humana (human:ianache), 2026-10-09); librería externa no decidida por ADR-004.

## Behavior and visual contract

| Dimension | Specification |
|---|---|
| Variants | draft, published, retired, warning |
| Loading | placeholder text only when parent is loading |
| Empty | unknown status is an error, not silent fallback |
| Error | invalid value should be rejected by input type/validator |
| Responsive | inline and wrap-safe |
| Localization | label map injected or supplied by parent |
| Tokens | ver `design-token-contract.md`; Retirado neutro (decisión humana (human:ianache), 2026-10-08) |

## Visual design

- Tool: Stitch
- Design link (claro): Stitch project `1874775286672335993`, screen "SkillVault Portal — Specimen CMP-ATOM-001 PackageStatus (Light)" <https://stitch.withgoogle.com/projects/1874775286672335993?node-id=b7be4588b6cf4bb7bb978c5061a3dc0b>
- Design link (oscuro): screen "SkillVault Portal — Specimen CMP-ATOM-001 PackageStatus (Dark)" <https://stitch.withgoogle.com/projects/1874775286672335993?node-id=aef5a5f1b84c4b57900c216cca0892cb>
- Project / screen id: `1874775286672335993` / `b7be4588b6cf4bb7bb978c5061a3dc0b` (claro), `aef5a5f1b84c4b57900c216cca0892cb` (oscuro)
- Design system: SkillVault Portal Light (`assets/9009552743441703194`) y Dark (`assets/12691038429936688410`), derivados de `_ds/skillvault` (decisión humana (human:ianache), 2026-10-08)
- Covered variants, states, breakpoints: draft, published, retired, retired-warning-line, compact, version-suffix, unknown-status-error, loading, mobile-360
- Known gaps between design and spec: Diseño canónico generado con el design system del portal. Verificado en el HTML descargado: Space Grotesk, acento marrón `#a9772e`, fondos `#f7f5f0` (claro) y `#16140f` (oscuro), sin azul de acento (el azul aparece solo en resaltado de código y en iniciales de avatar de las muestras), badges Borrador/Publicado/Retirado con icono y etiqueta, forma de píldora y borde punteado en Borrador. Los estilos usan hexadecimales y clases Tailwind, no las variables `--*` del portal (ver `design-token-contract.md`). Cobertura según el prompt; aspecto visual revisado por `human:ianache` el 2026-10-09. Sustituye al diseño del sistema azul `2dd84f1ca2ef4ec0b6edeba82e8ff05d` (descartar).
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
- Human review event: aprobación de `human:ianache`, 2026-10-09, resultado "aprobado" (checklist `RVW-2026-001`; declaración del revisor: "todo es conforme").

## Traceability

- User Story: `US-001`, `US-002`
- UXR: `UXR-001`, `UXR-002`
- Screens: `SCR-001`, `SCR-005`
- Internal links: `ACC-DSP-2026-001`, `CMP-ORG-001`.

---
artifact: design-token-contract
okf: google-okf-v0.2
id: DTCOMP-TOK-DSP-2026-001
title: "Design token contract — package components"
generated:
  by: web-atomic-component-designer/0.4.0
  at: "2026-10-08T00:00:00-05:00"
verified: false
status: REQUIRES_REVIEW
sources:
  - /_ds/skillvault/styles.css
  - /_ds/skillvault/readme.md
  - /src/app/globals.css
  - /knowledge-base/design/components/CMP-PackageStatus.md
  - /knowledge-base/design/components/CMP-PackageCard.md
provenance:
  created_by: web-atomic-component-designer/0.4.0
  method: token-mapping-from-canonical-design-system
  confidence: medium
human-reviewed: false
---

# Design token contract — package components

Reemplaza la versión anterior ("no existe catálogo oficial de tokens"), que era incorrecta: el portal tiene un design system versionado en `_ds/skillvault/` y su mapeo de tema en `src/app/globals.css`. Por decisión humana (human:ianache), 2026-10-08, **`_ds/skillvault` es el sistema de diseño canónico** de los componentes `CMP-*`. Se soportan claro y oscuro (`data-theme`, `ThemeToggle`).

## Mapeo semántico → variables del portal

| Token semántico | Uso | Variable del portal | Claro | Oscuro |
|---|---|---|---|---|
| `color.page.background` | fondo de página | `--bg` | `#f7f5f0` | `#16140f` |
| `color.surface.package` | tarjetas y paneles | `--surface` | `#ffffff` | `#221f19` |
| `color.surface.raised` | inputs, código | `--raised` | `#f0ede6` | `#1f1c16` |
| `color.border.default` | bordes | `--border` | `#e6e1d8` | `#34302a` |
| `color.border.strong` | bordes marcados | `--border-subtle` | `#d8d2c5` | `#2b2721` |
| `color.text.primary` | texto | `--text` | `#1a1d21` | `#f2efe9` |
| `color.text.muted` | texto secundario | `--muted` | `#5c6270` | `#a8a196` |
| `color.text.faint` | texto terciario | `--faint` | `#8a8f99` | `#6f6a5d` |
| `color.accent` | acciones, marca | `--accent` | `#a9772e` | `#a9772e` |
| `color.status.published` | estado publicado | `--status-published` (`--sv-teal`) | `#0f9488` | `#0f9488` |
| `color.status.draft` | borrador (neutro, con borde punteado e icono de lápiz) | `--raised` (fondo), `--muted` (texto), `--border-subtle` (borde punteado) | `#f0ede6` / `#5c6270` / `#d8d2c5` | `#1f1c16` / `#a8a196` / `#2b2721` |
| `color.status.retired` | retirado (neutro, con borde sólido e icono de archivo) | `--raised` (fondo), `--muted` (texto), `--border-subtle` (borde) | `#f0ede6` / `#5c6270` / `#d8d2c5` | `#1f1c16` / `#a8a196` / `#2b2721` |
| `color.warning` | aviso de retiro | `--amber` | `#E88B3A` | `#E88B3A` |
| `radius.control` | botones, inputs | `--sv-radius-sm` | `6px` | `6px` |
| `radius.package.card` | tarjetas | `--sv-radius-md` / `--sv-radius-lg` | `8px` / `12px` | igual |
| `radius.pill` | badges de estado | `--sv-radius-pill` | `20px` | `20px` |
| `shadow.card` | elevación | `--sv-shadow-sm` | `0 1px 2px rgba(20,20,20,.04)` | igual |
| `font.ui` | texto de interfaz | `--sv-font-display` | Space Grotesk | Space Grotesk |
| `font.mono` | slugs, versiones, etiquetas | `--sv-font-mono` | JetBrains Mono | JetBrains Mono |

## Sin token en el design system (pendiente)

- `color.focus.package` **resuelto (decisión humana (human:ianache), 2026-10-08):** anillo de 2px con `--accent`. El portal ya lo aplica globalmente en `globals.css` (`:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }`); los componentes lo heredan y **no deben fijar `outline: 0`** ni otro indicador que lo anule. Contraste de `#a9772e` como indicador (mínimo 3:1, WCAG 1.4.11): 3,91:1 sobre tarjeta clara, 3,59:1 sobre página clara, 3,35:1 sobre fondo elevado claro, 4,70:1 sobre página oscura, 4,20:1 sobre tarjeta oscura y 4,34:1 sobre fondo elevado oscuro: cumple en ambos modos.
- `color.status.retired` **resuelto (decisión humana (human:ianache), 2026-10-08):** Retirado es neutro, según los diseños; no se usa `--sv-danger`. Se distingue de Borrador por borde sólido (Borrador, punteado) e icono (`archive` frente a `edit_note`), y el estado nunca depende solo del color. El aviso de retiro es una línea ámbar aparte (`--amber`). El portal actual pinta Retirado en rojo (`PackageCatalogClient.tsx`): se alinea al integrar, fuera de `DCP-2026-001`.
- `space.package.card` y `breakpoint.package.grid`: el DS no define espaciado ni breakpoints.

## Regla

Los componentes referencian las variables del portal, no valores HEX, para obtener ambos modos sin duplicar estilos. Un valor nuevo se añade primero al design system. Enfoque de estilos **resuelto (decisión humana (human:ianache), 2026-10-08):** estilos en línea con `var(--…)`, como indica el readme del design system. Limitación aceptada (decisión humana (human:ianache), 2026-10-08): los estilos en línea no admiten media queries ni `:hover`/`:active`. El responsive debe lograrse con CSS grid o flex intrínsecos (`repeat(auto-fit, minmax(…))`, `flex-wrap`); los breakpoints siguen sin token (ver arriba).

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
| `color.status.draft` | borrador | `--status-draft` | `#6f6a5d` | `#6f6a5d` |
| `color.status.retired` | retirado | **pendiente** (ver abajo) | — | — |
| `color.warning` | aviso de retiro | `--amber` | `#E88B3A` | `#E88B3A` |
| `radius.control` | botones, inputs | `--sv-radius-sm` | `6px` | `6px` |
| `radius.package.card` | tarjetas | `--sv-radius-md` / `--sv-radius-lg` | `8px` / `12px` | igual |
| `radius.pill` | badges de estado | `--sv-radius-pill` | `20px` | `20px` |
| `shadow.card` | elevación | `--sv-shadow-sm` | `0 1px 2px rgba(20,20,20,.04)` | igual |
| `font.ui` | texto de interfaz | `--sv-font-display` | Space Grotesk | Space Grotesk |
| `font.mono` | slugs, versiones, etiquetas | `--sv-font-mono` | JetBrains Mono | JetBrains Mono |

## Sin token en el design system (pendiente)

- `color.focus.package`: el DS no define foco. Propuesta: anillo de 2px con `--accent`.
- `color.status.retired`: la regla de estados del diseño (Retirado neutro, con aviso ámbar aparte) choca con el portal actual, que pinta el retirado en rojo (`--sv-danger`, `#b3392f`). Hay que decidir cuál manda (Q-3 de `DCP-2026-001`).
- `space.package.card` y `breakpoint.package.grid`: el DS no define espaciado ni breakpoints.

## Regla

Los componentes referencian las variables del portal, no valores HEX, para obtener ambos modos sin duplicar estilos. Un valor nuevo se añade primero al design system. El enfoque de estilos (por ejemplo estilos en línea con `var(--…)`, como indica el readme del DS) queda como propuesta hasta la revisión.

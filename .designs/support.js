# Handoff: SkillVault Dashboard (Login screen)

## Overview
Dashboard/login screen for SkillVault, a catalog platform for AI-agent skills. Two-panel layout: sidebar (branding, nav, SSO login, version/status) + main content (KPI summary + Top-5 lists). Includes dark (default) and light theme variants.

## About the Design Files
The files in this bundle (`login.html`, `login-light.html`) are **design references built in HTML** — static prototypes showing the intended look, structure, and interaction states. They are not production code to copy directly. The task is to **recreate this design in the target codebase's React environment**, using React + the app's existing component/state patterns, organized with **Atomic Design** (atoms → molecules → organisms → templates → pages).

## Fidelity
**High-fidelity.** Colors, typography, spacing, and component states below are final — implement pixel-accurately.

## Atomic Design breakdown

### Atoms
- **LogoMark** — 36×36 rounded-square (radius 9px), gold gradient background (`linear-gradient(155deg, var(--accent-gold), #8f7233)` dark / `#7a5f26` light stop), centered hexagon-module SVG icon (dark fill `var(--bg)`/light `var(--text)`, inner accent triangle in `var(--accent-gold)`), `box-shadow: 0 4px 14px rgba(accent-gold, 0.25)`.
- **NavIcon** — 17×17 stroke SVG, `stroke-width:1.8`, color = `var(--accent-gold)` when active, `var(--text-dim)` otherwise.
- **StatusDot** — 9×9 circle, `background: var(--accent-teal)`, `box-shadow: 0 0 0 3px rgba(accent-teal, 0.18)`.
- **Chip/Delta badge** — pill, `font: 11.5px JetBrains Mono`, `color: var(--accent-teal)`, `background: rgba(accent-teal,0.1)`, `padding: 3px 7px`, `border-radius: 5px`.
- **ProgressBar (track+fill)** — track `height:4px`, `background: var(--border)`, `border-radius:2px`; fill same radius, `background:` the list's assigned accent, `width:` percentage of max value in its set.
- **Button (secondary)** — `padding:11px 14px`, `border-radius:8px`, `background: var(--surface-alt)`, `border:1px solid var(--border-strong)`, `font:13.5px/600 Space Grotesk`, hover darkens bg + border by one step (dark: `#1b212b`/`#2c3340`; light: `#e8e3d8`/`#c9c2b3` — **never invert to a dark hover bg in light mode**, keep text/icon color unchanged on hover).

### Molecules
- **NavItem** — flex row, `gap:12px`, `padding:10px 12px`, `border-radius:8px`; active state `background: rgba(accent-gold,0.12)`; contains NavIcon + label (`14px/500 Space Grotesk`).
- **KPI Card** — surface card (`border-radius:12px`, `padding:20px/16px` comfortable/compact), header row (icon badge 32×32 rounded-8 + optional delta Chip), value (`26px/700 JetBrains Mono`), label (`12.5px`, `var(--text-dim)`). Entrance animation: fade+translateY(10→0), staggered 0–0.25s per card.
- **Top-5 Row** — rank index (`12px JetBrains Mono`, `var(--text-faint)`, zero-padded `01`–`05`) + name/value line + ProgressBar beneath, sized relative to the row set's max value.
- **VersionStatusPanel** — small card at sidebar bottom: version string (mono, `var(--text-dim)`) left, "Status" label + StatusDot right.

### Organisms
- **Sidebar** — 264px fixed width, `background: var(--sidebar-bg)`, `border-right:1px solid var(--border)`, content **vertically centered** (`justify-content:center` on the flex column), contains: brand row (LogoMark + wordmark "SkillVault" + tagline), NavItem list, SSO Button, VersionStatusPanel.
- **KPI Grid** — `display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:16px`. Current KPIs: Skills publicados, Instalaciones de skills, Contribuyentes.
- **Top-5 Panel Grid** — `display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:18px`. Four cards: Top 5 Skills · instalaciones (teal bars), Top 5 Skills · stars (gold bars), Top 5 Contribuyentes (indigo bars), Top 5 Categorías (terracota bars).

### Templates
- **DashboardTemplate** — two-column app shell: Sidebar (fixed) + main content area (`flex:1`, `padding:36px 44px 60px`, `max-width:1400px`), main stacks KPI Grid above Top-5 Panel Grid with `40px` gap between sections. No page title/header row — was intentionally removed.

### Pages
- **LoginDashboardPage (dark)** — default theme, `login.html`.
- **LoginDashboardPage (light)** — same template/components, light tokens, `login-light.html`.

## Interactions & Behavior
- SSO button: primary action, would trigger Keycloak OAuth redirect on click (not wired in the HTML mock).
- Nav items: single active state (Dashboard), rest are static links — no routing implemented in the mock.
- Button/NavItem hover states are CSS-only in the mock; implement as React hover/focus styles (or Tailwind `hover:`/`focus-visible:` classes).
- No loading/error states designed yet — KPI/Top-5 data is static sample data in the mock; wire to real data source with a simple loading skeleton per card if needed (not yet designed — ask before inventing one).

## State Management
- Theme (dark/light): should be a single source of truth (context or CSS var swap), not two separate components — pass a `theme` value down and switch the token set (see Design Tokens below) rather than duplicating markup like the two HTML mocks do.
- Density (comfortable/compact): affects `padding`/`gap` only — implement as a simple prop/class toggle if the app needs it (present as a tweak in the mock, not confirmed as a real product requirement).
- No other client state in this screen.

## Design Tokens

### Dark (default)
| Token | Value |
|---|---|
| bg | `#0b0d10` |
| sidebar-bg / surface | `#101317` / `#14181d` |
| surface-alt | `#161b24` |
| border / border-strong | `#1f242b` / `#232830` |
| text / text-dim / text-faint | `#f2f0ea` / `#8b9099` / `#5b616b` |
| accent-gold | `#cfa554` |
| accent-teal | `#4fd1c5` |
| accent-indigo | `#8f94ff` |
| accent-terracota (categorías) | `#e08a6b` |

### Light
| Token | Value |
|---|---|
| bg | `#f7f5f0` |
| sidebar-bg / surface | `#ffffff` |
| surface-alt | `#f0ede6` |
| border / border-strong | `#e6e1d8` / `#d8d2c5` |
| text / text-dim / text-faint | `#1a1d21` / `#5c6270` / `#8a8f99` |
| accent-gold | `#a9772e` |
| accent-teal | `#0f9488` |
| accent-indigo | `#5a5fd6` |
| accent-terracota | `#c46a3f` |

### Typography
- Display/UI: **Space Grotesk**, 500–700, sizes 11.5–28px, `letter-spacing:-0.01em` on headings.
- Data/mono: **JetBrains Mono**, 400–600, sizes 11–26px.

### Spacing/radius
- Base grid 4px. Card padding 20px (16px compact). Card radius 12px. Small control radius 7–9px. Section gap 16–18px, KPI↔Top-5 gap 40px.

Full rationale and conversion rules: see `DESIGN.md` (dark) and `DESIGN-light.md` (light) in this bundle.

## Assets
No external images. All icons are inline SVG (stroke icons, 15–20px, `stroke-width:1.8–2`) — recreate as an SVG icon set or swap for the app's existing icon library if one exists.

## Files
- `login.html` — dark theme HTML reference
- `login-light.html` — light theme HTML reference
- `DESIGN.md` — dark design-doc / token rationale
- `DESIGN-light.md` — light design-doc / token rationale

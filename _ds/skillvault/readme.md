# SkillVault design tokens

Extracted from the SkillVault app screens (App Shell, Cargar Skill, Mis Skills, Gestión de Roles, Publicar Skill) so every page in this project draws from one shared palette instead of ad-hoc hex values.

## Direction
Warm, editorial admin tool. A near-black warm sidebar (`--sv-sidebar-bg`) anchors navigation; content areas sit on a soft cream (`--sv-bg`) with white cards. Brown (`--sv-accent`) is the primary brand action color; teal (`--sv-teal`) marks success/active states. Radii are soft (6–12px, not sharp, not pill-everywhere). Space Grotesk for UI text, JetBrains Mono for identifiers/code/data.

## Usage
Link `styles.css` in every page's `<helmet>` and reference tokens via `var(--sv-*)` in inline styles — this project's Design Components are inline-styled, so there is no component class layer here, only tokens.

```html
<link rel="stylesheet" href="_ds/skillvault/styles.css">
```

## Tokens
- Surfaces: `--sv-bg`, `--sv-bg-soft`, `--sv-surface`, `--sv-subtle`, `--sv-subtle-2`
- Text: `--sv-text`, `--sv-text-muted`, `--sv-text-faint`
- Borders: `--sv-border`, `--sv-border-strong`, `--sv-divider`
- Accent: `--sv-accent`, `--sv-accent-dark`, `--sv-accent-rgb` (for `rgba(var(--sv-accent-rgb), alpha)` tints)
- Secondary accent: `--sv-accent-2` (category/type tags)
- Status: `--sv-teal`, `--sv-teal-rgb`, `--sv-danger`
- Sidebar (dark): `--sv-sidebar-bg`, `--sv-sidebar-border`, `--sv-sidebar-text`, `--sv-sidebar-text-dim`, `--sv-sidebar-active-bg`, `--sv-sidebar-active-text`
- Overlay: `--sv-backdrop-rgb`, `--sv-shadow-sm/md/lg`
- Type: `--sv-font-display`, `--sv-font-mono`
- Radius: `--sv-radius-sm/md/lg/pill`

## Applied to
App Shell, Gestión de Roles, Mis Skills, Skill Card, Cargar Skill, Catálogo de Skills, Publicar Skill, Resumen de Skills — replaces the previous per-page hardcoded hex values and the Modernist binding on Resumen de Skills.

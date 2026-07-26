# Shared PageHeader component — design

## Context

The catalog page (`src/app/page.tsx`) has a distinctive "hero strip": a full-width band directly below the app's top bar, with a light background (`var(--surface)`), a bottom border, and the page's title + description inside it. Every other page in the app instead renders its title/description as a plain `<h1>`/`<p>` nested inside its own padded content column — no shared background band, no shared structure. The user wants the catalog's treatment applied consistently to the rest of the app (except `/signin`, which never renders the app shell at all — `AppShell.tsx` special-cases that route already).

Scope was narrowed through discussion:
- **In scope:** `dashboard`, `users`, `categories`, `proposals`, `review` (list-style management pages), `review/[id]` + `proposals/[id]` (via the `ReviewRequestDetail` component they share), `skills/[slug]`, `skills/[slug]/edit`, and `/publish`'s step-0 loader screen. The catalog page itself (`src/app/page.tsx`) is refactored to use the new shared component too, instead of remaining a one-off duplicate of the pattern it inspired.
- **Out of scope:** `unauthorized`, `not-found`, `error.tsx`, `publish/success` — these are single-block, vertically-and-horizontally-centered state screens (icon + message + button), not "section with a title" pages. Splitting their title into a top strip would leave a disconnected empty gap above the still-centered rest of the message; fixing that would mean restructuring their whole layout, which nobody asked for. `/publish`'s wizard steps 1-4 (`WizardLayout`) are also out of scope — only the literal `/publish` route's initial loader screen was requested.

## The component

New file: `src/components/PageHeader.tsx`.

```tsx
interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}
```

`description` is typed as `React.ReactNode`, not `string` — most pages pass a plain sentence, but a few (the detail pages) need a small metadata row (e.g. `slug · vX`) in that slot instead of prose, and a second prop for that case isn't worth adding.

Visual spec — copied verbatim from the catalog's current hero strip (`src/app/page.tsx`), the only change being genericized to props:
- Wrapper: `borderBottom: "1px solid var(--border)"`, `padding: "16px 24px"`, `background: "var(--surface)"`. No `maxWidth`/`margin: auto` — it is meant to span the full width available next to the sidebar, consistent with the margins fix shipped earlier in this session.
- Layout: `display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap"` — title+description on the left, `actions` (if present) right-aligned, wrapping to a new line on narrow viewports.
- Title: `<h1>` with `fontFamily: "var(--font-geist), sans-serif", fontSize: "18px", fontWeight: 700, color: "var(--text)"`, `marginBottom: "2px"` if a description is present, else `0`.
- Description: rendered only if provided; `fontSize: "13px", color: "var(--muted)", margin: 0`.
- Actions: rendered only if provided, wrapped in `display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", flexShrink: 0`.

## Two placement patterns

**Full-bleed, top-of-page** — for pages where the header *is* the page's section title (the catalog itself, and the 5 management-list pages). `PageHeader` is hoisted out of whatever padded/centered wrapper currently holds the `<h1>`/`<p>`, and placed directly above that wrapper, immediately under the (dead, `AppHeader`) or top bar. This matches the catalog's actual structure and stays consistent with the earlier margins fix (no `maxWidth` fighting the header's full width).

**Nested, in place** — for the three detail/record pages (`skills/[slug]`, `skills/[slug]/edit`, and `ReviewRequestDetail`, used by both `review/[id]` and `proposals/[id]`). These headers describe one record, not a page section, and already sit inside an existing padded/centered content column with its own breadcrumb or back-link above. `PageHeader` replaces the existing header markup **in place** inside that column — same light-background band and typography, just width-constrained to the content column instead of the raw viewport edge. This avoids restructuring three files' outer layout for a component that doesn't actually care where it's mounted.

## File-by-file changes

**Full-bleed pages** (hoist header out of the padded wrapper, drop the dead `<AppHeader />` import/usage while touching that exact code):

- `src/app/page.tsx` — replace the inline hero-strip markup with `<PageHeader title={q ? \`Resultados para "${q}"\` : "Catálogo de Skills"} description="Skills reutilizables para Claude Code y otros harnesses compatibles con el estándar SKILL.md de Anthropic." />`.
- `src/app/dashboard/page.tsx` — replace the `{/* Page header */}` flex div with `<PageHeader title="Mis Skills" description="Gestiona, edita y monitorea tus skills creados y reutilizables en SkillVault." actions={<Link href="/publish" style={{...same style as today...}}>+ Publicar nuevo skill</Link>} />`, placed before `<main>`; the stats row and everything else inside `<main>` is unchanged.
- `src/app/users/page.tsx` — replace the `marginBottom:"28px"` header div with `<PageHeader title="Gestión de roles" description="Los usuarios provienen de Keycloak y ya existen en el sistema. Aquí solo se asignan o revocan sus roles dentro de SkillVault." />`, placed before the content div; drop `<AppHeader />`.
- `src/app/categories/page.tsx` — same treatment: `<PageHeader title="Gestión de categorías" description="Las categorías organizan el catálogo. Solo administradores pueden gestionarlas." />`; drop `<AppHeader />`.
- `src/app/proposals/page.tsx` — replace the `<h1>`/`<p>` pair with `<PageHeader title="Mis propuestas" description="Estado y comentarios de los skills enviados a revision." />`, placed before `<main>` (whose own `maxWidth`/`margin: auto` is untouched — out of scope for this change); drop `<AppHeader />`; `headingStyle`/`descriptionStyle` constants become unused and should be deleted.
- `src/app/review/page.tsx` — same treatment, but only inside the local `PageShell({ title, description, children })` helper: replace its `<h1>`/`<p>` with `<PageHeader title={title} description={description} />`. No change to `ReviewQueuePage` itself or its call site. Drop `<AppHeader />` from `PageShell`; `headingStyle`/`descriptionStyle` become unused and should be deleted.

**`/publish` step-0 loader screen** — add `<PageHeader title="Publicar skill" description="Carga un SKILL.md local o crea uno nuevo desde cero." />` directly above the existing sticky breadcrumb `<header>`, inside the `step === 0` branch of `src/app/publish/page.tsx`. The breadcrumb bar itself is untouched.

**Nested detail pages** (swap existing header markup for `PageHeader`, same position, no outer-layout changes):

- `src/app/skills/[slug]/page.tsx` — the bordered card (`background: var(--surface)`, `border`, `borderTop: 3px solid ${meta.color}`, `borderRadius`) is replaced by `<PageHeader>` in the same spot, inside the `maxWidth: "860px"` wrapper. This drops the category-accent top border and the card's own border/rounded-corner look — the explicit tradeoff discussed and accepted. All existing information is preserved by moving it into `actions` (nothing is deleted):
  ```tsx
  <PageHeader
    title={skill.name}
    description={skill.description}
    actions={
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", color: "var(--muted)", padding: "2px 8px", border: "1px solid var(--border)", borderRadius: "3px" }}>v{skill.version}</span>
        <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", letterSpacing: "0.8px", textTransform: "uppercase", padding: "2px 7px", borderRadius: "3px", border: `1px solid ${meta.color}`, color: meta.color, background: `${meta.color}18` }}>{meta.icon} {meta.label}</span>
        {skill.authorHandle && <span style={{ fontSize: "12px", color: "var(--muted)" }}>{skill.authorHandle}</span>}
        <StatBox label="instalaciones" value={skill.installCount.toLocaleString()} />
        {/* existing publishedAt StatBox, unchanged */}
      </div>
    }
  />
  ```
  The `Card`/grid content below (Invocación, Triggers, Compatibilidad, etc.) is untouched.
- `src/app/skills/[slug]/edit/page.tsx` — the `{/* Header */}` flex div is replaced in place by:
  ```tsx
  <PageHeader
    title="Editar skill"
    description={
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "13px", color: "var(--accent)" }}>{skill.name}</span>
        <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", color: "var(--faint)" }}>v{skill.version}</span>
        <span style={{ fontSize: "11px", color: "var(--faint)" }}>{skill.installCount} installs</span>
      </div>
    }
    actions={<Link href={`/skills/${skill.slug}`} style={{ /* same style as today's "↗ Ver en catálogo" link */ }}>↗ Ver en catálogo</Link>}
  />
  ```
  The breadcrumb nav above it and `SkillEditor`/`VersionHistory` below are untouched. Drop `<AppHeader />`.
- `src/components/review/ReviewRequestDetail.tsx` — the header flex div (currently: back link + `<h1>{request.name}</h1>` + `<p>{request.slug} · v{request.version}</p>` on the left, status badge on the right) is replaced by: the "Volver a solicitudes" back link stays exactly where it is, immediately followed by
  ```tsx
  <PageHeader
    title={request.name}
    description={`${request.slug} · v${request.version}`}
    actions={<span style={{ /* same status-badge style as today */ }}>{request.status.replaceAll("_", " ")}</span>}
  />
  ```
  Everything below (general comment aside, decision panel, tabs, content, timeline) is untouched. Because both `review/[id]/page.tsx` and `proposals/[id]/page.tsx` render this same component, both routes get the new header with this one file change — neither page file itself needs editing.

## Explicit tradeoffs accepted

- `skills/[slug]` loses its category-accent-colored top border and boxed-card look, in exchange for visual consistency with every other page. Confirmed with the user.
- `unauthorized` / `not-found` / `error` / `publish/success` keep their current fully-centered layout — deliberately excluded, not an oversight.
- `/publish` wizard steps 1-4 (`WizardLayout`) are unchanged — only the step-0 loader screen was requested.

## Verification

Purely visual — no logic changes, no new tests warranted (consistent with the margins fix earlier this session; this repo's only automated suite covers unrelated review-workflow business logic). `pnpm dev`, visit every page listed above (`/`, `/dashboard`, `/users`, `/categories`, `/proposals`, `/review`, `/review/[id]` for an existing request, `/proposals/[id]`, `/skills/[slug]` for a published skill, `/skills/[slug]/edit`, `/publish`), and confirm each shows a light-background title band in the right position (full-bleed at the top for the list pages, nested-in-column for the detail pages), with no missing information (all badges/metadata previously shown are still present, just relocated into `actions`/`description`).

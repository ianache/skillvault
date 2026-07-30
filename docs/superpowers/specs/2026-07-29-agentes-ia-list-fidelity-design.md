# Agentes IA (/agents) — full Claude Design fidelity

## Problem

The `/agents` list page does not implement the Claude Design source
(`Agentes IA.dc.html`, project `7fb6161e-1057-4869-b0b0-224b134dfeb3`). The
current page is a static card grid with no filtering, no view toggle, no
click-to-select behavior, and no detail view. The design specifies a
filterable, dual-view (card/table) list with a right-side agent detail
drawer, clickable skill chips that open a skill detail panel, and an "Editar
agente" action.

## Goal

Rebuild `/agents` to match `Agentes IA.dc.html` behaviorally and visually:
status filter, card/table view toggle, agent detail drawer, skill-chip →
skill panel (reusing the existing catalog `DetailPanel`), and an edit-agent
flow that reuses the existing create form in an edit mode.

## Architecture & file structure

New sibling components under `src/app/agents/` (parallel to the pattern
already used in `src/app/agents/create/`):

- **`AgentFilterBar.tsx`** — status filter segmented control
  (Todos/Activos/Borrador/Pausados) + card/table view toggle. Controlled:
  `statusFilter`, `onStatusFilterChange`, `viewMode`, `onViewModeChange`.
- **`AgentCard.tsx`** — one card in the grid view: avatar+status dot, name,
  model·date, description, skill pills (first 2 + "+N"), "Iniciar Chat"
  button. `onClick` selects the agent (opens drawer); the chat button stops
  propagation.
- **`AgentTable.tsx`** — the alternate table view, same underlying data, one
  row per agent, chat icon-button column.
- **`AgentDrawer.tsx`** — the right-side detail panel (620px) shown when an
  agent is selected: name/status/owner/model header, description,
  Responsabilidad, Entregables (checklist), Skills asignados (clickable
  chips), "Editar agente" button.
- **`page.tsx`** (orchestrator) — owns `agents`, `statusFilter`, `viewMode`,
  `selectedAgentId`, the full skill catalog (fetched once), and
  `selectedSkillSlug` (for the skill panel). Computes filtered/decorated
  agents, renders `AgentFilterBar` + (`AgentCard` grid | `AgentTable`) +
  `AgentDrawer` + the catalog's existing `DetailPanel` for the skill panel.

**Skill panel reuse:** clicking a skill chip in `AgentDrawer` looks up the
full `SkillRow` (from the catalog fetched by `page.tsx`) by slug and opens
the **existing** `src/components/DetailPanel.tsx` — the exact same panel
already used on the skills catalog page (`CatalogClient.tsx`). No new
skill-detail UI is built. Since `DetailPanel` (480px) and `AgentDrawer`
(620px) are both fixed to the right edge, the skill panel opens with a
higher `z-index` and layers on top, leaving a 140px sliver of the agent
drawer visible on its left — the agent drawer stays open underneath and
reappears when the skill panel closes.

**Edit mode:** `src/app/agents/create/page.tsx` gains an optional `?id=`
query param. When present: page title becomes "Editar agente", fields
prefill from `getAgents().find(...)`, and submit calls `updateAgent()`
instead of `createAgent()` (redirecting back to `/agents` either way). No
new route, no duplicated form.

## Data & status model

- **Status colors updated per the new design** (a real change from what's
  currently in `page.tsx`): `active` → teal (unchanged), `draft` → muted
  (unchanged), but `paused` → **danger/red** now (previously muted gray).
  New `STATUS_META`:
  ```
  active: { label: "ACTIVO",   color: "var(--green)", bg: "rgba(15,148,136,0.12)" }
  draft:  { label: "BORRADOR", color: "var(--muted)",  bg: "var(--raised)" }
  paused: { label: "PAUSADO",  color: "var(--red)",    bg: "rgba(179,57,47,0.1)" }
  ```
  (`--red` already exists as a theme-aware alias for `--sv-danger` in
  `globals.css`.)
- **Avatar colors**: the design assigns a per-agent tint (teal/amber/accent/
  muted in the mock, keyed by hand-picked example data) — since real agents
  don't have a designer-assigned color, derive a stable tint from a hash of
  `agent.id` over a small fixed palette (teal/accent/muted/one more),
  replacing today's 7-color rainbow gradient generator with something
  closer to the design's calmer, limited palette.
- **The design's `agent.harness` field is actually displaying a model id**
  (`'claude-3-5-sonnet'`, `'gpt-4o'`) in the mock data — a naming quirk in
  the mockup, not a real distinct field. It maps to our real `agent.model`
  field (already exists on `AIAgent`), not `agent.harnesses`.
- **`dateLabel`** ("28 jul") maps to `agent.createdAt`, formatted with
  `toLocaleDateString("es-ES", { day: "numeric", month: "short" })`.
- **Skill resolution**: `page.tsx` fetches `/api/skills` once into
  `SkillRow[]`. A `resolveSkills(agent.skills: string[])` helper maps each
  slug to its `SkillRow` (dropping slugs that no longer exist in the
  catalog, e.g. a deleted skill) for both the card/table preview pills and
  the drawer's full list.
- **`decorate(agent)`** (mirrors the design's own `decorate()`): computes
  `statusMeta`, `skillsResolved`, `skillsPreview` (first 2),
  `hasMoreSkills`/`extraSkillsCount`, `hasSkills`/`hasNoSkills`,
  `hasDeliverables`/`hasNoDeliverables`, `avatarTint`, `dateLabel` — a
  single function shared by `AgentCard`, `AgentTable`, and `AgentDrawer` so
  the three views can't drift out of sync.

## List behaviors (filter, view toggle, card & table views)

- **Status filter**: segmented control with `Todos | Activos | Borrador |
  Pausados`, filtering the in-memory `agents` array client-side (no API
  involved, matches the design's `AGENTS.filter(...)`). Results label above
  it: `"{n} agente(s) encontrado(s)"`, reflecting the filtered count.
- **View toggle**: two icon buttons (grid / table), persisted only in
  component state (resets to card view on reload — the design doesn't
  specify persistence, and localStorage for a view preference is more than
  this needs).
- **Card view** (`AgentCard` grid, `repeat(auto-fill, minmax(300px,1fr))`):
  clicking anywhere on the card except the "Iniciar Chat" button selects
  the agent (`onClick` on a wrapping div, chat button uses
  `stopPropagation`). Selected card gets an accent border
  (`agent.id === selectedId`).
- **Table view** (`AgentTable`): one row per agent — avatar+status dot,
  name; model; status pill; skill pills (max 2 + "+N"); a chat icon-button
  column. Row click selects the agent (opens drawer); the chat icon button
  stops propagation, same pattern as the card.
- **Empty state**: unchanged from today (dashed box + "Crear Primer Agente"
  CTA) when there are zero agents *before* filtering. If a status filter
  yields zero results but agents exist, show a lighter inline message ("No
  hay agentes con este estado.") rather than the full empty-state CTA — the
  design doesn't cover this case explicitly; filling the gap with the
  least-surprising behavior.
- **"+ Nuevo agente" / "Crear Agente" header action**: unchanged, links to
  `/agents/create` (no query param → create mode).

## Agent detail drawer & skill panel

- **Opening**: selecting an agent (card click or table row click) sets
  `selectedAgentId`; the drawer renders when it's non-null, fixed to the
  right edge, 620px (`max-width: 92vw`), sliding in — matches the design's
  markup and sizing exactly.
- **Drawer content**, top to bottom: name (large), status pill + owner pill
  + model pill row, description, "Responsabilidad" section, "Entregables"
  checklist (✓ icon per item) or "Aún no se definieron entregables." empty
  state, "Skills asignados" as clickable chips (accent-colored, matching
  the design's chip style) or "Este agente todavía no tiene skills
  asignados." empty state, then "Editar agente" button at the bottom.
- **Closing**: the × button in the drawer header sets `selectedAgentId`
  back to `null`. Clicking a different card/row while the drawer is open
  just swaps `selectedAgentId` (no need to close first).
- **Skill chip click**: sets `selectedSkillSlug`, which `page.tsx` resolves
  against the already-fetched `SkillRow[]` catalog and passes to
  `<DetailPanel skill={...} onClose={() => setSelectedSkillSlug(null)} />`
  — rendered with a higher `z-index` than the agent drawer so it layers on
  top. If the slug isn't found in the catalog (skill was deleted after
  being assigned), the chip is still shown but is non-interactive (no panel
  opens) rather than erroring.
- **Editar agente button**: `<NextLink
  href={`/agents/create?id=${selected.id}`}>` — routes into the edit-mode
  create form.

## Edit Agent flow (in `create/page.tsx`)

- **Detecting edit mode**: `useSearchParams().get("id")`. If present, look
  up the agent via `getAgents().find(a => a.id === id)` on mount; if not
  found (bad/stale id), redirect to `/agents`.
- **Prefill**: all form state (`name`, `description`, `responsibility`,
  `systemPrompt`, `deliverables`, `owner`, `model`, `harnesses`, `status`,
  `selectedSkills`) initializes from the found agent instead of the current
  hardcoded defaults.
- **Header copy**: title becomes `"Editar agente"`, description becomes
  `"Actualiza la responsabilidad, entregables y skills de este agente."`,
  and the submit button reads `"Guardar cambios"` instead of `"Guardar
  agente"`.
- **Submit**: if in edit mode, call `updateAgent({ ...existingAgent,
  ...formFields })` (preserving `id`/`createdAt`) instead of
  `createAgent(...)`; both paths redirect to `/agents` afterward.
- **Cancel**: still links back to `/agents` unconditionally.
- No changes to `DeliverablesEditor`, `HarnessSelect`, `StatusSegmented`, or
  `SkillAssigner` — they're already fully controlled/prop-driven, so
  prefilling is just a matter of the parent's initial state.

## Testing / verification

- No new automated tests (consistent with the rest of this app — no React
  component test harness). Manual verification in the browser: status
  filter (all 4 states), view toggle round-trip, card click → drawer opens
  with correct data, table row click → same drawer, skill chip click →
  `DetailPanel` opens with correct skill and layers correctly over the
  drawer, "Editar agente" → prefilled form → save → redirects to `/agents`
  with the updated card visible, empty states (zero agents, and zero agents
  matching a filter).
- `store.ts`/`store.test.ts` untouched (no data-model changes this time —
  `owner`, `harnesses`, `deliverables`, `responsibility`, `systemPrompt` all
  already exist from the prior work).

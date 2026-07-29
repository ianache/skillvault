# Crear Agente — 100% fidelity to Claude Design

## Problem

The implemented "Crear Agente" form (`src/app/agents/create/page.tsx`) does not match the
Claude Design source (`Crear Agente.dc.html`, project `7fb6161e-1057-4869-b0b0-224b134dfeb3`).
The gap is not purely visual — the design includes fields, a skill-assignment interaction
model, and a status model that don't exist in the current `AIAgent` data model. Full fidelity
requires extending the data model, not just restyling.

## Goal

Rebuild the Crear Agente form to match the design exactly: same fields, same layout, same
skill-assignment interaction (drag-and-drop + click fallback), same status control, same
visual tokens — while integrating with SkillVault's real data (skills catalog, harness list)
instead of the design's hardcoded mock data.

## Data model changes

`src/lib/agents/store.ts` — `AIAgent` gains four fields and `status` becomes a 3-state union:

```ts
export interface AIAgent {
  id: string;
  name: string;
  description: string;
  responsibility: string;      // NEW — "Responsabilidad principal"
  deliverables: string[];      // NEW — "Entregables"
  systemPrompt: string;
  model: string;
  owner: string;               // NEW — "Owner / equipo"
  harnesses: string[];         // NEW — subset of VALID_HARNESSES (src/lib/skill-schema.ts)
  skills: string[];
  status: 'active' | 'draft' | 'paused';  // CHANGED from 'active' | 'inactive'
  createdAt: string;
}
```

- `harnesses` reuses `VALID_HARNESSES` from `src/lib/skill-schema.ts`
  (`claude`, `codex`, `opencode`, `agy`, `cursor`) — single source of truth, matches the
  design's `HARNESS_CHOICES` exactly.
- `status` keys stay English (existing convention); Spanish labels (`Activo`/`Borrador`/`Pausado`)
  are display-only.
- `DEFAULT_AGENTS` seed data is updated with the new fields (non-empty sample values).
- `src/lib/agents/store.test.ts` — its two `status: "active"`/`"inactive"` literals are updated
  to the new union so `pnpm build` typechecks (this file isn't part of `pnpm test`, which only
  runs the review-workflow suite, but it must still compile).

## Component architecture

New files under `src/app/agents/create/`:

- **`page.tsx`** (orchestrator) — owns all form state, `handleSubmit`, `/api/skills` fetch,
  renders the 2-column layout, composes the sub-components below. `Cancelar`/`Guardar Agente`
  move into `PageHeader`'s `actions` prop (mirroring the design's App Shell `page-actions`),
  wired via `form="create-agent-form"` + `type="submit"` so the header buttons submit the form
  without being nested inside it.
- **`DeliverablesEditor.tsx`** — controlled list: chips with remove (×), add-input +
  "+ Añadir" button, Enter-to-add. Props: `items: string[]`, `onChange: (items: string[]) => void`.
- **`HarnessSelect.tsx`** — dropdown-button + checkbox-list multi-select for harnesses; open/close
  state owned internally, value controlled from parent. Props: `value: string[]`, `onChange`,
  `options` (from `VALID_HARNESSES`).
- **`StatusSegmented.tsx`** — 3-button segmented control (Activo/Borrador/Pausado).
  Props: `value`, `onChange`.
- **`SkillAssigner.tsx`** — two-pane catalog/assigned UI: search box, draggable catalog rows
  (filtered by search + already-assigned exclusion), dashed drop-zone with assigned rows, native
  HTML5 drag-and-drop (`onDragStart`/`onDragOver`/`onDrop`) **and** click-to-assign/unassign as a
  non-drag fallback (the design supports both). Presentational only: receives `availableSkills`
  (from the real `/api/skills` catalog, using its `type` field as the category tag) and
  `assignedSlugs`/`onChange` as props — no store or routing dependency.

Only `page.tsx` talks to `createAgent()`; all sub-components are plain, prop-driven, and
independently readable/testable.

## Layout & visual fidelity

- 2-column grid `1.1fr 1fr`, gap `28px` (not today's equal-width `auto-fit` grid). Collapses to
  1 column under `@media (max-width: 900px)` since the design is desktop-only and doesn't
  specify mobile behavior.
- Left column: three stacked cards — **Información básica** (Nombre, Descripción breve as
  textarea, Responsabilidad principal), **Entregables**, **Configuración** (Owner/equipo +
  Modelo LLM base side by side, Harness, Estado). Each card: `var(--sv-surface)` background,
  `var(--sv-border)`, `border-radius: 12px`, `var(--sv-shadow-sm)`, `22px 24px` padding, uppercase
  mono eyebrow label (`11px`, `700`, `var(--sv-text-faint)`, letter-spacing `0.05em`) — new to
  this page.
- Right column: **sticky** (`position: sticky; top: 20px`) — "Asignar skills" eyebrow + helper
  paragraph, catalog-search card, then the dashed assigned-drop-zone.
- Model field switches from flat `<option>`s to `<optgroup>` grouped by provider, with the
  design's exact entries: Anthropic (Opus 4.1 / Sonnet 4.5 / 3.5 Haiku), OpenAI (GPT-5 / GPT-4o /
  o4-mini), Google (Gemini 2.5 Pro / Flash) — replacing the current flat/incorrect list.
- Inputs use `var(--sv-bg-soft)` background (not `var(--sv-surface)`). Identifier fields (Nombre,
  Modelo) use `var(--sv-font-mono)`; free text (Descripción, Responsabilidad, Owner) uses
  `var(--sv-font-display)`.
- Missing design tokens are added to the page's inline fallback values: `--sv-bg-soft`,
  `--sv-text-faint`, `--sv-border-strong`, `--sv-shadow-sm`, `--sv-shadow-md`, `--sv-teal`,
  `--sv-accent-rgb`.

## Ripple effects

Display-only 3-way badge updates, no functional/gating changes:

- `src/app/agents/page.tsx` — card badge: `active` → teal "ACTIVO" (pulse), `draft` → neutral
  "BORRADOR", `paused` → muted "PAUSADO" (no pulse).
- `src/app/agents/chat/[id]/page.tsx` — same 3-way badge (currently at line ~570-575). Chat is
  not gated by status today and this doesn't change — out of scope.

## Edge cases

- Only Nombre and Descripción are required (matches the design's `*` markers); Responsabilidad,
  Owner, Entregables, and Harness are optional.
- No native drag-and-drop support (e.g. touch): covered by the click-to-assign/unassign
  fallback, so no separate touch implementation is needed.
- Skill catalog empty/loading states: keep the existing dashed-box messages ("Cargando…" / "No
  hay skills publicados…"), restyled to fit `SkillAssigner`.
- Duplicate assign (e.g. dragging the same skill twice): `SkillAssigner`'s assign handler is
  idempotent (checks `includes` before adding), matching the design's `assignSkill` logic.

## Testing

- No new automated tests required by repo convention (the only real suite is the review
  workflow, per `pnpm test`). Manual verification in the browser: field-by-field visual match,
  deliverables add/remove, harness multi-select, status segmented control, drag-and-drop
  assign/unassign, click-fallback assign/unassign, catalog search filtering, submit → redirect,
  and the updated 3-state badges on `/agents` and the chat page.
- Update `store.test.ts`'s two status literals so it still compiles/passes under `node --test`.

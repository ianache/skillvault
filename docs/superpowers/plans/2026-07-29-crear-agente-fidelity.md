# Crear Agente Design Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `src/app/agents/create/page.tsx` so it matches the Claude Design source (`Crear Agente.dc.html`) with 100% fidelity — same fields, same layout, same skill-assignment interaction, same status control, same visual tokens — wired to SkillVault's real data instead of the design's mock data.

**Architecture:** Extend the `AIAgent` data model with four new fields and a 3-state status. Extract four small, prop-driven presentational components (`DeliverablesEditor`, `HarnessSelect`, `StatusSegmented`, `SkillAssigner`) under `src/app/agents/create/`, then rewrite `page.tsx` as a thin orchestrator that composes them. Update the two other places that render an agent status badge so the 3-state status displays correctly everywhere.

**Tech Stack:** Next.js 16 (App Router, client components), React 19, TypeScript, inline-style components (existing repo convention — no CSS-in-JS library, no Tailwind classes used on these pages), design tokens from `_ds/skillvault/styles.css` (imported globally via `src/app/globals.css`).

## Global Constraints

- All `--sv-*` design tokens used by the design (`--sv-bg-soft`, `--sv-text-faint`, `--sv-border-strong`, `--sv-shadow-sm`, `--sv-shadow-md`, `--sv-teal`, `--sv-accent-rgb`, etc.) **already exist globally** — defined in `_ds/skillvault/styles.css` and imported by `src/app/globals.css:2`. Do not redefine them; just reference `var(--sv-token-name)` directly (fallback values are optional/unnecessary since the tokens are always defined app-wide).
- Reuse harness IDs from `VALID_HARNESSES` in `src/lib/skill-schema.ts:12` (`["claude", "codex", "opencode", "agy", "cursor"]`). Do **not** import the duplicate of the same name in `src/components/wizard/wizard-types.ts` — that one belongs to the publish wizard's compatibility field, a different feature.
- The skills catalog (`GET /api/skills`) returns objects shaped like `{ slug: string; name: string; type: string; ... }` (see `parseSkill()` in `src/app/api/skills/route.ts:74-95`). `type` is the field to use as the category tag — the real catalog has no `category` field.
- This repo's only automated test suite is the review workflow (`pnpm test` = `tsx --test src/lib/review/*.test.ts`, per `CLAUDE.md`). There is no React component test harness (no Jest/RTL). `src/lib/agents/store.test.ts` is a plain `node:test` file that isn't wired into `pnpm test` but must still typecheck/pass under `tsx --test` directly, since it exercises plain TS logic (no React). New React components in this plan are verified manually in the browser, not via automated component tests — this matches CLAUDE.md's instruction to test UI changes in a running browser rather than claim success from types/tests alone.
- Preserve the design's exact Spanish copy verbatim where specified: page title **"Crear agente"** (not "Crear Agente IA"), page description **"Define la responsabilidad del agente, sus entregables y los skills que le dan capacidad para cumplirlos."**, breadcrumb **"Inicio / Agentes IA / Crear agente"**.
- Status keys stay English (`active`/`draft`/`paused`) in code, matching the existing `active`/`inactive` convention; only display labels are Spanish (`Activo`/`Borrador`/`Pausado`).

---

### Task 1: Extend the `AIAgent` data model

**Files:**
- Modify: `src/lib/agents/store.ts`
- Modify: `src/lib/agents/store.test.ts`

**Interfaces:**
- Produces: `AIAgent` interface with fields `id, name, description, responsibility, deliverables, systemPrompt, model, owner, harnesses, skills, status ('active'|'draft'|'paused'), createdAt`. All later tasks (2-9) rely on this exact shape and the exact status union values.

- [ ] **Step 1: Update the `AIAgent` interface and `DEFAULT_AGENTS` seed data**

In `src/lib/agents/store.ts`, replace the `AIAgent` interface and `DEFAULT_AGENTS` array:

```ts
export interface AIAgent {
  id: string;
  name: string;
  description: string;
  responsibility: string;
  deliverables: string[];
  systemPrompt: string;
  model: string;         // e.g., "claude-3-5-sonnet", "gpt-4o", "llama-3.3"
  owner: string;
  harnesses: string[];   // subset of VALID_HARNESSES, e.g. ["claude", "codex"]
  skills: string[];      // list of assigned skill slugs (e.g., ["terraform-lint", "pr-reviewer"])
  status: 'active' | 'draft' | 'paused';
  createdAt: string;
}
```

```ts
const DEFAULT_AGENTS: AIAgent[] = [
  {
    id: "agent-1",
    name: "Especialista DevOps",
    description: "Analiza infraestructura con terraform-lint",
    responsibility: "Revisar cambios de infraestructura como código y detectar configuraciones riesgosas antes de aplicarlas.",
    deliverables: ["Reporte de lint de Terraform", "Lista de advertencias de seguridad"],
    systemPrompt: "Eres un agente especializado en DevOps e Infraestructura como Código.",
    model: "claude-3-5-sonnet",
    owner: "Equipo DevOps",
    harnesses: ["claude"],
    skills: ["terraform-lint"],
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "agent-2",
    name: "Revisor de Código Senior",
    description: "Revisa Pull Requests de forma inteligente",
    responsibility: "Revisar Pull Requests contra las guías de estilo del equipo y señalar riesgos antes del merge.",
    deliverables: ["Comentarios de revisión", "Veredicto de aprobación"],
    systemPrompt: "Eres un Ingeniero de Software Principal que revisa PRs.",
    model: "claude-3-5-sonnet",
    owner: "Equipo QA",
    harnesses: ["claude", "codex"],
    skills: ["pr-reviewer"],
    status: "active",
    createdAt: new Date().toISOString()
  }
];
```

- [ ] **Step 2: Update the existing store test's status literals**

In `src/lib/agents/store.test.ts`, the `createAgent` call is missing the new required fields (it will now fail to typecheck) and the update-status assertion uses the old `"inactive"` value. Replace the whole test body:

```ts
import test from "node:test";
import assert from "node:assert";
import { getAgents, createAgent, deleteAgent, updateAgent, resetStore } from "./store";

test("AgentStore initializes with default agents and handles CRUD", () => {
  resetStore(); // Helper to clear state
  const agents = getAgents();
  assert.ok(agents.length > 0, "Debe tener agentes por defecto");

  const newAgent = createAgent({
    name: "Test Agent",
    description: "Linter tool test",
    responsibility: "Detectar errores de lint en el repositorio de prueba.",
    deliverables: ["Reporte de lint"],
    systemPrompt: "You are a test linter",
    model: "gpt-4o",
    owner: "Equipo QA",
    harnesses: ["claude"],
    skills: ["terraform-lint"],
    status: "active"
  });

  const activeAgents = getAgents();
  const foundAgent = activeAgents.find(a => a.id === newAgent.id);
  assert.strictEqual(foundAgent?.name, "Test Agent");

  // Test updating the agent
  if (foundAgent) {
    const updated = { ...foundAgent, name: "Updated Test Agent", status: "paused" as const };
    updateAgent(updated);
    const postUpdateAgents = getAgents();
    const updatedAgent = postUpdateAgents.find(a => a.id === newAgent.id);
    assert.strictEqual(updatedAgent?.name, "Updated Test Agent");
    assert.strictEqual(updatedAgent?.status, "paused");
  }

  deleteAgent(newAgent.id);
  const updatedAgents = getAgents();
  assert.strictEqual(updatedAgents.find(a => a.id === newAgent.id), undefined);
});
```

- [ ] **Step 3: Run the test to verify it passes**

Run: `pnpm exec tsx --test src/lib/agents/store.test.ts`
Expected: PASS (1 test, 0 failures)

- [ ] **Step 4: Commit**

```bash
git add src/lib/agents/store.ts src/lib/agents/store.test.ts
git commit -m "feat(agents): extend AIAgent with responsibility, deliverables, owner, harnesses, 3-state status"
```

---

### Task 2: `DeliverablesEditor` component

**Files:**
- Create: `src/app/agents/create/DeliverablesEditor.tsx`

**Interfaces:**
- Consumes: nothing from other tasks (self-contained).
- Produces: `export function DeliverablesEditor(props: { items: string[]; onChange: (items: string[]) => void }): JSX.Element` — later consumed by Task 6 (`page.tsx`).

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState } from "react";

interface DeliverablesEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
}

export function DeliverablesEditor({ items, onChange }: DeliverablesEditorProps) {
  const [draft, setDraft] = useState("");

  function addDeliverable() {
    const text = draft.trim();
    if (!text) return;
    onChange([...items, text]);
    setDraft("");
  }

  function removeDeliverable(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
        {items.map((text, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--sv-bg-soft)",
              border: "1px solid var(--sv-border)",
              borderRadius: "8px",
              padding: "9px 12px",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sv-teal)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span style={{ flex: 1, fontSize: "13.5px", color: "var(--sv-text)" }}>{text}</span>
            <button
              type="button"
              onClick={() => removeDeliverable(idx)}
              aria-label="Eliminar entregable"
              style={{ background: "none", border: "none", padding: "2px", cursor: "pointer", color: "var(--sv-text-faint)" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          type="text"
          placeholder="ej. Reporte de diagnóstico"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addDeliverable();
            }
          }}
          style={{
            flex: 1,
            boxSizing: "border-box",
            padding: "9px 12px",
            border: "1px solid var(--sv-border)",
            borderRadius: "8px",
            fontFamily: "var(--sv-font-display)",
            fontSize: "13px",
            background: "var(--sv-bg-soft)",
            color: "var(--sv-text)",
          }}
        />
        <button
          type="button"
          onClick={addDeliverable}
          style={{
            padding: "0 16px",
            borderRadius: "8px",
            border: "1px solid var(--sv-border-strong)",
            background: "var(--sv-surface)",
            color: "var(--sv-text)",
            fontFamily: "var(--sv-font-display)",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          + Añadir
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing `DeliverablesEditor.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/app/agents/create/DeliverablesEditor.tsx
git commit -m "feat(agents): add DeliverablesEditor component for Crear Agente form"
```

---

### Task 3: `HarnessSelect` component

**Files:**
- Create: `src/app/agents/create/HarnessSelect.tsx`

**Interfaces:**
- Consumes: nothing from other tasks (self-contained; caller passes `VALID_HARNESSES` from `src/lib/skill-schema.ts` as `options`).
- Produces: `export function HarnessSelect(props: { value: string[]; onChange: (value: string[]) => void; options: readonly string[] }): JSX.Element` — consumed by Task 6.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState } from "react";

interface HarnessSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: readonly string[];
}

export function HarnessSelect({ value, onChange, options }: HarnessSelectProps) {
  const [open, setOpen] = useState(false);

  function toggle(h: string) {
    onChange(value.includes(h) ? value.filter((x) => x !== h) : [...value, h]);
  }

  const summary = value.length === 0 ? "Seleccionar harness" : value.join(", ");

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          padding: "9px 12px",
          border: "1px solid var(--sv-border)",
          borderRadius: "8px",
          fontFamily: "var(--sv-font-mono)",
          fontSize: "13px",
          background: "var(--sv-bg-soft)",
          color: "var(--sv-text)",
          cursor: "pointer",
        }}
      >
        <span style={{ textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{summary}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--sv-surface)",
            border: "1px solid var(--sv-border)",
            borderRadius: "8px",
            boxShadow: "var(--sv-shadow-md)",
            padding: "6px",
            zIndex: 20,
          }}
        >
          {options.map((h) => (
            <label
              key={h}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "9px",
                padding: "8px 8px",
                borderRadius: "6px",
                cursor: "pointer",
                fontFamily: "var(--sv-font-mono)",
                fontSize: "13px",
              }}
            >
              <input
                type="checkbox"
                checked={value.includes(h)}
                onChange={() => toggle(h)}
                style={{ width: "15px", height: "15px", accentColor: "var(--sv-accent)", cursor: "pointer" }}
              />
              {h}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing `HarnessSelect.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/app/agents/create/HarnessSelect.tsx
git commit -m "feat(agents): add HarnessSelect multi-select component for Crear Agente form"
```

---

### Task 4: `StatusSegmented` component

**Files:**
- Create: `src/app/agents/create/StatusSegmented.tsx`

**Interfaces:**
- Consumes: `AIAgent` type from `src/lib/agents/store.ts` (Task 1) — specifically the `status: 'active' | 'draft' | 'paused'` field type.
- Produces: `export function StatusSegmented(props: { value: AIAgent['status']; onChange: (value: AIAgent['status']) => void }): JSX.Element` — consumed by Task 6.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { AIAgent } from "@/lib/agents/store";

const STATUS_OPTIONS: { id: AIAgent["status"]; label: string }[] = [
  { id: "active", label: "Activo" },
  { id: "draft", label: "Borrador" },
  { id: "paused", label: "Pausado" },
];

interface StatusSegmentedProps {
  value: AIAgent["status"];
  onChange: (value: AIAgent["status"]) => void;
}

export function StatusSegmented({ value, onChange }: StatusSegmentedProps) {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {STATUS_OPTIONS.map((st) => {
        const active = st.id === value;
        return (
          <button
            key={st.id}
            type="button"
            onClick={() => onChange(st.id)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: `1px solid ${active ? "var(--sv-accent)" : "var(--sv-border-strong)"}`,
              fontFamily: "var(--sv-font-display)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              background: active ? "var(--sv-accent)" : "var(--sv-surface)",
              color: active ? "var(--sv-surface)" : "var(--sv-text-muted)",
            }}
          >
            {st.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing `StatusSegmented.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/app/agents/create/StatusSegmented.tsx
git commit -m "feat(agents): add StatusSegmented 3-way control for Crear Agente form"
```

---

### Task 5: `SkillAssigner` component

**Files:**
- Create: `src/app/agents/create/SkillAssigner.tsx`

**Interfaces:**
- Consumes: nothing from other tasks (self-contained; caller passes the real catalog fetched from `/api/skills`).
- Produces: `export interface CatalogSkill { slug: string; name: string; type: string }` and `export function SkillAssigner(props: { availableSkills: CatalogSkill[]; assignedSlugs: string[]; onChange: (slugs: string[]) => void; loading: boolean }): JSX.Element` — consumed by Task 6.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState } from "react";

export interface CatalogSkill {
  slug: string;
  name: string;
  type: string;
}

interface SkillAssignerProps {
  availableSkills: CatalogSkill[];
  assignedSlugs: string[];
  onChange: (slugs: string[]) => void;
  loading: boolean;
}

export function SkillAssigner({ availableSkills, assignedSlugs, onChange, loading }: SkillAssignerProps) {
  const [search, setSearch] = useState("");
  const [draggingSlug, setDraggingSlug] = useState<string | null>(null);

  function assign(slug: string) {
    if (assignedSlugs.includes(slug)) return;
    onChange([...assignedSlugs, slug]);
  }

  function unassign(slug: string) {
    onChange(assignedSlugs.filter((s) => s !== slug));
  }

  function handleDragStart(slug: string, e: React.DragEvent) {
    setDraggingSlug(slug);
    e.dataTransfer.setData("text/plain", slug);
  }

  function handleZoneDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleAssignedDrop(e: React.DragEvent) {
    e.preventDefault();
    const slug = e.dataTransfer.getData("text/plain") || draggingSlug;
    if (slug) assign(slug);
  }

  function handleCatalogDrop(e: React.DragEvent) {
    e.preventDefault();
    const slug = e.dataTransfer.getData("text/plain") || draggingSlug;
    if (slug) unassign(slug);
  }

  const term = search.trim().toLowerCase();
  const available = availableSkills
    .filter((sk) => !assignedSlugs.includes(sk.slug))
    .filter((sk) => !term || sk.name.toLowerCase().includes(term) || sk.type.toLowerCase().includes(term));

  const assigned = assignedSlugs
    .map((slug) => availableSkills.find((sk) => sk.slug === slug))
    .filter((sk): sk is CatalogSkill => Boolean(sk));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", position: "sticky", top: "20px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--sv-text-faint)", fontFamily: "var(--sv-font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Asignar skills
      </div>
      <p style={{ margin: "-8px 0 4px", fontSize: "12.5px", color: "var(--sv-text-muted)" }}>
        Arrastra un skill del catálogo hacia la lista de asignados, o usa el botón +.
      </p>

      <div style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", borderRadius: "12px", boxShadow: "var(--sv-shadow-sm)", padding: "16px 18px" }}>
        <input
          type="text"
          placeholder="Buscar en el catálogo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "9px 12px",
            border: "1px solid var(--sv-border)",
            borderRadius: "8px",
            fontFamily: "var(--sv-font-display)",
            fontSize: "13px",
            background: "var(--sv-bg-soft)",
            color: "var(--sv-text)",
            marginBottom: "12px",
          }}
        />
        <div
          onDragOver={handleZoneDragOver}
          onDrop={handleCatalogDrop}
          style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "220px", overflowY: "auto" }}
        >
          {loading ? (
            <div style={{ padding: "16px", border: "1px dashed var(--sv-border)", borderRadius: "8px", color: "var(--sv-text-muted)", fontSize: "13px" }}>
              Cargando skills disponibles de la plataforma...
            </div>
          ) : available.length === 0 ? (
            <p style={{ margin: "4px 0", fontSize: "12.5px", color: "var(--sv-text-faint)", textAlign: "center" }}>
              Sin coincidencias.
            </p>
          ) : (
            available.map((sk) => (
              <div
                key={sk.slug}
                draggable
                onDragStart={(e) => handleDragStart(sk.slug, e)}
                onClick={() => assign(sk.slug)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  padding: "9px 12px",
                  border: "1px solid var(--sv-border)",
                  borderRadius: "8px",
                  cursor: "grab",
                  background: "var(--sv-bg-soft)",
                }}
              >
                <div>
                  <div style={{ fontFamily: "var(--sv-font-mono)", fontSize: "12.5px", fontWeight: 600, color: "var(--sv-text)" }}>{sk.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--sv-text-faint)", marginTop: "2px" }}>{sk.type}</div>
                </div>
                <span style={{ fontSize: "15px", color: "var(--sv-accent)", flexShrink: 0 }}>+</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        onDragOver={handleZoneDragOver}
        onDrop={handleAssignedDrop}
        style={{ background: "var(--sv-bg-soft)", border: "2px dashed var(--sv-border-strong)", borderRadius: "12px", padding: "16px 18px", minHeight: "160px" }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--sv-text-faint)", fontFamily: "var(--sv-font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
          Skills asignados ({assigned.length})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {assigned.length === 0 ? (
            <p style={{ margin: "4px 0", fontSize: "12.5px", color: "var(--sv-text-faint)", textAlign: "center" }}>
              Suelta aquí los skills que debe usar este agente.
            </p>
          ) : (
            assigned.map((sk) => (
              <div
                key={sk.slug}
                draggable
                onDragStart={(e) => handleDragStart(sk.slug, e)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  padding: "9px 12px",
                  border: "1px solid rgba(var(--sv-accent-rgb),0.35)",
                  background: "rgba(var(--sv-accent-rgb),0.08)",
                  borderRadius: "8px",
                  cursor: "grab",
                }}
              >
                <div>
                  <div style={{ fontFamily: "var(--sv-font-mono)", fontSize: "12.5px", fontWeight: 600, color: "var(--sv-accent-dark)" }}>{sk.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--sv-text-faint)", marginTop: "2px" }}>{sk.type}</div>
                </div>
                <button
                  type="button"
                  onClick={() => unassign(sk.slug)}
                  aria-label="Quitar skill"
                  style={{ background: "none", border: "none", padding: "2px", cursor: "pointer", color: "var(--sv-accent-dark)", flexShrink: 0 }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing `SkillAssigner.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/app/agents/create/SkillAssigner.tsx
git commit -m "feat(agents): add SkillAssigner drag-and-drop skill picker for Crear Agente form"
```

---

### Task 6: Rewrite `page.tsx` as the orchestrator + breadcrumb label fix

**Files:**
- Modify: `src/app/agents/create/page.tsx` (full rewrite)
- Modify: `src/components/shell/Breadcrumbs.tsx:6-15` (`ROUTE_LABELS`)

**Interfaces:**
- Consumes: `AIAgent`, `createAgent` from `src/lib/agents/store.ts` (Task 1); `DeliverablesEditor` (Task 2); `HarnessSelect` (Task 3); `StatusSegmented` (Task 4); `SkillAssigner`, `CatalogSkill` (Task 5); `VALID_HARNESSES` from `src/lib/skill-schema.ts`; `PageHeader` from `src/components/PageHeader.tsx`.
- Produces: the route `/agents/create` (no other task depends on this file directly).

- [ ] **Step 1: Add breadcrumb labels for the agents routes**

In `src/components/shell/Breadcrumbs.tsx`, add two entries to `ROUTE_LABELS` (so `/agents` and `/agents/create` render as "Agentes IA" and "Crear agente" instead of the raw path segments):

```ts
const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Mis Skills",
  proposals: "Mis propuestas",
  review: "Revisión",
  categories: "Categorías",
  users: "Usuarios y roles",
  publish: "Publicar skill",
  skills: "Skills",
  edit: "Editar",
  agents: "Agentes IA",
  create: "Crear agente",
};
```

- [ ] **Step 2: Rewrite `src/app/agents/create/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createAgent, AIAgent } from "@/lib/agents/store";
import { VALID_HARNESSES } from "@/lib/skill-schema";
import { PageHeader } from "@/components/PageHeader";
import { DeliverablesEditor } from "./DeliverablesEditor";
import { HarnessSelect } from "./HarnessSelect";
import { StatusSegmented } from "./StatusSegmented";
import { SkillAssigner, CatalogSkill } from "./SkillAssigner";
import NextLink from "next/link";

const MODEL_GROUPS = [
  { provider: "Anthropic", models: [
    { id: "claude-opus-4.1", label: "Claude Opus 4.1" },
    { id: "claude-sonnet-4.5", label: "Claude Sonnet 4.5" },
    { id: "claude-3-5-haiku", label: "Claude 3.5 Haiku" },
  ] },
  { provider: "OpenAI", models: [
    { id: "gpt-5", label: "GPT-5" },
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "o4-mini", label: "o4-mini" },
  ] },
  { provider: "Google", models: [
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  ] },
];

export default function CreateAgentPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [responsibility, setResponsibility] = useState("");
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [owner, setOwner] = useState("");
  const [model, setModel] = useState("claude-sonnet-4.5");
  const [harnesses, setHarnesses] = useState<string[]>(["claude"]);
  const [status, setStatus] = useState<AIAgent["status"]>("active");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const [availableSkills, setAvailableSkills] = useState<CatalogSkill[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);

  useEffect(() => {
    setMounted(true);

    fetch("/api/skills")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.skills)) {
          setAvailableSkills(
            data.skills.map((s: { slug: string; name: string; type: string }) => ({
              slug: s.slug,
              name: s.name,
              type: s.type,
            }))
          );
        }
        setLoadingSkills(false);
      })
      .catch((err) => {
        console.error("Error loading skills:", err);
        setLoadingSkills(false);
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !description.trim()) {
      alert("Por favor, completa el nombre y la descripción del agente.");
      return;
    }

    createAgent({
      name: name.trim(),
      description: description.trim(),
      responsibility: responsibility.trim(),
      deliverables,
      systemPrompt: systemPrompt.trim(),
      owner: owner.trim(),
      model,
      harnesses,
      skills: selectedSkills,
      status,
    });

    router.push("/agents");
  };

  if (!mounted) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--sv-bg)" }}>
        <PageHeader title="Crear agente" description="Cargando formulario..." />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--sv-bg)", fontFamily: "var(--sv-font-display)" }}>
      <PageHeader
        title="Crear agente"
        description="Define la responsabilidad del agente, sus entregables y los skills que le dan capacidad para cumplirlos."
        actions={
          <>
            <NextLink
              href="/agents"
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid var(--sv-border)",
                background: "var(--sv-surface)",
                color: "var(--sv-text)",
                fontSize: "13.5px",
                fontWeight: 600,
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Cancelar
            </NextLink>
            <button
              type="submit"
              form="create-agent-form"
              style={{
                padding: "10px 22px",
                borderRadius: "8px",
                border: "none",
                background: "var(--sv-accent)",
                color: "#fff",
                fontSize: "13.5px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              Guardar agente
            </button>
          </>
        }
      />

      <form id="create-agent-form" onSubmit={handleSubmit}>
        <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "28px 24px 80px" }}>
          <style>{`
            @media (max-width: 900px) {
              .sv-create-agent-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>

          <div className="sv-create-agent-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "28px", alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>

              {/* Información básica */}
              <div style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", borderRadius: "12px", boxShadow: "var(--sv-shadow-sm)", padding: "22px 24px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--sv-text-faint)", fontFamily: "var(--sv-font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
                  Información básica
                </div>

                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--sv-text-muted)", marginBottom: "6px" }}>Nombre del agente</label>
                <input
                  type="text"
                  required
                  placeholder="ej. qa-story-reviewer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid var(--sv-border)", borderRadius: "8px", fontFamily: "var(--sv-font-mono)", fontSize: "13.5px", background: "var(--sv-bg-soft)", color: "var(--sv-text)", marginBottom: "16px" }}
                />

                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--sv-text-muted)", marginBottom: "6px" }}>Descripción breve</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Qué hace este agente, en una frase."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid var(--sv-border)", borderRadius: "8px", fontFamily: "var(--sv-font-display)", fontSize: "13.5px", background: "var(--sv-bg-soft)", color: "var(--sv-text)", resize: "vertical", marginBottom: "16px" }}
                />

                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--sv-text-muted)", marginBottom: "6px" }}>Responsabilidad principal</label>
                <textarea
                  rows={3}
                  placeholder="Qué debe cumplir este agente para considerarse exitoso."
                  value={responsibility}
                  onChange={(e) => setResponsibility(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid var(--sv-border)", borderRadius: "8px", fontFamily: "var(--sv-font-display)", fontSize: "13.5px", background: "var(--sv-bg-soft)", color: "var(--sv-text)", resize: "vertical" }}
                />
              </div>

              {/* Entregables */}
              <div style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", borderRadius: "12px", boxShadow: "var(--sv-shadow-sm)", padding: "22px 24px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--sv-text-faint)", fontFamily: "var(--sv-font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
                  Entregables
                </div>
                <DeliverablesEditor items={deliverables} onChange={setDeliverables} />
              </div>

              {/* Configuración */}
              <div style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", borderRadius: "12px", boxShadow: "var(--sv-shadow-sm)", padding: "22px 24px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--sv-text-faint)", fontFamily: "var(--sv-font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
                  Configuración
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--sv-text-muted)", marginBottom: "6px" }}>Owner / equipo</label>
                    <input
                      type="text"
                      placeholder="ej. Equipo QA"
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1px solid var(--sv-border)", borderRadius: "8px", fontFamily: "var(--sv-font-display)", fontSize: "13.5px", background: "var(--sv-bg-soft)", color: "var(--sv-text)" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--sv-text-muted)", marginBottom: "6px" }}>Modelo LLM base</label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1px solid var(--sv-border)", borderRadius: "8px", fontFamily: "var(--sv-font-mono)", fontSize: "13px", background: "var(--sv-bg-soft)", color: "var(--sv-text)", cursor: "pointer" }}
                    >
                      {MODEL_GROUPS.map((grp) => (
                        <optgroup key={grp.provider} label={grp.provider}>
                          {grp.models.map((m) => (
                            <option key={m.id} value={m.id}>{m.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--sv-text-muted)", marginBottom: "6px" }}>Harness</label>
                  <HarnessSelect value={harnesses} onChange={setHarnesses} options={VALID_HARNESSES} />
                </div>

                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--sv-text-muted)", marginBottom: "6px" }}>Estado</label>
                <StatusSegmented value={status} onChange={setStatus} />
              </div>
            </div>

            <SkillAssigner
              availableSkills={availableSkills}
              assignedSlugs={selectedSkills}
              onChange={setSelectedSkills}
              loading={loadingSkills}
            />
          </div>
        </main>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Verify it typechecks**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing `src/app/agents/create/page.tsx` or `Breadcrumbs.tsx`

- [ ] **Step 4: Manual browser verification**

Run: `pnpm dev --port 3010` (in background), then open `http://localhost:3010/agents/create` in a browser and confirm:
- Breadcrumb reads "Inicio / Agentes IA / Crear agente"
- Header shows title "Crear agente" with Cancelar/Guardar agente buttons
- Left column shows 3 cards (Información básica, Entregables, Configuración) with the eyebrow labels
- Right column is sticky, shows the search box, draggable catalog rows, and the dashed drop zone
- Adding/removing a deliverable works; dragging a skill from catalog to the assigned zone works; clicking a catalog row also assigns it; clicking the × on an assigned skill unassigns it; the harness dropdown opens/closes and toggles checkboxes; the 3-way status control switches; submitting redirects to `/agents`

- [ ] **Step 5: Commit**

```bash
git add src/app/agents/create/page.tsx src/components/shell/Breadcrumbs.tsx
git commit -m "feat(agents): rewrite Crear Agente form for 100% Claude Design fidelity"
```

---

### Task 7: Update the 3-state badge on the agents list page

**Files:**
- Modify: `src/app/agents/page.tsx:198-279` (agent card status badge)

**Interfaces:**
- Consumes: `AIAgent.status: 'active' | 'draft' | 'paused'` (Task 1).

- [ ] **Step 1: Replace the binary `isActive` badge logic**

In `src/app/agents/page.tsx`, replace this block:

```tsx
              const initials = getInitials(agent.name);
              const gradient = getGradient(agent.name);
              const isActive = agent.status === "active";
```

with:

```tsx
              const initials = getInitials(agent.name);
              const gradient = getGradient(agent.name);
              const STATUS_META: Record<AIAgent["status"], { label: string; color: string; bg: string; pulse: boolean }> = {
                active: { label: "ACTIVO", color: "var(--sv-teal, #0f9488)", bg: "rgba(15, 148, 136, 0.12)", pulse: true },
                draft: { label: "BORRADOR", color: "var(--sv-text-muted, #5c6270)", bg: "rgba(92, 98, 112, 0.12)", pulse: false },
                paused: { label: "PAUSADO", color: "var(--sv-text-faint, #8a8f99)", bg: "rgba(138, 143, 153, 0.12)", pulse: false },
              };
              const statusMeta = STATUS_META[agent.status];
```

Then replace the badge JSX block:

```tsx
                  {/* Status Badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "3px 9px",
                      borderRadius: "5px",
                      background: isActive ? "rgba(15, 148, 136, 0.12)" : "rgba(138, 143, 153, 0.12)",
                      width: "fit-content",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: isActive ? "var(--sv-teal, #0f9488)" : "var(--sv-text-faint, #8a8f99)",
                        display: "inline-block",
                      }}
                      className={isActive ? "sv-pulse-indicator" : ""}
                    />
                    <span
                      style={{
                        fontFamily: "var(--sv-font-mono), 'JetBrains Mono', monospace",
                        fontSize: "10.5px",
                        letterSpacing: "0.04em",
                        color: isActive ? "var(--sv-teal, #0f9488)" : "var(--sv-text-faint, #8a8f99)",
                        fontWeight: 600,
                      }}
                    >
                      {isActive ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </div>
```

with:

```tsx
                  {/* Status Badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "3px 9px",
                      borderRadius: "5px",
                      background: statusMeta.bg,
                      width: "fit-content",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: statusMeta.color,
                        display: "inline-block",
                      }}
                      className={statusMeta.pulse ? "sv-pulse-indicator" : ""}
                    />
                    <span
                      style={{
                        fontFamily: "var(--sv-font-mono), 'JetBrains Mono', monospace",
                        fontSize: "10.5px",
                        letterSpacing: "0.04em",
                        color: statusMeta.color,
                        fontWeight: 600,
                      }}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
```

Add `AIAgent` to the existing import at the top of the file (it's currently imported already as a type — confirm the import line reads `import { getAgents, AIAgent } from "@/lib/agents/store";`, which it already does).

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing `src/app/agents/page.tsx`

- [ ] **Step 3: Manual browser verification**

With `pnpm dev --port 3010` running, open `http://localhost:3010/agents` and confirm each agent card shows the correct badge text/color for its `status` value (create a test agent with status "draft" and one with "paused" via the form from Task 6 to check all three states).

- [ ] **Step 4: Commit**

```bash
git add src/app/agents/page.tsx
git commit -m "feat(agents): render 3-state status badge on agents list cards"
```

---

### Task 8: Update the 3-state badge on the agent chat page

**Files:**
- Modify: `src/app/agents/chat/[id]/page.tsx:570-575`

**Interfaces:**
- Consumes: `AIAgent.status: 'active' | 'draft' | 'paused'` (Task 1).

- [ ] **Step 1: Replace the binary status label**

In `src/app/agents/chat/[id]/page.tsx`, locate (around line 568-576) the block rendering:

```tsx
                color: agent.status === "active" ? "var(--sv-teal, #0f9488)" : "var(--muted)",
```
and
```tsx
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: agent.status === "active" ? "var(--sv-teal, #0f9488)" : "var(--muted)" }} />
              {agent.status === "active" ? "Activo" : "Inactivo"}
```

Replace with a small lookup consistent with Task 7's labels (Spanish, title case here to match this page's existing "Activo"/"Inactivo" casing convention):

```tsx
                color: agent.status === "active" ? "var(--sv-teal, #0f9488)" : "var(--muted)",
```
stays as-is for the `active` case (booleans collapse fine since we only need three distinct outputs); replace the two-line span with:

```tsx
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: agent.status === "active" ? "var(--sv-teal, #0f9488)" : "var(--muted)" }} />
              {agent.status === "active" ? "Activo" : agent.status === "draft" ? "Borrador" : "Pausado"}
```

(No change needed to the `color:` line above it — it already only distinguishes "active" from "not active", which still holds for the other two states.)

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing `src/app/agents/chat/[id]/page.tsx`

- [ ] **Step 3: Manual browser verification**

With `pnpm dev --port 3010` running, open the chat page for an agent with `status: "draft"` and one with `status: "paused"` (created via Task 6's form) and confirm the header badge reads "Borrador" / "Pausado" respectively, and "Activo" for an active one.

- [ ] **Step 4: Commit**

```bash
git add "src/app/agents/chat/[id]/page.tsx"
git commit -m "feat(agents): render 3-state status label on agent chat header"
```

---

### Task 9: Full build verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full production build**

Run: `pnpm build`
Expected: build succeeds with no type errors

- [ ] **Step 2: Run the existing automated test suite**

Run: `pnpm test`
Expected: PASS (review workflow suite, unaffected by this change)

- [ ] **Step 3: Run the agents store test directly**

Run: `pnpm exec tsx --test src/lib/agents/store.test.ts`
Expected: PASS

- [ ] **Step 4: Run lint**

Run: `pnpm lint`
Expected: no errors in touched files

- [ ] **Step 5: Final manual pass**

With `pnpm dev --port 3010` running, walk through creating an agent end-to-end once more (all fields filled, at least 2 deliverables, 2 harnesses, 2 skills assigned via drag, 1 skill assigned via click), submit, and confirm it appears correctly on `/agents` and its chat page opens without errors.

No commit for this task — it's verification only. If any step fails, fix the root cause in the relevant earlier task's files and re-run this task's steps.

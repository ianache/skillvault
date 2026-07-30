# Agentes IA List Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `/agents` to match the Claude Design source (`Agentes IA.dc.html`) with full behavior: status filter, card/table view toggle, a right-side agent detail drawer, skill chips that open the existing skill `DetailPanel`, and an "Editar agente" flow that reuses the create form in edit mode.

**Architecture:** Extract a shared `decorateAgent()` utility (status meta, avatar tint, resolved skills, date label) consumed by three new presentational components (`AgentFilterBar`, `AgentCard`, `AgentTable`) and a new `AgentDrawer`, composed by a rewritten `page.tsx` orchestrator. The existing `create/page.tsx` gains an optional `?id=` query param to become an edit form for an existing agent, reusing 100% of its current fields/components.

**Tech Stack:** Next.js 16 (App Router, client components), React 19, TypeScript, inline-style components (existing repo convention), theme-aware CSS variable aliases from `src/app/globals.css`.

## Global Constraints

- **Use theme-aware aliases, not raw `--sv-*` tokens**, in every new/modified file in this plan: `--bg`, `--surface`, `--raised`, `--border`, `--border-subtle`, `--text`, `--muted`, `--faint`, `--accent`, `--accent-dim`, `--green`, `--red`. Fonts (`--sv-font-mono`, `--sv-font-display`), shadows (`--sv-shadow-sm/md/lg`), and the RGB triplets (`--sv-accent-rgb`, `--sv-teal-rgb`, used only inside `rgba(var(--sv-x-rgb), alpha)`) have no theme-aware alias and stay as direct `--sv-*` references — this mirrors the mapping already applied across the rest of the Agents feature area.
- **Text-on-fixed-background contrast rule:** any text color placed on top of a background that does NOT change between themes (`var(--accent)`, a solid `var(--green)`/`var(--red)` fill) must use a literal `"#fff"`, never `var(--surface)` or another theme-aware alias — aliases invert between light/dark and can go unreadable against a fixed-color background. This bit us once already in `StatusSegmented.tsx` (already fixed there with a literal `"#fff"`); this plan's `AgentFilterBar` active-segment/active-view-toggle styles and `AgentDrawer`'s "Editar agente" button all sit on `var(--accent)` and must use `"#fff"` for their label text, not `var(--surface)`.
- **Skill panel reuses the existing `src/components/DetailPanel.tsx` unmodified**, using the exact same backdrop pattern already established in `src/components/CatalogClient.tsx:225-238`: a `position: fixed; inset: 0; background: rgba(0,0,0,0.4); zIndex: 49` div (click closes the panel) immediately followed by `<DetailPanel skill={...} onClose={...} />` (which has its own internal `zIndex: 50`). No new skill-detail UI is built.
- **`AgentDrawer` must render at a `zIndex` below 49** (this plan uses `45`) so the skill-panel backdrop (49) and `DetailPanel` (50) both layer visually on top of it when a skill chip is clicked, without any special-casing.
- Status keys stay English (`active`/`draft`/`paused`) in code; Spanish only in display labels — existing convention, unchanged.
- Only Spanish user-facing copy — this is a Spanish-language app throughout.

---

### Task 1: Shared agent decoration utility

**Files:**
- Create: `src/app/agents/agent-decoration.ts`

**Interfaces:**
- Consumes: `AIAgent` from `src/lib/agents/store.ts`; `SkillRow` from `src/lib/types.ts`.
- Produces: `export interface DecoratedAgent { ... }` and `export function decorateAgent(agent: AIAgent, skillCatalog: SkillRow[], isSelected: boolean): DecoratedAgent` — consumed by Tasks 3, 4, 5, 6.

- [ ] **Step 1: Create the file**

```ts
import { AIAgent } from "@/lib/agents/store";
import { SkillRow } from "@/lib/types";

export interface StatusMeta {
  label: string;
  color: string;
  bg: string;
  dotColor: string;
  pulse: boolean;
}

export const STATUS_META: Record<AIAgent["status"], StatusMeta> = {
  active: { label: "ACTIVO", color: "var(--green)", bg: "rgba(15,148,136,0.12)", dotColor: "var(--green)", pulse: true },
  draft: { label: "BORRADOR", color: "var(--muted)", bg: "var(--raised)", dotColor: "var(--faint)", pulse: false },
  paused: { label: "PAUSADO", color: "var(--red)", bg: "rgba(179,57,47,0.1)", dotColor: "var(--red)", pulse: false },
};

const AVATAR_PALETTE: { bg: string; fg: string }[] = [
  { bg: "rgba(var(--sv-teal-rgb),0.16)", fg: "var(--green)" },
  { bg: "rgba(var(--sv-accent-rgb),0.14)", fg: "var(--accent-dim)" },
  { bg: "var(--raised)", fg: "var(--muted)" },
  { bg: "rgba(59,110,255,0.14)", fg: "#3B6EFF" },
];

function hashString(s: string): number {
  let sum = 0;
  for (let i = 0; i < s.length; i++) sum += s.charCodeAt(i);
  return sum;
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }).replace(/\.$/, "");
}

export interface DecoratedAgent {
  id: string;
  name: string;
  model: string;
  description: string;
  owner: string;
  responsibility: string;
  deliverables: string[];
  dateLabel: string;
  initials: string;
  avatarBg: string;
  avatarFg: string;
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  statusDotColor: string;
  statusPulse: boolean;
  skillsResolved: SkillRow[];
  skillsPreview: SkillRow[];
  hasSkills: boolean;
  hasNoSkills: boolean;
  hasMoreSkills: boolean;
  extraSkillsCount: number;
  hasDeliverables: boolean;
  hasNoDeliverables: boolean;
  isSelected: boolean;
}

export function decorateAgent(agent: AIAgent, skillCatalog: SkillRow[], isSelected: boolean): DecoratedAgent {
  const meta = STATUS_META[agent.status] ?? STATUS_META.paused;
  const tint = AVATAR_PALETTE[hashString(agent.id) % AVATAR_PALETTE.length];
  const skillsResolved = agent.skills
    .map((slug) => skillCatalog.find((sk) => sk.slug === slug))
    .filter((sk): sk is SkillRow => Boolean(sk));

  return {
    id: agent.id,
    name: agent.name,
    model: agent.model,
    description: agent.description,
    owner: agent.owner,
    responsibility: agent.responsibility,
    deliverables: agent.deliverables,
    dateLabel: formatDateLabel(agent.createdAt),
    initials: getInitials(agent.name),
    avatarBg: tint.bg,
    avatarFg: tint.fg,
    statusLabel: meta.label,
    statusColor: meta.color,
    statusBg: meta.bg,
    statusDotColor: meta.dotColor,
    statusPulse: meta.pulse,
    skillsResolved,
    skillsPreview: skillsResolved.slice(0, 2),
    hasSkills: skillsResolved.length > 0,
    hasNoSkills: skillsResolved.length === 0,
    hasMoreSkills: skillsResolved.length > 2,
    extraSkillsCount: Math.max(0, skillsResolved.length - 2),
    hasDeliverables: agent.deliverables.length > 0,
    hasNoDeliverables: agent.deliverables.length === 0,
    isSelected,
  };
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing `agent-decoration.ts`

- [ ] **Step 3: Commit**

```bash
git add src/app/agents/agent-decoration.ts
git commit -m "feat(agents): add shared agent decoration utility for Agentes IA list"
```

---

### Task 2: `AgentFilterBar` component

**Files:**
- Create: `src/app/agents/AgentFilterBar.tsx`

**Interfaces:**
- Consumes: `AIAgent` type (for the status filter value type) from `src/lib/agents/store.ts`.
- Produces: `export type StatusFilter = AIAgent["status"] | "all"` and `export function AgentFilterBar(props: { resultsLabel: string; statusFilter: StatusFilter; onStatusFilterChange: (f: StatusFilter) => void; viewMode: "card" | "table"; onViewModeChange: (m: "card" | "table") => void }): JSX.Element` — consumed by Task 6.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { AIAgent } from "@/lib/agents/store";

export type StatusFilter = AIAgent["status"] | "all";

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "active", label: "Activos" },
  { id: "draft", label: "Borrador" },
  { id: "paused", label: "Pausados" },
];

interface AgentFilterBarProps {
  resultsLabel: string;
  statusFilter: StatusFilter;
  onStatusFilterChange: (f: StatusFilter) => void;
  viewMode: "card" | "table";
  onViewModeChange: (m: "card" | "table") => void;
}

const segBase: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: "6px",
  border: "none",
  fontFamily: "var(--sv-font-display)",
  fontSize: "12.5px",
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

function segStyle(active: boolean): React.CSSProperties {
  return active
    ? { ...segBase, background: "var(--accent)", color: "#fff" }
    : { ...segBase, background: "transparent", color: "var(--muted)" };
}

const viewBtnBase: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "32px",
  height: "28px",
  borderRadius: "6px",
  border: "none",
  cursor: "pointer",
};

function viewBtnStyle(active: boolean): React.CSSProperties {
  return active
    ? { ...viewBtnBase, background: "var(--accent)", color: "#fff" }
    : { ...viewBtnBase, background: "transparent", color: "var(--muted)" };
}

export function AgentFilterBar({ resultsLabel, statusFilter, onStatusFilterChange, viewMode, onViewModeChange }: AgentFilterBarProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{resultsLabel}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "3px" }}>
          {STATUS_FILTERS.map((f) => (
            <button key={f.id} type="button" onClick={() => onStatusFilterChange(f.id)} style={segStyle(f.id === statusFilter)}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "3px", gap: "2px" }}>
          <button type="button" onClick={() => onViewModeChange("card")} aria-label="Vista de tarjetas" title="Vista de tarjetas" style={viewBtnStyle(viewMode === "card")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect>
            </svg>
          </button>
          <button type="button" onClick={() => onViewModeChange("table")} aria-label="Vista de tabla" title="Vista de tabla" style={viewBtnStyle(viewMode === "table")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing `AgentFilterBar.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/app/agents/AgentFilterBar.tsx
git commit -m "feat(agents): add AgentFilterBar status filter and view toggle"
```

---

### Task 3: `AgentCard` component

**Files:**
- Create: `src/app/agents/AgentCard.tsx`

**Interfaces:**
- Consumes: `DecoratedAgent` from `src/app/agents/agent-decoration.ts` (Task 1).
- Produces: `export function AgentCard(props: { agent: DecoratedAgent; onSelect: () => void; onOpenChat: () => void }): JSX.Element` — consumed by Task 6.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { DecoratedAgent } from "./agent-decoration";

interface AgentCardProps {
  agent: DecoratedAgent;
  onSelect: () => void;
  onOpenChat: () => void;
}

export function AgentCard({ agent, onSelect, onOpenChat }: AgentCardProps) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: `1px solid ${agent.isSelected ? "var(--accent)" : "var(--border)"}`,
        borderRadius: "14px",
        boxShadow: "var(--sv-shadow-sm)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div onClick={onSelect} style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: agent.avatarBg, color: agent.avatarFg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--sv-font-display)", fontWeight: 700, fontSize: "15.5px" }}>
              {agent.initials}
            </div>
            <span style={{ position: "absolute", bottom: "-3px", right: "-3px", width: "13px", height: "13px", borderRadius: "50%", background: agent.statusDotColor, border: "2.5px solid var(--surface)" }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "16px", lineHeight: 1.25, color: "var(--text)" }}>{agent.name}</div>
            <div style={{ fontFamily: "var(--sv-font-mono)", fontSize: "12px", color: "var(--muted)", marginTop: "3px" }}>{agent.model} · {agent.dateLabel}</div>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: "13.5px", color: "var(--muted)", lineHeight: 1.5 }}>{agent.description}</p>

        <div>
          <div style={{ fontSize: "10.5px", fontWeight: 700, fontFamily: "var(--sv-font-mono)", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--faint)", marginBottom: "8px" }}>
            Skills asignados
          </div>
          {agent.hasSkills ? (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {agent.skillsPreview.map((sk) => (
                <span key={sk.slug} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: 600, color: "var(--text)", background: "var(--raised)", padding: "5px 11px", borderRadius: "20px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: agent.avatarBg, flexShrink: 0 }} />
                  {sk.name}
                </span>
              ))}
              {agent.hasMoreSkills && (
                <span style={{ display: "inline-flex", alignItems: "center", fontSize: "12.5px", color: "var(--faint)", padding: "5px 4px" }}>+{agent.extraSkillsCount}</span>
              )}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: "12.5px", color: "var(--faint)" }}>Sin skills asignados.</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onOpenChat(); }}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "11px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontFamily: "var(--sv-font-display)", fontWeight: 700, fontSize: "13.5px", cursor: "pointer" }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
        Iniciar Chat
      </button>
    </div>
  );
}
```

Note: `onOpenChat` is a plain callback (not a `NextLink`) deliberately — Task 6 passes a callback that calls `router.push`, keeping this component free of routing concerns.

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing `AgentCard.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/app/agents/AgentCard.tsx
git commit -m "feat(agents): add AgentCard component for Agentes IA card view"
```

---

### Task 4: `AgentTable` component

**Files:**
- Create: `src/app/agents/AgentTable.tsx`

**Interfaces:**
- Consumes: `DecoratedAgent` from `src/app/agents/agent-decoration.ts` (Task 1).
- Produces: `export function AgentTable(props: { agents: DecoratedAgent[]; onSelect: (id: string) => void; onOpenChat: (id: string) => void }): JSX.Element` — consumed by Task 6.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { DecoratedAgent } from "./agent-decoration";

interface AgentTableProps {
  agents: DecoratedAgent[];
  onSelect: (id: string) => void;
  onOpenChat: (id: string) => void;
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 16px",
  fontSize: "11px",
  fontWeight: 700,
  fontFamily: "var(--sv-font-mono)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--faint)",
};

export function AgentTable({ agents, onSelect, onOpenChat }: AgentTableProps) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", boxShadow: "var(--sv-shadow-sm)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "var(--raised)" }}>
            <th style={thStyle}>Agente</th>
            <th style={thStyle}>Modelo</th>
            <th style={thStyle}>Estado</th>
            <th style={thStyle}>Skills asignados</th>
            <th style={{ ...thStyle, textAlign: "right" }}></th>
          </tr>
        </thead>
        <tbody>
          {agents.map((agent) => (
            <tr key={agent.id} onClick={() => onSelect(agent.id)} style={{ borderTop: "1px solid var(--raised)", cursor: "pointer" }}>
              <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: agent.avatarBg, color: agent.avatarFg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--sv-font-display)", fontWeight: 700, fontSize: "12.5px" }}>
                      {agent.initials}
                    </div>
                    <span style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "10px", height: "10px", borderRadius: "50%", background: agent.statusDotColor, border: "2px solid var(--surface)" }} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--text)" }}>{agent.name}</div>
                </div>
              </td>
              <td style={{ padding: "12px 16px", fontFamily: "var(--sv-font-mono)", fontSize: "12.5px", color: "var(--muted)", whiteSpace: "nowrap" }}>{agent.model}</td>
              <td style={{ padding: "12px 16px" }}>
                <span style={{ fontSize: "10.5px", fontWeight: 700, fontFamily: "var(--sv-font-mono)", textTransform: "uppercase", letterSpacing: "0.03em", padding: "3px 9px", borderRadius: "20px", color: agent.statusColor, background: agent.statusBg, whiteSpace: "nowrap" }}>
                  {agent.statusLabel}
                </span>
              </td>
              <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", maxWidth: "320px" }}>
                  {agent.hasSkills ? (
                    <>
                      {agent.skillsPreview.map((sk) => (
                        <span key={sk.slug} style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", background: "var(--raised)", padding: "4px 9px", borderRadius: "20px", whiteSpace: "nowrap" }}>
                          {sk.name}
                        </span>
                      ))}
                      {agent.hasMoreSkills && (
                        <span style={{ fontSize: "12px", color: "var(--faint)", padding: "4px 2px" }}>+{agent.extraSkillsCount}</span>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: "12px", color: "var(--faint)" }}>—</span>
                  )}
                </div>
              </td>
              <td style={{ padding: "12px 16px", textAlign: "right" }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onOpenChat(agent.id); }}
                  aria-label="Chatear con el agente"
                  title="Chatear con el agente"
                  style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--muted)", cursor: "pointer" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing `AgentTable.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/app/agents/AgentTable.tsx
git commit -m "feat(agents): add AgentTable component for Agentes IA table view"
```

---

### Task 5: `AgentDrawer` component

**Files:**
- Create: `src/app/agents/AgentDrawer.tsx`

**Interfaces:**
- Consumes: `DecoratedAgent` from `src/app/agents/agent-decoration.ts` (Task 1); `SkillRow` from `src/lib/types.ts`.
- Produces: `export function AgentDrawer(props: { agent: DecoratedAgent; onClose: () => void; onSkillClick: (skill: SkillRow) => void; editHref: string }): JSX.Element` — consumed by Task 6. Renders `null` is NOT this component's job — Task 6 conditionally renders it only when an agent is selected.

- [ ] **Step 1: Create the component**

```tsx
"use client";

import NextLink from "next/link";
import { DecoratedAgent } from "./agent-decoration";
import { SkillRow } from "@/lib/types";

interface AgentDrawerProps {
  agent: DecoratedAgent;
  onClose: () => void;
  onSkillClick: (skill: SkillRow) => void;
  editHref: string;
}

function SectionHeading({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--faint)", fontFamily: "var(--sv-font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
    </div>
  );
}

export function AgentDrawer({ agent, onClose, onSkillClick, editHref }: AgentDrawerProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        width: "620px",
        maxWidth: "92vw",
        height: "100vh",
        background: "var(--surface)",
        borderLeft: "1px solid var(--border)",
        boxShadow: "var(--sv-shadow-lg)",
        zIndex: 45,
        overflowY: "auto",
        boxSizing: "border-box",
        padding: "28px 32px 48px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
        <div>
          <div style={{ fontFamily: "var(--sv-font-display)", fontWeight: 700, fontSize: "21px", color: "var(--text)" }}>{agent.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "10.5px", fontWeight: 700, fontFamily: "var(--sv-font-mono)", textTransform: "uppercase", letterSpacing: "0.03em", padding: "3px 9px", borderRadius: "20px", color: agent.statusColor, background: agent.statusBg }}>
              {agent.statusLabel}
            </span>
            <span style={{ fontSize: "12.5px", color: "var(--muted)", background: "var(--raised)", padding: "3px 10px", borderRadius: "20px" }}>{agent.owner}</span>
            <span style={{ fontSize: "11px", fontFamily: "var(--sv-font-mono)", color: "var(--muted)", border: "1px solid var(--border-subtle)", padding: "2px 8px", borderRadius: "20px" }}>{agent.model}</span>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar" style={{ background: "none", border: "none", padding: "4px", margin: "-4px", cursor: "pointer", color: "var(--muted)", flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
        </button>
      </div>

      <p style={{ margin: "18px 0 22px", fontSize: "14px", color: "var(--text)", lineHeight: 1.55 }}>{agent.description}</p>

      <div style={{ marginBottom: "22px" }}>
        <SectionHeading label="Responsabilidad" />
        <p style={{ margin: 0, fontSize: "13.5px", color: "var(--text)", lineHeight: 1.55 }}>{agent.responsibility}</p>
      </div>

      <div style={{ marginBottom: "22px" }}>
        <SectionHeading label="Entregables" />
        {agent.hasDeliverables ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {agent.deliverables.map((d, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", color: "var(--text)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
                {d}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--faint)" }}>Aún no se definieron entregables.</p>
        )}
      </div>

      <div style={{ marginBottom: "28px" }}>
        <SectionHeading label="Skills asignados" />
        {agent.hasSkills ? (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {agent.skillsResolved.map((sk) => (
              <button
                key={sk.slug}
                type="button"
                onClick={() => onSkillClick(sk)}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "var(--sv-font-mono)", fontSize: "12.5px", color: "var(--accent-dim)", background: "rgba(var(--sv-accent-rgb),0.08)", border: "1px solid rgba(var(--sv-accent-rgb),0.3)", padding: "5px 11px", borderRadius: "6px", cursor: "pointer" }}
              >
                {sk.name}
              </button>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "13px", color: "var(--faint)" }}>Este agente todavía no tiene skills asignados.</p>
        )}
      </div>

      <NextLink href={editHref} style={{ display: "inline-block", textDecoration: "none", padding: "10px 18px", borderRadius: "8px", background: "var(--accent)", color: "#fff", fontFamily: "var(--sv-font-display)", fontWeight: 700, fontSize: "13.5px" }}>
        Editar agente
      </NextLink>
    </div>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing `AgentDrawer.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/app/agents/AgentDrawer.tsx
git commit -m "feat(agents): add AgentDrawer detail panel component"
```

---

### Task 6: Rewrite `page.tsx` as the orchestrator

**Files:**
- Modify: `src/app/agents/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `getAgents`, `AIAgent` from `src/lib/agents/store.ts`; `decorateAgent`, `DecoratedAgent` from `./agent-decoration` (Task 1); `AgentFilterBar`, `StatusFilter` from `./AgentFilterBar` (Task 2); `AgentCard` from `./AgentCard` (Task 3); `AgentTable` from `./AgentTable` (Task 4); `AgentDrawer` from `./AgentDrawer` (Task 5); `DetailPanel` from `@/components/DetailPanel`; `SkillRow` from `@/lib/types`; `PageHeader` from `@/components/PageHeader`.
- Produces: the route `/agents` (no other task depends on this file directly).

- [ ] **Step 1: Replace the entire file**

```tsx
"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { getAgents, AIAgent } from "@/lib/agents/store";
import { decorateAgent } from "./agent-decoration";
import { AgentFilterBar, StatusFilter } from "./AgentFilterBar";
import { AgentCard } from "./AgentCard";
import { AgentTable } from "./AgentTable";
import { AgentDrawer } from "./AgentDrawer";
import { DetailPanel } from "@/components/DetailPanel";
import { SkillRow } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";

export default function AgentsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [skillCatalog, setSkillCatalog] = useState<SkillRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillRow | null>(null);

  useEffect(() => {
    setMounted(true);
    setAgents(getAgents());

    fetch("/api/skills")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.skills)) {
          setSkillCatalog(data.skills as SkillRow[]);
        }
      })
      .catch((err) => console.error("Error fetching skills:", err));
  }, []);

  if (!mounted) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <PageHeader title="Agentes IA" description="Carga de agentes..." />
        <div style={{ padding: "32px 24px", display: "flex", justifyContent: "center" }}>
          <div style={{ fontSize: "14px", color: "var(--muted)" }}>Cargando panel de agentes...</div>
        </div>
      </div>
    );
  }

  const filtered = agents.filter((a) => statusFilter === "all" || a.status === statusFilter);
  const decorated = filtered.map((a) => decorateAgent(a, skillCatalog, a.id === selectedAgentId));
  const selectedRaw = agents.find((a) => a.id === selectedAgentId) ?? null;
  const selectedDecorated = selectedRaw ? decorateAgent(selectedRaw, skillCatalog, true) : null;
  const resultsLabel = `${decorated.length} agente${decorated.length === 1 ? "" : "s"} encontrados`;

  function openChat(id: string) {
    router.push(`/agents/chat/${id}`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--sv-font-display), sans-serif" }}>
      <style>{`
        @keyframes sv-pulse-teal {
          0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(15, 148, 136, 0.6); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(15, 148, 136, 0); }
          100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(15, 148, 136, 0); }
        }
        .sv-pulse-indicator { animation: sv-pulse-teal 2s infinite; }
      `}</style>

      <PageHeader
        title="Agentes IA"
        description="Gestiona los agentes IA y los skills que les dan capacidad para cumplir su responsabilidad."
        actions={
          <NextLink
            href="/agents/create"
            style={{ fontFamily: "var(--sv-font-display)", fontSize: "13px", fontWeight: 600, padding: "9px 20px", borderRadius: "8px", background: "var(--accent)", color: "#fff", textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Crear Agente
          </NextLink>
        }
      />

      <main style={{ padding: "32px 24px" }}>
        {agents.length === 0 ? (
          <div style={{ background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "12px", padding: "64px 24px", textAlign: "center", maxWidth: "600px", margin: "40px auto 0" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--accent-muted)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--accent)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <path d="M12 2v4" />
                <path d="M12 5H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-5" />
              </svg>
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px", color: "var(--text)" }}>No hay agentes creados</h3>
            <p style={{ fontSize: "13.5px", color: "var(--muted)", margin: "0 0 24px", lineHeight: 1.5 }}>
              Crea tu primer agente inteligente para automatizar tareas complejas usando tus skills publicados.
            </p>
            <NextLink href="/agents/create" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--accent)", color: "#fff", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
              + Crear Primer Agente
            </NextLink>
          </div>
        ) : (
          <>
            <AgentFilterBar
              resultsLabel={resultsLabel}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {decorated.length === 0 ? (
              <p style={{ fontSize: "13.5px", color: "var(--muted)", textAlign: "center", padding: "48px 0" }}>No hay agentes con este estado.</p>
            ) : viewMode === "card" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "18px" }}>
                {decorated.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} onSelect={() => setSelectedAgentId(agent.id)} onOpenChat={() => openChat(agent.id)} />
                ))}
              </div>
            ) : (
              <AgentTable agents={decorated} onSelect={setSelectedAgentId} onOpenChat={openChat} />
            )}
          </>
        )}
      </main>

      {selectedDecorated && (
        <AgentDrawer
          agent={selectedDecorated}
          onClose={() => setSelectedAgentId(null)}
          onSkillClick={setSelectedSkill}
          editHref={`/agents/create?id=${selectedDecorated.id}`}
        />
      )}

      {selectedSkill && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 49 }} onClick={() => setSelectedSkill(null)} />
          <DetailPanel skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing `src/app/agents/page.tsx`

- [ ] **Step 3: Manual browser verification**

Run: `pnpm dev --port 3010` (reuse if already running), open `http://localhost:3010/agents` and confirm:
- Results label + status filter (Todos/Activos/Borrador/Pausados) + card/table toggle render and work
- Card view: clicking a card (not the chat button) opens the right drawer with correct data; clicking "Iniciar Chat" navigates to the chat page instead
- Table view: same behavior via row click / icon button
- Drawer: Responsabilidad, Entregables (or empty state), Skills asignados chips (or empty state) render correctly; clicking a skill chip opens the skill `DetailPanel` layered on top with a dimmed backdrop; closing the skill panel reveals the agent drawer still open underneath
- "Editar agente" link navigates to `/agents/create?id=<id>` (will 404-safe/no-op until Task 7 lands — that's expected at this point in the plan)
- Both light and dark OS color scheme render correctly (no light-locked surfaces)

- [ ] **Step 4: Commit**

```bash
git add src/app/agents/page.tsx
git commit -m "feat(agents): rewrite Agentes IA list for full Claude Design fidelity"
```

---

### Task 7: Edit Agent mode in `create/page.tsx`

**Files:**
- Modify: `src/app/agents/create/page.tsx`

**Interfaces:**
- Consumes: `getAgents`, `updateAgent`, `createAgent`, `AIAgent` from `src/lib/agents/store.ts`; `useSearchParams` from `next/navigation`.
- Produces: the route `/agents/create` now also handles `/agents/create?id=<agentId>` (edit mode). No other task depends on this file.

- [ ] **Step 1: Add the edit-mode detection, prefill, and submit branching**

Replace the full contents of `src/app/agents/create/page.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createAgent, updateAgent, getAgents, AIAgent } from "@/lib/agents/store";
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
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const [mounted, setMounted] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [responsibility, setResponsibility] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [owner, setOwner] = useState("");
  const [model, setModel] = useState("claude-sonnet-4.5");
  const [harnesses, setHarnesses] = useState<string[]>(["claude"]);
  const [status, setStatus] = useState<AIAgent["status"]>("active");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const [availableSkills, setAvailableSkills] = useState<CatalogSkill[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);

  useEffect(() => {
    setMounted(true);

    if (editId) {
      const found = getAgents().find((a) => a.id === editId);
      if (!found) {
        router.push("/agents");
        return;
      }
      setEditingAgent(found);
      setName(found.name);
      setDescription(found.description);
      setResponsibility(found.responsibility);
      setSystemPrompt(found.systemPrompt);
      setDeliverables(found.deliverables);
      setOwner(found.owner);
      setModel(found.model);
      setHarnesses(found.harnesses);
      setStatus(found.status);
      setSelectedSkills(found.skills);
    }

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
  }, [editId, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !description.trim()) {
      alert("Por favor, completa el nombre y la descripción del agente.");
      return;
    }

    const fields = {
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
    };

    if (editingAgent) {
      updateAgent({ ...editingAgent, ...fields });
    } else {
      createAgent(fields);
    }

    router.push("/agents");
  };

  const isEditMode = Boolean(editingAgent);
  const pageTitle = isEditMode ? "Editar agente" : "Crear agente";
  const pageDescription = isEditMode
    ? "Actualiza la responsabilidad, entregables y skills de este agente."
    : "Define la responsabilidad del agente, sus entregables y los skills que le dan capacidad para cumplirlos.";
  const submitLabel = isEditMode ? "Guardar cambios" : "Guardar agente";

  if (!mounted) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <PageHeader title={pageTitle} description="Cargando formulario..." />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--sv-font-display)" }}>
      <PageHeader
        title={pageTitle}
        description={pageDescription}
        actions={
          <>
            <NextLink
              href="/agents"
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
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
                background: "var(--accent)",
                color: "#fff",
                fontSize: "13.5px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              {submitLabel}
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

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", boxShadow: "var(--sv-shadow-sm)", padding: "22px 24px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--faint)", fontFamily: "var(--sv-font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
                  Información básica
                </div>

                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>Nombre del agente</label>
                <input
                  type="text"
                  required
                  placeholder="ej. qa-story-reviewer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "8px", fontFamily: "var(--sv-font-mono)", fontSize: "13.5px", background: "var(--surface)", color: "var(--text)", marginBottom: "16px" }}
                />

                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>Descripción breve</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Qué hace este agente, en una frase."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "8px", fontFamily: "var(--sv-font-display)", fontSize: "13.5px", background: "var(--surface)", color: "var(--text)", resize: "vertical", marginBottom: "16px" }}
                />

                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>Responsabilidad principal</label>
                <textarea
                  rows={3}
                  placeholder="Qué debe cumplir este agente para considerarse exitoso."
                  value={responsibility}
                  onChange={(e) => setResponsibility(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "8px", fontFamily: "var(--sv-font-display)", fontSize: "13.5px", background: "var(--surface)", color: "var(--text)", resize: "vertical", marginBottom: "16px" }}
                />

                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>System prompt</label>
                <textarea
                  rows={6}
                  placeholder="Instrucciones de sistema que definen el comportamiento del agente..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "8px", fontFamily: "var(--sv-font-mono)", fontSize: "12.5px", lineHeight: "1.5", background: "var(--surface)", color: "var(--text)", resize: "vertical" }}
                />
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", boxShadow: "var(--sv-shadow-sm)", padding: "22px 24px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--faint)", fontFamily: "var(--sv-font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
                  Entregables
                </div>
                <DeliverablesEditor items={deliverables} onChange={setDeliverables} />
              </div>

              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", boxShadow: "var(--sv-shadow-sm)", padding: "22px 24px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--faint)", fontFamily: "var(--sv-font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
                  Configuración
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>Owner / equipo</label>
                    <input
                      type="text"
                      placeholder="ej. Equipo QA"
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "8px", fontFamily: "var(--sv-font-display)", fontSize: "13.5px", background: "var(--surface)", color: "var(--text)" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>Modelo LLM base</label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "8px", fontFamily: "var(--sv-font-mono)", fontSize: "13px", background: "var(--surface)", color: "var(--text)", cursor: "pointer" }}
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
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>Harness</label>
                  <HarnessSelect value={harnesses} onChange={setHarnesses} options={VALID_HARNESSES} />
                </div>

                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>Estado</label>
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

The only functional additions versus the previous version: `editId`/`editingAgent` state, the `if (editId) {...}` prefill block inside the existing `useEffect`, `isEditMode`/`pageTitle`/`pageDescription`/`submitLabel` derived values used in the header, and the `if (editingAgent) { updateAgent(...) } else { createAgent(...) }` branch in `handleSubmit`. Every field/JSX block is otherwise unchanged from the current file.

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing `src/app/agents/create/page.tsx`

- [ ] **Step 3: Manual browser verification**

With the dev server running: open `http://localhost:3010/agents`, click a card to open the drawer, click "Editar agente" — confirm the form opens pre-filled with that agent's data, the header reads "Editar agente" / "Guardar cambios", editing a field and submitting redirects to `/agents` and the card reflects the change. Then open `/agents/create` directly (no `id`) and confirm it's still a normal empty create form.

- [ ] **Step 4: Commit**

```bash
git add src/app/agents/create/page.tsx
git commit -m "feat(agents): add edit mode to create/page.tsx via ?id= query param"
```

---

### Task 8: Full build verification

**Files:** none (verification only)

- [ ] **Step 1: Run the production build**

Run: `pnpm build`
Expected: build succeeds with no type errors

- [ ] **Step 2: Run the existing automated test suite**

Run: `pnpm test`
Expected: PASS (unaffected by this change — no data-model changes in this plan)

- [ ] **Step 3: Run lint on touched/new files**

Run: `pnpm exec eslint "src/app/agents/*.tsx" "src/app/agents/create/page.tsx"`
Expected: no new errors beyond the pre-existing `react-hooks/set-state-in-effect` finding already present on this file's `setMounted(true)` pattern (matches the rest of the app; not introduced by this plan)

- [ ] **Step 4: Final manual pass**

With `pnpm dev --port 3010` running, walk through the full flow once more end to end: filter by each status, toggle card/table, select an agent in each view, click a skill chip to confirm the panel layering, edit an agent and save, verify the updated data appears back on `/agents`, and check both light and dark OS color scheme.

No commit for this task — it's verification only. If any step fails, fix the root cause in the relevant earlier task's files and re-run this task's steps.

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

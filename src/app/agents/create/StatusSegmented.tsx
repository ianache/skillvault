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

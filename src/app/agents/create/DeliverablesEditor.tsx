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

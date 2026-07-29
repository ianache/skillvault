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

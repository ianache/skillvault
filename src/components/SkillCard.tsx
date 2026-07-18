"use client";

import { CATEGORY_META, SkillRow } from "@/lib/types";

interface Props {
  skill: SkillRow;
  selected: boolean;
  onClick: () => void;
}

function fmtCount(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return String(n);
}

export function SkillCard({ skill, selected, onClick }: Props) {
  const meta = CATEGORY_META[skill.type] ?? { label: skill.type, color: "#8590A8", icon: "◇" };
  const stripeClass = `stripe-${skill.type}`;

  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      style={{
        background: selected ? "var(--raised)" : "var(--surface)",
        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
        borderRadius: "4px",
        padding: "14px 16px",
        textAlign: "left",
        cursor: "pointer",
        width: "100%",
        transition: "border-color .12s, background .12s",
        display: "block",
      }}
      className={stripeClass}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
      }}
    >
      {/* Name + version */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--text)",
            wordBreak: "break-word",
          }}
        >
          {skill.name}
        </span>
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "10px",
            color: "var(--muted)",
            whiteSpace: "nowrap",
            marginTop: "2px",
            flexShrink: 0,
          }}
        >
          v{skill.version}
        </span>
      </div>

      {/* Category badge */}
      <div style={{ marginBottom: "8px" }}>
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "9px",
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            padding: "2px 6px",
            borderRadius: "3px",
            border: `1px solid ${meta.color}`,
            color: meta.color,
            background: `${meta.color}18`,
          }}
        >
          {meta.icon} {meta.label}
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: "12px",
          color: "var(--muted)",
          lineHeight: 1.5,
          marginBottom: "10px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {skill.description}
      </p>

      {/* Primary trigger */}
      {skill.triggers[0] && (
        <div style={{ marginBottom: "10px" }}>
          <code
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "11px",
              background: "var(--accent-muted)",
              color: "var(--accent)",
              padding: "2px 6px",
              borderRadius: "3px",
            }}
          >
            {skill.triggers[0]}
          </code>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "var(--faint)" }}>
          ↓ {fmtCount(skill.installCount)}
        </span>
        {skill.compatibility.slice(0, 3).map((h) => (
          <span
            key={h}
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "9px",
              padding: "1px 5px",
              borderRadius: "3px",
              border: "1px solid var(--border)",
              color: "var(--muted)",
            }}
          >
            {h}
          </span>
        ))}
        {skill.compatibility.length > 3 && (
          <span style={{ fontSize: "10px", color: "var(--faint)" }}>
            +{skill.compatibility.length - 3}
          </span>
        )}
      </div>
    </button>
  );
}

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
      <div
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: agent.avatarBg, color: agent.avatarFg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--sv-font-display)", fontWeight: 700, fontSize: "15.5px" }}>
              {agent.initials}
            </div>
            <span
              className={agent.statusPulse ? "sv-pulse-indicator" : ""}
              style={{ position: "absolute", bottom: "-3px", right: "-3px", width: "13px", height: "13px", borderRadius: "50%", background: agent.statusDotColor, border: "2.5px solid var(--surface)" }}
            />
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
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: agent.avatarFg, flexShrink: 0 }} />
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

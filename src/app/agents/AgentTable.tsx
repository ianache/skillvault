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
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflowX: "auto", boxShadow: "var(--sv-shadow-sm)" }}>
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
            <tr
              key={agent.id}
              onClick={() => onSelect(agent.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(agent.id);
                }
              }}
              style={{ borderTop: "1px solid var(--raised)", cursor: "pointer" }}
            >
              <td style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: agent.avatarBg, color: agent.avatarFg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--sv-font-display)", fontWeight: 700, fontSize: "12.5px" }}>
                      {agent.initials}
                    </div>
                    <span
                      className={agent.statusPulse ? "sv-pulse-indicator" : ""}
                      style={{ position: "absolute", bottom: "-2px", right: "-2px", width: "10px", height: "10px", borderRadius: "50%", background: agent.statusDotColor, border: "2px solid var(--surface)" }}
                    />
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

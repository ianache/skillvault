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

"use client";

import { useEffect, useState } from "react";

import { getAgents, AIAgent } from "@/lib/agents/store";
import { PageHeader } from "@/components/PageHeader";

// Note: Ensure we import standard "next/link"
import NextLink from "next/link";

export default function AgentsPage() {
  const [mounted, setMounted] = useState(false);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [skillsList, setSkillsList] = useState<Record<string, { name: string; type?: string }>>({});

  useEffect(() => {
    setMounted(true);
    setAgents(getAgents());

    // Fetch skills from API to map slugs to actual friendly names
    fetch("/api/skills")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.skills)) {
          const mapping: Record<string, { name: string; type?: string }> = {};
          data.skills.forEach((s: any) => {
            mapping[s.slug] = { name: s.name, type: s.type };
          });
          setSkillsList(mapping);
        }
      })
      .catch((err) => console.error("Error fetching skills:", err));
  }, []);

  function getInitials(name: string) {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase();
  }

  function getGradient(name: string) {
    const sum = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradients = [
      "linear-gradient(135deg, #0ea5e9, #2563eb)", // Blue
      "linear-gradient(135deg, #10b981, #059669)", // Emerald
      "linear-gradient(135deg, #f59e0b, #d97706)", // Amber
      "linear-gradient(135deg, #ec4899, #db2777)", // Pink
      "linear-gradient(135deg, #8b5cf6, #7c3aed)", // Violet
      "linear-gradient(135deg, #f43f5e, #e11d48)", // Rose
      "linear-gradient(135deg, #14b8a6, #0d9488)", // Teal/Turquoise
    ];
    return gradients[sum % gradients.length];
  }

  if (!mounted) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <PageHeader
          title="Agentes IA"
          description="Carga de agentes..."
        />
        <div style={{ padding: "32px 24px", display: "flex", justifyContent: "center" }}>
          <div style={{ fontSize: "14px", color: "var(--muted)" }}>Cargando panel de agentes...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--sv-font-display), sans-serif" }}>
      <style>{`
        @keyframes sv-pulse-teal {
          0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(15, 148, 136, 0.6); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(15, 148, 136, 0); }
          100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(15, 148, 136, 0); }
        }
        .sv-pulse-indicator {
          animation: sv-pulse-teal 2s infinite;
        }
        .sv-agent-card {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sv-agent-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--sv-shadow-md, 0 12px 32px rgba(20, 20, 20, 0.08)) !important;
          border-color: var(--sv-accent, #a9772e) !important;
        }
        .sv-btn-chat {
          background: var(--sv-surface, #ffffff);
          border: 1px solid var(--sv-border, #e6e1d8);
          color: var(--sv-text, #1a1d21);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sv-btn-chat:hover {
          background: rgba(169, 119, 46, 0.05);
          border-color: var(--sv-accent, #a9772e);
          color: var(--sv-accent, #a9772e);
          box-shadow: 0 4px 12px rgba(169, 119, 46, 0.08);
        }
      `}</style>

      <PageHeader
        title="Agentes IA"
        description="Explora y gestiona los agentes de Inteligencia Artificial asignados a tus flujos de trabajo en SkillVault."
        actions={
          <NextLink
            href="/agents/create"
            style={{
              fontFamily: "var(--sv-font-display), sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              padding: "9px 20px",
              borderRadius: "8px",
              background: "var(--accent)",
              color: "#fff",
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              transition: "transform 0.15s ease, opacity 0.15s ease",
            }}
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
          <div
            style={{
              background: "var(--surface)",
              border: "1px dashed var(--border)",
              borderRadius: "12px",
              padding: "64px 24px",
              textAlign: "center",
              maxWidth: "600px",
              margin: "40px auto 0",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "var(--accent-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                color: "var(--accent)",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <path d="M12 2v4" />
                <path d="M12 5H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-5" />
              </svg>
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>No hay agentes creados</h3>
            <p style={{ fontSize: "13.5px", color: "var(--muted)", margin: "0 0 24px", lineHeight: 1.5 }}>
              Crea tu primer agente inteligente para automatizar tareas complejas usando tus skills publicados.
            </p>
            <NextLink
              href="/agents/create"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                background: "var(--accent)",
                color: "#fff",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              + Crear Primer Agente
            </NextLink>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "24px",
            }}
          >
            {agents.map((agent) => {
              const initials = getInitials(agent.name);
              const gradient = getGradient(agent.name);
              const STATUS_META: Record<AIAgent["status"], { label: string; color: string; bg: string; pulse: boolean }> = {
                active: { label: "ACTIVO", color: "var(--sv-teal, #0f9488)", bg: "rgba(15, 148, 136, 0.12)", pulse: true },
                draft: { label: "BORRADOR", color: "var(--sv-text-muted, #5c6270)", bg: "rgba(92, 98, 112, 0.12)", pulse: false },
                paused: { label: "PAUSADO", color: "var(--sv-text-faint, #8a8f99)", bg: "rgba(138, 143, 153, 0.12)", pulse: false },
              };
              const statusMeta = STATUS_META[agent.status];

              return (
                <div
                  key={agent.id}
                  className="sv-agent-card"
                  style={{
                    background: "var(--sv-surface, #ffffff)",
                    border: "1px solid var(--sv-border, #e6e1d8)",
                    borderRadius: "12px",
                    padding: "20px",
                    boxShadow: "0 1px 2px rgba(20,20,20,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    position: "relative",
                  }}
                >
                  {/* Title & Version/Model Row */}
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" }}>
                    <span
                      style={{
                        fontFamily: "var(--sv-font-mono), 'JetBrains Mono', monospace",
                        fontSize: "14.5px",
                        fontWeight: 600,
                        color: "var(--sv-text, #1a1d21)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {agent.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--sv-font-mono), 'JetBrains Mono', monospace",
                        fontSize: "12px",
                        color: "var(--sv-text-faint, #8a8f99)",
                        flexShrink: 0,
                      }}
                    >
                      {agent.model}
                    </span>
                  </div>

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

                  {/* Description */}
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--sv-text-muted, #5c6270)", lineHeight: "1.5" }}>
                    {agent.description}
                  </p>

                  {/* Code Chip prompt preview */}
                  <span
                    style={{
                      fontFamily: "var(--sv-font-mono), 'JetBrains Mono', monospace",
                      fontSize: "12px",
                      color: "var(--sv-accent, #a9772e)",
                      background: "var(--sv-subtle, #f0ede6)",
                      border: "1px solid var(--sv-border, #e6e1d8)",
                      borderRadius: "5px",
                      padding: "4px 9px",
                      width: "fit-content",
                    }}
                  >
                    @{agent.name.toLowerCase().replace(/\s+/g, "-")}
                  </span>

                  {/* Bottom details row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "2px" }}>
                    <span style={{ fontSize: "12px", color: "var(--sv-text-faint, #8a8f99)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3v12M7 10l5 5 5-5M5 21h14"></path>
                      </svg>
                      {agent.skills.length} skills asignados
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--sv-font-mono), 'JetBrains Mono', monospace",
                        fontSize: "11px",
                        color: "var(--sv-text-muted, #5c6270)",
                        border: "1px solid var(--sv-border, #e6e1d8)",
                        borderRadius: "5px",
                        padding: "3px 9px",
                      }}
                    >
                      AI HARNESS
                    </span>
                  </div>

                  {/* Action Link Button */}
                  <NextLink
                    href={`/agents/chat/${agent.id}`}
                    className="sv-btn-chat"
                    style={{
                      marginTop: "10px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "9px 16px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 600,
                      textDecoration: "none",
                      textAlign: "center",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Iniciar Chat con Agente
                  </NextLink>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

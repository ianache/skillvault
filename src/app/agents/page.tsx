"use client";

import { useEffect, useState } from "react";
import Link from "next/js"; // wait, Next.js uses "next/link", not "next/js" - let's check imports
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
          0% { transform: scale(0.92); box-shadow: 0 0 0 0 rgba(15, 148, 136, 0.6); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(15, 148, 136, 0); }
          100% { transform: scale(0.92); box-shadow: 0 0 0 0 rgba(15, 148, 136, 0); }
        }
        .sv-pulse-indicator {
          animation: sv-pulse-teal 2s infinite;
        }
        .sv-agent-card {
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease;
        }
        .sv-agent-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06) !important;
          border-color: var(--accent) !important;
        }
        .sv-btn-chat {
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          transition: all 0.15s ease;
        }
        .sv-btn-chat:hover {
          background: var(--accent-muted);
          border-color: var(--accent);
          color: var(--accent-dim);
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
            <p style={{ fontSize: "13.5px", color: "var(--muted)", margin: "0 0 24px", lineHeigh: 1.5 }}>
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
              const isActive = agent.status === "active";

              return (
                <div
                  key={agent.id}
                  className="sv-agent-card"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
                  }}
                >
                  {/* Top Row: Avatar & Status */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
                    <div style={{ position: "relative" }}>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "10px",
                          background: gradient,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: "16px",
                          fontFamily: "var(--sv-font-mono), monospace",
                        }}
                      >
                        {initials}
                      </div>
                      {/* Active indicator badge */}
                      {isActive && (
                        <div
                          className="sv-pulse-indicator"
                          style={{
                            position: "absolute",
                            bottom: "-2px",
                            right: "-2px",
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            background: "var(--green, #0f9488)",
                            border: "2px solid var(--surface)",
                          }}
                          title="Agente Activo"
                        />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "var(--text)",
                          margin: "0 0 4px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {agent.name}
                      </h3>
                      <div
                        style={{
                          fontSize: "11px",
                          fontFamily: "var(--sv-font-mono), monospace",
                          color: "var(--muted)",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span>{agent.model}</span>
                        <span>•</span>
                        <span>{new Date(agent.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: "13.5px",
                      color: "var(--muted)",
                      margin: "0 0 16px",
                      lineHeight: "1.5",
                      flex: 1,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {agent.description}
                  </p>

                  {/* Skills Pills */}
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--faint)", marginBottom: "8px", fontFamily: "var(--sv-font-mono), monospace" }}>
                      Skills Asignados
                    </div>
                    {agent.skills.length === 0 ? (
                      <span style={{ fontSize: "12px", color: "var(--faint)", fontStyle: "italic" }}>Ninguno</span>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {agent.skills.map((slug) => {
                          const skill = skillsList[slug] || { name: slug };
                          return (
                            <NextLink
                              key={slug}
                              href={`/?q=${slug}`}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                background: "var(--raised, #f0ede6)",
                                border: "1px solid var(--border)",
                                color: "var(--text)",
                                fontSize: "11.5px",
                                fontWeight: 500,
                                textDecoration: "none",
                                transition: "all 0.15s ease",
                              }}
                              title={`Buscar ${slug} en catálogo`}
                              onClick={(e) => {
                                // Stop propagation so we don't trigger parent link clicks if any
                                e.stopPropagation();
                              }}
                            >
                              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", marginRight: "6px", display: "inline-block" }}></span>
                              {skill.name}
                            </NextLink>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Action Row */}
                  <div style={{ display: "flex", gap: "10px", marginTop: "auto", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                    <NextLink
                      href={`/agents/chat/${agent.id}`}
                      className="sv-btn-chat"
                      style={{
                        flex: 1,
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
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      Iniciar Chat
                    </NextLink>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

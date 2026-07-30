"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { getAgents, AIAgent } from "@/lib/agents/store";
import { decorateAgent } from "./agent-decoration";
import { AgentFilterBar, StatusFilter } from "./AgentFilterBar";
import { AgentCard } from "./AgentCard";
import { AgentTable } from "./AgentTable";
import { AgentDrawer } from "./AgentDrawer";
import { DetailPanel } from "@/components/DetailPanel";
import { SkillRow } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";

export default function AgentsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [skillCatalog, setSkillCatalog] = useState<SkillRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillRow | null>(null);

  useEffect(() => {
    setMounted(true);
    setAgents(getAgents());

    fetch("/api/skills")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.skills)) {
          setSkillCatalog(data.skills as SkillRow[]);
        }
      })
      .catch((err) => console.error("Error fetching skills:", err));
  }, []);

  if (!mounted) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <PageHeader title="Agentes IA" description="Carga de agentes..." />
        <div style={{ padding: "32px 24px", display: "flex", justifyContent: "center" }}>
          <div style={{ fontSize: "14px", color: "var(--muted)" }}>Cargando panel de agentes...</div>
        </div>
      </div>
    );
  }

  const filtered = agents.filter((a) => statusFilter === "all" || a.status === statusFilter);
  const decorated = filtered.map((a) => decorateAgent(a, skillCatalog, a.id === selectedAgentId));
  const selectedRaw = agents.find((a) => a.id === selectedAgentId) ?? null;
  const selectedDecorated = selectedRaw ? decorateAgent(selectedRaw, skillCatalog, true) : null;
  const resultsLabel = `${decorated.length} agente${decorated.length === 1 ? "" : "s"} encontrados`;

  function openChat(id: string) {
    router.push(`/agents/chat/${id}`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--sv-font-display), sans-serif" }}>
      <style>{`
        @keyframes sv-pulse-teal {
          0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(15, 148, 136, 0.6); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(15, 148, 136, 0); }
          100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(15, 148, 136, 0); }
        }
        .sv-pulse-indicator { animation: sv-pulse-teal 2s infinite; }
      `}</style>

      <PageHeader
        title="Agentes IA"
        description="Gestiona los agentes IA y los skills que les dan capacidad para cumplir su responsabilidad."
        actions={
          <NextLink
            href="/agents/create"
            style={{ fontFamily: "var(--sv-font-display)", fontSize: "13px", fontWeight: 600, padding: "9px 20px", borderRadius: "8px", background: "var(--accent)", color: "#fff", textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", display: "inline-flex", alignItems: "center", gap: "6px" }}
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
          <div style={{ background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: "12px", padding: "64px 24px", textAlign: "center", maxWidth: "600px", margin: "40px auto 0" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--accent-muted)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "var(--accent)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="10" rx="2" />
                <path d="M12 2v4" />
                <path d="M12 5H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-5" />
              </svg>
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px", color: "var(--text)" }}>No hay agentes creados</h3>
            <p style={{ fontSize: "13.5px", color: "var(--muted)", margin: "0 0 24px", lineHeight: 1.5 }}>
              Crea tu primer agente inteligente para automatizar tareas complejas usando tus skills publicados.
            </p>
            <NextLink href="/agents/create" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: "var(--accent)", color: "#fff", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
              + Crear Primer Agente
            </NextLink>
          </div>
        ) : (
          <>
            <AgentFilterBar
              resultsLabel={resultsLabel}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {decorated.length === 0 ? (
              <p style={{ fontSize: "13.5px", color: "var(--muted)", textAlign: "center", padding: "48px 0" }}>No hay agentes con este estado.</p>
            ) : viewMode === "card" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "18px" }}>
                {decorated.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} onSelect={() => setSelectedAgentId(agent.id)} onOpenChat={() => openChat(agent.id)} />
                ))}
              </div>
            ) : (
              <AgentTable agents={decorated} onSelect={setSelectedAgentId} onOpenChat={openChat} />
            )}
          </>
        )}
      </main>

      {selectedDecorated && (
        <AgentDrawer
          agent={selectedDecorated}
          onClose={() => setSelectedAgentId(null)}
          onSkillClick={setSelectedSkill}
          editHref={`/agents/create?id=${selectedDecorated.id}`}
        />
      )}

      {selectedSkill && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 49 }} onClick={() => setSelectedSkill(null)} />
          <DetailPanel skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
        </>
      )}
    </div>
  );
}

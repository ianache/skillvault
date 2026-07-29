"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createAgent, AIAgent } from "@/lib/agents/store";
import { VALID_HARNESSES } from "@/lib/skill-schema";
import { PageHeader } from "@/components/PageHeader";
import { DeliverablesEditor } from "./DeliverablesEditor";
import { HarnessSelect } from "./HarnessSelect";
import { StatusSegmented } from "./StatusSegmented";
import { SkillAssigner, CatalogSkill } from "./SkillAssigner";
import NextLink from "next/link";

const MODEL_GROUPS = [
  { provider: "Anthropic", models: [
    { id: "claude-opus-4.1", label: "Claude Opus 4.1" },
    { id: "claude-sonnet-4.5", label: "Claude Sonnet 4.5" },
    { id: "claude-3-5-haiku", label: "Claude 3.5 Haiku" },
  ] },
  { provider: "OpenAI", models: [
    { id: "gpt-5", label: "GPT-5" },
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "o4-mini", label: "o4-mini" },
  ] },
  { provider: "Google", models: [
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  ] },
];

export default function CreateAgentPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [responsibility, setResponsibility] = useState("");
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [owner, setOwner] = useState("");
  const [model, setModel] = useState("claude-sonnet-4.5");
  const [harnesses, setHarnesses] = useState<string[]>(["claude"]);
  const [status, setStatus] = useState<AIAgent["status"]>("active");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const [availableSkills, setAvailableSkills] = useState<CatalogSkill[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);

  useEffect(() => {
    setMounted(true);

    fetch("/api/skills")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.skills)) {
          setAvailableSkills(
            data.skills.map((s: { slug: string; name: string; type: string }) => ({
              slug: s.slug,
              name: s.name,
              type: s.type,
            }))
          );
        }
        setLoadingSkills(false);
      })
      .catch((err) => {
        console.error("Error loading skills:", err);
        setLoadingSkills(false);
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !description.trim()) {
      alert("Por favor, completa el nombre y la descripción del agente.");
      return;
    }

    createAgent({
      name: name.trim(),
      description: description.trim(),
      responsibility: responsibility.trim(),
      deliverables,
      systemPrompt: systemPrompt.trim(),
      owner: owner.trim(),
      model,
      harnesses,
      skills: selectedSkills,
      status,
    });

    router.push("/agents");
  };

  if (!mounted) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--sv-bg)" }}>
        <PageHeader title="Crear agente" description="Cargando formulario..." />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--sv-bg)", fontFamily: "var(--sv-font-display)" }}>
      <PageHeader
        title="Crear agente"
        description="Define la responsabilidad del agente, sus entregables y los skills que le dan capacidad para cumplirlos."
        actions={
          <>
            <NextLink
              href="/agents"
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid var(--sv-border)",
                background: "var(--sv-surface)",
                color: "var(--sv-text)",
                fontSize: "13.5px",
                fontWeight: 600,
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Cancelar
            </NextLink>
            <button
              type="submit"
              form="create-agent-form"
              style={{
                padding: "10px 22px",
                borderRadius: "8px",
                border: "none",
                background: "var(--sv-accent)",
                color: "#fff",
                fontSize: "13.5px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              Guardar agente
            </button>
          </>
        }
      />

      <form id="create-agent-form" onSubmit={handleSubmit}>
        <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "28px 24px 80px" }}>
          <style>{`
            @media (max-width: 900px) {
              .sv-create-agent-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>

          <div className="sv-create-agent-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "28px", alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>

              {/* Información básica */}
              <div style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", borderRadius: "12px", boxShadow: "var(--sv-shadow-sm)", padding: "22px 24px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--sv-text-faint)", fontFamily: "var(--sv-font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
                  Información básica
                </div>

                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--sv-text-muted)", marginBottom: "6px" }}>Nombre del agente</label>
                <input
                  type="text"
                  required
                  placeholder="ej. qa-story-reviewer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid var(--sv-border)", borderRadius: "8px", fontFamily: "var(--sv-font-mono)", fontSize: "13.5px", background: "var(--sv-bg-soft)", color: "var(--sv-text)", marginBottom: "16px" }}
                />

                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--sv-text-muted)", marginBottom: "6px" }}>Descripción breve</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Qué hace este agente, en una frase."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid var(--sv-border)", borderRadius: "8px", fontFamily: "var(--sv-font-display)", fontSize: "13.5px", background: "var(--sv-bg-soft)", color: "var(--sv-text)", resize: "vertical", marginBottom: "16px" }}
                />

                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--sv-text-muted)", marginBottom: "6px" }}>Responsabilidad principal</label>
                <textarea
                  rows={3}
                  placeholder="Qué debe cumplir este agente para considerarse exitoso."
                  value={responsibility}
                  onChange={(e) => setResponsibility(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", border: "1px solid var(--sv-border)", borderRadius: "8px", fontFamily: "var(--sv-font-display)", fontSize: "13.5px", background: "var(--sv-bg-soft)", color: "var(--sv-text)", resize: "vertical" }}
                />
              </div>

              {/* Entregables */}
              <div style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", borderRadius: "12px", boxShadow: "var(--sv-shadow-sm)", padding: "22px 24px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--sv-text-faint)", fontFamily: "var(--sv-font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
                  Entregables
                </div>
                <DeliverablesEditor items={deliverables} onChange={setDeliverables} />
              </div>

              {/* Configuración */}
              <div style={{ background: "var(--sv-surface)", border: "1px solid var(--sv-border)", borderRadius: "12px", boxShadow: "var(--sv-shadow-sm)", padding: "22px 24px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--sv-text-faint)", fontFamily: "var(--sv-font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>
                  Configuración
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--sv-text-muted)", marginBottom: "6px" }}>Owner / equipo</label>
                    <input
                      type="text"
                      placeholder="ej. Equipo QA"
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1px solid var(--sv-border)", borderRadius: "8px", fontFamily: "var(--sv-font-display)", fontSize: "13.5px", background: "var(--sv-bg-soft)", color: "var(--sv-text)" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--sv-text-muted)", marginBottom: "6px" }}>Modelo LLM base</label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1px solid var(--sv-border)", borderRadius: "8px", fontFamily: "var(--sv-font-mono)", fontSize: "13px", background: "var(--sv-bg-soft)", color: "var(--sv-text)", cursor: "pointer" }}
                    >
                      {MODEL_GROUPS.map((grp) => (
                        <optgroup key={grp.provider} label={grp.provider}>
                          {grp.models.map((m) => (
                            <option key={m.id} value={m.id}>{m.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--sv-text-muted)", marginBottom: "6px" }}>Harness</label>
                  <HarnessSelect value={harnesses} onChange={setHarnesses} options={VALID_HARNESSES} />
                </div>

                <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--sv-text-muted)", marginBottom: "6px" }}>Estado</label>
                <StatusSegmented value={status} onChange={setStatus} />
              </div>
            </div>

            <SkillAssigner
              availableSkills={availableSkills}
              assignedSlugs={selectedSkills}
              onChange={setSelectedSkills}
              loading={loadingSkills}
            />
          </div>
        </main>
      </form>
    </div>
  );
}

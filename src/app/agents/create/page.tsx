"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createAgent } from "@/lib/agents/store";
import { PageHeader } from "@/components/PageHeader";
import NextLink from "next/link";

export default function CreateAgentPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Form Fields State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [model, setModel] = useState("claude-3-5-sonnet");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Available skills loaded from API
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(true);

  useEffect(() => {
    setMounted(true);

    // Fetch skills from Catalog API
    fetch("/api/skills")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.skills)) {
          setAvailableSkills(data.skills);
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

    if (!name.trim()) {
      alert("Por favor, introduce un nombre para el agente.");
      return;
    }

    // Call store.ts createAgent
    createAgent({
      name: name.trim(),
      description: description.trim(),
      systemPrompt: systemPrompt.trim(),
      model,
      skills: selectedSkills,
      status: isActive ? "active" : "inactive",
    });

    // Redirect to list
    router.push("/agents");
  };

  const handleToggleSkill = (slug: string) => {
    if (selectedSkills.includes(slug)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== slug));
    } else {
      setSelectedSkills([...selectedSkills, slug]);
    }
  };

  if (!mounted) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <PageHeader
          title="Crear Agente IA"
          description="Cargando formulario..."
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--sv-font-display), sans-serif" }}>
      <style>{`
        .sv-form-container {
          background: var(--surface);
          border: 1px solid var(--border);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          border-radius: 12px;
        }
        .sv-input {
          width: 100%;
          padding: 11px 14px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          border-radius: 8px;
          font-size: 13.5px;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .sv-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-muted);
        }
        .sv-select {
          width: 100%;
          padding: 11px 14px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          border-radius: 8px;
          font-size: 13.5px;
          outline: none;
          cursor: pointer;
          transition: border-color 0.15s ease;
        }
        .sv-select:focus {
          border-color: var(--accent);
        }
        .sv-skill-checkbox {
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
        }
        .sv-skill-checkbox:hover {
          border-color: var(--accent);
          background: var(--bg);
        }
        .sv-skill-checkbox.selected {
          border-color: var(--accent);
          background: var(--accent-muted);
        }
        .sv-toggle {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }
        .sv-toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .sv-slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: var(--border);
          transition: .3s;
          border-radius: 24px;
        }
        .sv-slider:before {
          position: absolute;
          content: "";
          height: 18px; width: 18px;
          left: 3px; bottom: 3px;
          background-color: #fff;
          transition: .3s;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        input:checked + .sv-slider {
          background-color: var(--green, #0f9488);
        }
        input:checked + .sv-slider:before {
          transform: translateX(20px);
        }
      `}</style>

      <PageHeader
        title="Crear Agente IA"
        description="Configura la personalidad, modelo y destrezas de un nuevo asistente inteligente automatizado."
      />

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 16px 80px" }}>
        {/* Breadcrumb back navigation link */}
        <div style={{ marginBottom: "20px" }}>
          <NextLink
            href="/agents"
            style={{
              fontSize: "13px",
              color: "var(--muted)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 500,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Volver a listado
          </NextLink>
        </div>

        <form onSubmit={handleSubmit} className="sv-form-container" style={{ padding: "32px" }}>
          {/* Main layout */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Row: Name and Model */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)", marginBottom: "8px" }}>
                  Nombre del Agente <span style={{ color: "var(--red, #ef4444)" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Revisor de Código Core"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="sv-input"
                  style={{ fontFamily: "var(--sv-font-display), sans-serif" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)", marginBottom: "8px" }}>
                  Modelo Base
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="sv-select"
                  style={{ fontFamily: "var(--sv-font-mono), monospace" }}
                >
                  <option value="claude-3-5-sonnet">claude-3-5-sonnet (Recomendado)</option>
                  <option value="claude-3-opus">claude-3-opus</option>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="llama-3.3">llama-3.3 (Open-Source)</option>
                  <option value="deepseek-r1">deepseek-r1 (Reasoning)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)", marginBottom: "8px" }}>
                Descripción Breve <span style={{ color: "var(--red, #ef4444)" }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="ej. Ayuda a revisar y auditar las dependencias de paquetes npm."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="sv-input"
              />
            </div>

            {/* System Prompt (styled as Terminal/Code Editor) */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)", marginBottom: "8px" }}>
                System Prompt (Personalidad e Instrucciones)
              </label>
              <div style={{ background: "#252526", border: "1px solid var(--border)", borderBottom: "none", borderTopLeftRadius: "8px", borderTopRightRadius: "8px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#eab308" }} />
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", fontFamily: "var(--sv-font-mono), monospace", marginLeft: "8px" }}>system-prompt.txt</span>
              </div>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                style={{
                  width: "100%",
                  minHeight: "180px",
                  fontFamily: "var(--sv-font-mono), monospace",
                  background: "#1e1e1e",
                  color: "#a7e3a9", // light green terminal-like
                  border: "1px solid var(--border)",
                  borderBottomLeftRadius: "8px",
                  borderBottomRightRadius: "8px",
                  padding: "16px",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  outline: "none",
                  resize: "vertical",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.12)",
                }}
                placeholder="# Escribe las instrucciones de comportamiento y sistema para guiar al agente..."
              />
            </div>

            {/* Interactive Skill Selector */}
            <div>
              <div style={{ display: "flex", alignContent: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--muted)" }}>
                  Asignar Destrezas (Skills)
                </label>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                  {selectedSkills.length} seleccionadas
                </span>
              </div>

              {loadingSkills ? (
                <div style={{ padding: "16px", border: "1px dashed var(--border)", borderRadius: "8px", color: "var(--muted)", fontSize: "13px" }}>
                  Cargando skills disponibles de la plataforma...
                </div>
              ) : availableSkills.length === 0 ? (
                <div style={{ padding: "16px", border: "1px dashed var(--border)", borderRadius: "8px", color: "var(--muted)", fontSize: "13px" }}>
                  No hay skills publicados en el catálogo. No te preocupes, puedes registrar un agente sin skills y asignárselos más tarde.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: "10px",
                    maxHeight: "180px",
                    overflowY: "auto",
                    padding: "4px",
                  }}
                >
                  {availableSkills.map((skill) => {
                    const isSel = selectedSkills.includes(skill.slug);
                    return (
                      <div
                        key={skill.slug}
                        onClick={() => handleToggleSkill(skill.slug)}
                        className={`sv-skill-checkbox ${isSel ? "selected" : ""}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "10px 12px",
                          gap: "10px",
                          userSelect: "none",
                        }}
                      >
                        <div
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "4px",
                            border: `1.5px solid ${isSel ? "var(--accent)" : "var(--border)"}`,
                            background: isSel ? "var(--accent)" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            transition: "all 0.1s ease",
                          }}
                        >
                          {isSel && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {skill.name}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--muted)", fontFamily: "var(--sv-font-mono), monospace" }}>
                            {skill.slug}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active / Inactive Switch */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: "20px", marginTop: "10px" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Estado de Activación</div>
                <div style={{ fontSize: "12.5px", color: "var(--muted)", marginTop: "2px" }}>
                  Determina si el agente responderá a invocaciones inmediatas.
                </div>
              </div>
              <label className="sv-toggle">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span className="sv-slider" />
              </label>
            </div>

            {/* Submit Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid var(--border)", paddingTop: "24px", marginTop: "12px" }}>
              <NextLink
                href="/agents"
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  textDecoration: "none",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "background 0.15s ease",
                }}
              >
                Cancelar
              </NextLink>

              <button
                type="submit"
                style={{
                  padding: "10px 22px",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  transition: "opacity 0.15s ease",
                }}
              >
                Guardar Agente
              </button>
            </div>

          </div>
        </form>
      </main>
    </div>
  );
}

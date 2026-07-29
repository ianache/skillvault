"use client";

import React, { use, useEffect, useState, useRef } from "react";
import NextLink from "next/link";
import { getAgents, AIAgent, ChatMessage, ThoughtStep } from "@/lib/agents/store";
import { simulateAgentResponse } from "@/lib/agents/simulator";

// ── Retro Terminal Component with Typewriter Reveal ──
function RetroTerminal({ text, isRunning }: { text: string; isRunning: boolean }) {
  const [displayedText, setDisplayedText] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setDisplayedText("");
    let idx = 0;
    const typingInterval = 12; // speed of log reveal
    const stepSize = 4;        // chars per tick

    timerRef.current = setInterval(() => {
      if (idx < text.length) {
        setDisplayedText((prev) => prev + text.slice(idx, idx + stepSize));
        idx += stepSize;
      } else {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    }, typingInterval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [text]);

  return (
    <div
      style={{
        background: "#1c1a17",
        border: "1px solid var(--border-subtle, #2b2721)",
        borderRadius: "8px",
        marginTop: "12px",
        fontFamily: "var(--sv-font-mono), JetBrains Mono, monospace",
        fontSize: "12px",
        overflow: "hidden",
        boxShadow: "0 6px 16px rgba(0, 0, 0, 0.25)",
      }}
    >
      {/* macOS style header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "10px 14px",
          background: "#22201c",
          borderBottom: "1px solid #2e2a24",
          userSelect: "none",
        }}
      >
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ff5f56" }} />
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ffbd2e" }} />
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#27c93f" }} />
        <span
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: "10.5px",
            color: "var(--faint, #a9772e80)",
            marginRight: "36px",
            fontWeight: 500,
            letterSpacing: "0.03em",
          }}
        >
          bash — {isRunning ? "ejecutando..." : "completado"}
        </span>
      </div>

      <pre
        style={{
          padding: "14px 18px",
          margin: 0,
          color: "#e6e1dc",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          lineHeight: "1.6",
          maxHeight: "240px",
          overflowY: "auto",
        }}
      >
        {displayedText}
        {(isRunning || displayedText.length < text.length) && (
          <span className="sv-terminal-cursor" style={{ marginLeft: "2px" }}>█</span>
        )}
      </pre>
    </div>
  );
}

// ── Main Page Component ──
interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AgentChatPage({ params }: PageProps) {
  const { id } = use(params);

  const [mounted, setMounted] = useState(false);
  const [agent, setAgent] = useState<AIAgent | null>(null);
  const [skillsList, setSkillsList] = useState<Record<string, { name: string; type?: string }>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentRunningSkill, setCurrentRunningSkill] = useState<string | null>(null);
  const [collapsedThoughtSteps, setCollapsedThoughtSteps] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);

    const activeAgent = getAgents().find((a) => a.id === id);
    if (activeAgent) {
      setAgent(activeAgent);

      // Welcome message initialized based on agent's configuration
      const welcomeMsg: ChatMessage = {
        id: "msg-welcome",
        role: "assistant",
        content: `Hola. Soy un agente configurado como **"${activeAgent.name}"**. Mi rol es: *"${activeAgent.description}"*.\n\nTengo asignados los siguientes skills: [${activeAgent.skills.map(s => `\`${s}\``).join(", ") || "Ninguno"}]. ¿En qué puedo ayudarte hoy?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        thoughtSteps: [],
      };
      setMessages([welcomeMsg]);
    }

    // Load skills dictionary
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
      .catch((err) => console.error("Error loading skills mappings:", err));
  }, [id]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!mounted) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "14px", color: "var(--muted)", fontFamily: "var(--sv-font-mono), monospace" }}>
          Iniciando consola de simulación...
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "24px", textAlign: "center" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>Agente no encontrado</h3>
        <p style={{ fontSize: "14px", color: "var(--muted)", maxWidth: "400px" }}>
          El agente con el ID solicitado no existe o fue eliminado del almacenamiento local.
        </p>
        <NextLink
          href="/agents"
          style={{
            padding: "10px 20px",
            background: "var(--accent)",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          Volver a Agentes
        </NextLink>
      </div>
    );
  }

  // Visual helper colors and initials
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
      "linear-gradient(135deg, #14b8a6, #0d9488)", // Teal
    ];
    return gradients[sum % gradients.length];
  }

  const agentInitials = getInitials(agent.name);
  const agentGradient = getGradient(agent.name);

  // Quick action suggestions
  const getSuggestChips = () => {
    const chips = [];
    if (agent.skills.includes("terraform-lint")) {
      chips.push("Revisar sintaxis de main.tf");
      chips.push("Ejecutar linter de terraform");
    }
    if (agent.skills.includes("pr-reviewer")) {
      chips.push("Revisar Pull Request de feat/auth");
      chips.push("Analizar estilos de mi código");
    }
    chips.push("Hola, ¿cuál es tu rol principal?");
    chips.push("Optimizar configuración actual");
    return chips.slice(0, 3); // top 3 chips
  };

  // Submit Prompt Handler
  async function handleSend(text: string) {
    if (!text.trim() || isSimulating) return;
    if (!agent) return;

    const userMsg: ChatMessage = {
      id: "msg-" + Math.random().toString(36).substring(2, 11),
      role: "user",
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setIsSimulating(true);

    try {
      // 1. Get the pre-packaged mock response from the simulator
      const simulatedResponse = await simulateAgentResponse(agent, text);

      // 2. Initialize a local assistant message with pending thought steps and empty output text
      const initialThoughtSteps = simulatedResponse.thoughtSteps?.map((s) => ({
        ...s,
        status: "pending" as const,
      })) || [];

      const assistantMsgId = simulatedResponse.id;
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        thoughtSteps: initialThoughtSteps,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // 3. Sequential pacing simulation
      if (initialThoughtSteps.length > 0) {
        for (let i = 0; i < initialThoughtSteps.length; i++) {
          const step = initialThoughtSteps[i];

          // Set step to 'running'
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === assistantMsgId && m.thoughtSteps) {
                return {
                  ...m,
                  thoughtSteps: m.thoughtSteps.map((s, idx) =>
                    idx === i ? { ...s, status: "running" as const } : s
                  ),
                };
              }
              return m;
            })
          );

          // Identify active running skill for sidebar glow effect
          const labelLower = step.label.toLowerCase();
          const isTerraform = labelLower.includes("terraform") || labelLower.includes("lint");
          const isPr = labelLower.includes("pr") || labelLower.includes("reviewer") || labelLower.includes("review");

          if (isTerraform && agent.skills.includes("terraform-lint")) {
            setCurrentRunningSkill("terraform-lint");
          } else if (isPr && agent.skills.includes("pr-reviewer")) {
            setCurrentRunningSkill("pr-reviewer");
          } else {
            setCurrentRunningSkill(null);
          }

          // Realistic execution delay
          const delay = step.durationMs || 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));

          // Set step to 'completed'
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === assistantMsgId && m.thoughtSteps) {
                return {
                  ...m,
                  thoughtSteps: m.thoughtSteps.map((s, idx) =>
                    idx === i ? { ...s, status: "completed" as const } : s
                  ),
                };
              }
              return m;
            })
          );
        }
      }

      // Reset skill glowing state
      setCurrentRunningSkill(null);

      // 4. Reveal the final answer
      const finalContent = simulatedResponse.content;
      let currentText = "";
      const typingInterval = 10; // Typing tick speed
      const chunkSize = 6;       // Characters per tick
      let charIdx = 0;

      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (charIdx < finalContent.length) {
            currentText += finalContent.slice(charIdx, charIdx + chunkSize);
            charIdx += chunkSize;
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id === assistantMsgId) {
                  return { ...m, content: currentText };
                }
                return m;
              })
            );
          } else {
            clearInterval(interval);
            // Ensure exact final match
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id === assistantMsgId) {
                  return { ...m, content: finalContent };
                }
                return m;
              })
            );
            resolve();
          }
        }, typingInterval);
      });
    } catch (err) {
      console.error("Error generating agent response simulation:", err);
    } finally {
      setIsSimulating(false);
      setCurrentRunningSkill(null);
    }
  }

  const toggleStepsCollapse = (msgId: string) => {
    setCollapsedThoughtSteps((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        minHeight: "100vh",
        background: "var(--bg)",
        fontFamily: "var(--sv-font-display), sans-serif",
      }}
    >
      {/* Dynamic CSS styles for animations */}
      <style>{`
        @keyframes sv-glow-teal {
          0% { box-shadow: 0 0 0 0 rgba(15, 148, 136, 0.4); border-color: var(--green); }
          70% { box-shadow: 0 0 0 8px rgba(15, 148, 136, 0); border-color: var(--green); }
          100% { box-shadow: 0 0 0 0 rgba(15, 148, 136, 0); border-color: var(--green); }
        }
        .sv-pulsing-skill {
          animation: sv-glow-teal 1.6s infinite;
          background: rgba(15, 148, 136, 0.05) !important;
          border-color: rgba(15, 148, 136, 0.4) !important;
        }
        .sv-step-running-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 10px var(--green);
          animation: pulse 0.8s infinite alternate;
        }
        @keyframes pulse {
          from { opacity: 0.3; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1.1); }
        }
        @keyframes sv-blink {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        .sv-terminal-cursor {
          animation: sv-blink 1s step-end infinite;
          color: var(--accent);
        }
        .sv-chip-btn {
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--muted);
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }
        .sv-chip-btn:hover:not(:disabled) {
          background: rgba(169, 119, 46, 0.05);
          border-color: var(--accent);
          color: var(--accent);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(169, 119, 46, 0.08);
        }
        .sv-send-btn {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sv-send-btn:hover:not(:disabled) {
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 4px 12px rgba(169, 119, 46, 0.2);
        }
        .sv-sidebar {
          width: 320px;
          border-right: 1px solid var(--border);
          background: var(--surface);
          backdrop-filter: blur(12px);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.01);
        }
        .sv-main-chat {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: relative;
          background: var(--bg);
        }
        .sv-message-user {
          background: rgba(169, 119, 46, 0.04) !important;
          border: 1px solid rgba(169, 119, 46, 0.15) !important;
          border-radius: 14px 2px 14px 14px !important;
          box-shadow: 0 4px 12px rgba(169, 119, 46, 0.02);
        }
        .sv-message-assistant {
          background: var(--surface) !important;
          border: 1px solid var(--border) !important;
          border-left: 3px solid var(--green) !important;
          border-radius: 2px 14px 14px 14px !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.015);
        }
        .sv-terminal-wrapper {
          position: relative;
        }
        .sv-terminal-wrapper::after {
          content: " ";
          display: block;
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background: linear-gradient(rgba(18, 16, 21, 0) 50%, rgba(0, 0, 0, 0.15) 50%);
          background-size: 100% 4px;
          z-index: 10;
          pointer-events: none;
          opacity: 0.15;
        }
        @media (max-width: 800px) {
          .sv-sidebar {
            display: none; /* Hide sidebar on small mobile screens */
          }
        }
      `}</style>

      {/* ── Left Sidebar: Agent Profile & Skills ── */}
      <aside className="sv-sidebar">
        {/* Back Link */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)" }}>
          <NextLink
            href="/agents"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--muted)",
              fontSize: "12px",
              textDecoration: "none",
              fontFamily: "var(--sv-font-mono), monospace",
              fontWeight: 500,
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Volver a la lista
          </NextLink>
        </div>

        {/* Profile Details */}
        <div style={{ padding: "28px 24px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "14px",
              background: agentGradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: "22px",
              fontFamily: "var(--sv-font-mono), monospace",
              marginBottom: "16px",
              boxShadow: "0 6px 16px rgba(0, 0, 0, 0.08)",
            }}
          >
            {agentInitials}
          </div>

          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 6px", color: "var(--text)" }}>
            {agent.name}
          </h2>

          <div
            style={{
              fontSize: "11px",
              fontFamily: "var(--sv-font-mono), monospace",
              color: "var(--muted)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "14px",
            }}
          >
            <span>{agent.model}</span>
            <span>•</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                color: agent.status === "active" ? "var(--green)" : "var(--muted)",
                fontWeight: 600,
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: agent.status === "active" ? "var(--green)" : "var(--muted)" }} />
              {agent.status === "active" ? "Activo" : agent.status === "draft" ? "Borrador" : "Pausado"}
            </span>
          </div>

          <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: "1.5", margin: 0 }}>
            {agent.description}
          </p>
        </div>

        {/* Skills Pane */}
        <div style={{ padding: "24px", flex: 1, overflowY: "auto" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--faint)",
              marginBottom: "14px",
              fontFamily: "var(--sv-font-mono), monospace",
            }}
          >
            Skills Asignados
          </div>

          {agent.skills.length === 0 ? (
            <div style={{ fontSize: "13px", color: "var(--faint)", fontStyle: "italic", padding: "12px 0" }}>
              Ningún skill asignado.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {agent.skills.map((slug) => {
                const sMeta = skillsList[slug] || { name: slug };
                const isRunning = currentRunningSkill === slug;

                return (
                  <div
                    key={slug}
                    className={isRunning ? "sv-pulsing-skill" : ""}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px",
                      background: "var(--raised, #1f1c16)",
                      border: isRunning ? "1px solid var(--green)" : "1px solid var(--border)",
                      borderRadius: "8px",
                      transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: isRunning ? "var(--green)" : "var(--accent)",
                        flexShrink: 0,
                        boxShadow: isRunning ? "0 0 8px var(--green)" : "none",
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {sMeta.name}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--muted)", fontFamily: "var(--sv-font-mono), monospace" }}>
                        {slug}
                      </div>
                    </div>
                    {isRunning && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          color: "var(--green)",
                          textTransform: "uppercase",
                          fontFamily: "var(--sv-font-mono), monospace",
                        }}
                      >
                        RUN
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* System Prompt Info */}
          <div style={{ marginTop: "24px", background: "var(--raised, #1f1c16)", borderRadius: "8px", padding: "14px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "10.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--faint)", marginBottom: "6px", fontFamily: "var(--sv-font-mono), monospace" }}>
              System Prompt
            </div>
            <div style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5, maxHeight: "120px", overflowY: "auto", whiteSpace: "pre-wrap", fontStyle: "italic" }}>
              {agent.systemPrompt || "No configurado"}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Right Main Area: Scrollable Chat ── */}
      <main className="sv-main-chat">
        {/* Chat Window Header */}
        <header
          style={{
            height: "58px",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Minimal Header Avatar for mobile */}
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: agentGradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "10px",
                fontWeight: 700,
                fontFamily: "var(--sv-font-mono), monospace",
              }}
            >
              {agentInitials}
            </div>
            <div>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{agent.name}</span>
              <span style={{ fontSize: "11px", color: "var(--muted)", marginLeft: "8px", fontFamily: "var(--sv-font-mono), monospace" }}>
                {agent.model}
              </span>
            </div>
          </div>

          <div style={{ fontSize: "12.5px", color: "var(--muted)" }}>
            Canal de Simulación
          </div>
        </header>

        {/* Scrollable conversation history */}
        <section
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div style={{ maxWidth: "760px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const showSteps = msg.thoughtSteps && msg.thoughtSteps.length > 0;
              const isCollapsed = collapsedThoughtSteps[msg.id] ?? false;

              return (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    flexDirection: isUser ? "row-reverse" : "row",
                    alignItems: "flex-start",
                    gap: "14px",
                  }}
                >
                  {/* Avatar Bubble */}
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: isUser ? "var(--accent)" : agentGradient,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "12.5px",
                      fontFamily: "var(--sv-font-mono), monospace",
                      flexShrink: 0,
                    }}
                  >
                    {isUser ? "TÚ" : agentInitials}
                  </div>

                  {/* Message Bubble Container */}
                  <div style={{ flex: 1, maxWidth: "80%", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {/* Timestamp and Sender name */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: isUser ? "flex-end" : "flex-start",
                        gap: "8px",
                        fontSize: "11px",
                        color: "var(--muted)",
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{isUser ? "Tú" : agent.name}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Speech bubble */}
                    <div
                      className={isUser ? "sv-message-user" : "sv-message-assistant"}
                      style={{
                        padding: "16px 20px",
                        position: "relative",
                        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    >
                      {/* Thought process section */}
                      {showSteps && (
                        <div style={{ marginBottom: msg.content ? "18px" : "0", borderBottom: msg.content ? "1px solid var(--border-subtle, #2b2721)" : "none", paddingBottom: msg.content ? "14px" : "0" }}>
                          {/* Toggle Header */}
                          <button
                            onClick={() => toggleStepsCollapse(msg.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              width: "100%",
                              background: "none",
                              border: "none",
                              padding: "4px 0 10px",
                              color: "var(--green)",
                              fontSize: "11.5px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              cursor: "pointer",
                              fontFamily: "var(--sv-font-mono), monospace",
                            }}
                          >
                            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                style={{
                                  transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                                  transition: "transform 0.15s ease",
                                }}
                              >
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                              Pensamiento Interno del Agente
                            </span>
                            <span style={{ fontSize: "10.5px", color: "var(--muted)", fontWeight: 500 }}>
                              {isCollapsed ? "Mostrar" : "Colapsar"}
                            </span>
                          </button>

                          {/* Steps Timeline list */}
                          {!isCollapsed && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "4px", borderLeft: "2px solid var(--border)" }}>
                              {msg.thoughtSteps?.map((step) => {
                                const isPending = step.status === "pending";
                                const isRunning = step.status === "running";
                                const isCompleted = step.status === "completed";

                                return (
                                  <div key={step.id} style={{ position: "relative", paddingLeft: "16px" }}>
                                    {/* Circle Bullet */}
                                    <div
                                      style={{
                                        position: "absolute",
                                        left: "-5px",
                                        top: "4px",
                                        width: "8px",
                                        height: "8px",
                                        borderRadius: "50%",
                                        background: isCompleted ? "var(--green)" : isRunning ? "var(--accent)" : "var(--muted)",
                                        border: isRunning ? "2px solid var(--surface)" : "none",
                                      }}
                                      className={isRunning ? "sv-step-running-indicator" : ""}
                                    />

                                    {/* Text Line */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                      <span
                                        style={{
                                          fontSize: "12.5px",
                                          color: isCompleted ? "var(--text)" : isRunning ? "var(--accent)" : "var(--muted)",
                                          fontWeight: isRunning ? 600 : 500,
                                        }}
                                      >
                                        {step.label}
                                      </span>
                                      {step.durationMs && isCompleted && (
                                        <span style={{ fontSize: "10px", fontFamily: "var(--sv-font-mono), monospace", color: "var(--faint)" }}>
                                          ({(step.durationMs / 1000).toFixed(1)}s)
                                        </span>
                                      )}
                                    </div>

                                    {/* Output Retro macOS Console */}
                                    {step.output && (isRunning || isCompleted) && (
                                      <RetroTerminal text={step.output} isRunning={isRunning} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content block */}
                      {msg.content ? (
                        <div
                          style={{
                            fontSize: "13.5px",
                            lineHeight: "1.6",
                            color: "var(--text)",
                            whiteSpace: "pre-wrap",
                          }}
                          className="sv-markdown-chat-body"
                        >
                          {msg.content}
                        </div>
                      ) : (
                        isSimulating &&
                        !showSteps && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)", fontSize: "13px" }}>
                            <div className="sv-step-running-indicator" />
                            <span>Agente pensando...</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </section>

        {/* ── Footer: Suggest chips + Input ── */}
        <footer
          style={{
            background: "var(--surface)",
            borderTop: "1px solid var(--border)",
            padding: "16px 24px 24px",
            flexShrink: 0,
          }}
        >
          <div style={{ maxWidth: "760px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Suggest chips */}
            {!isSimulating && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {getSuggestChips().map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(chip)}
                    className="sv-chip-btn"
                    style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "11.5px",
                      fontWeight: 500,
                    }}
                  >
                    ✨ {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Input area */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(inputPrompt);
              }}
              style={{
                display: "flex",
                gap: "12px",
                position: "relative",
              }}
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                disabled={isSimulating}
                placeholder={isSimulating ? "El agente está procesando la simulación..." : "Pregúntale algo a tu agente..."}
                style={{
                  flex: 1,
                  background: "var(--raised, #1f1c16)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "14px 18px",
                  fontSize: "13.5px",
                  color: "var(--text)",
                  outline: "none",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                  fontFamily: "var(--sv-font-display), sans-serif",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-muted)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />

              <button
                type="submit"
                disabled={isSimulating || !inputPrompt.trim()}
                className="sv-send-btn"
                style={{
                  background: isSimulating || !inputPrompt.trim() ? "var(--border)" : "var(--accent)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "0 22px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: isSimulating || !inputPrompt.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <span>Enviar</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          </div>
        </footer>
      </main>
    </div>
  );
}

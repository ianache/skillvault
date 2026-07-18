"use client";

import { CATEGORY_META, SkillRow } from "@/lib/types";
import { useState } from "react";

interface Props {
  skill: SkillRow | null;
  onClose: () => void;
}

const HARNESSES = {
  claude:   { globalPath: "~/.claude/skills",   localPath: ".claude/skills",   ext: "md" },
  codex:    { globalPath: "~/.codex/skills",    localPath: ".codex/skills",    ext: "md" },
  opencode: { globalPath: "~/.opencode/skills", localPath: ".opencode/skills", ext: "md" },
  agy:      { globalPath: "~/.agy/skills",      localPath: ".agy/skills",      ext: "md" },
  cursor:   { globalPath: "~/.cursor/rules",    localPath: ".cursor/rules",    ext: "mdc" },
} as const;

type HarnessKey = keyof typeof HARNESSES;

export function DetailPanel({ skill, onClose }: Props) {
  const [harness, setHarness] = useState<HarnessKey>("claude");
  const [scope, setScope] = useState<"global" | "local">("global");
  const [copied, setCopied] = useState(false);
  const [liveCount, setLiveCount] = useState<number | null>(null);

  if (!skill) return null;

  const meta = CATEGORY_META[skill.type] ?? { label: skill.type, color: "#8590A8", icon: "◇" };
  const h = HARNESSES[harness];
  const installPath = scope === "global" ? h.globalPath : h.localPath;
  const cmd = `skillvault install ${skill.slug} --harness ${harness} --scope ${scope}`;
  const invokeSnippet = `Skill({ skill: "${skill.slug}" })`;
  const displayCount = liveCount ?? skill.installCount;

  async function copyCmd() {
    await navigator.clipboard.writeText(cmd).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    // Increment counter in background
    fetch(`/api/skills/${skill.slug}/install`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => { if (d.installCount) setLiveCount(d.installCount); })
      .catch(() => {});
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: "min(480px, 100vw)",
        background: "var(--surface)",
        borderLeft: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
        boxShadow: "-8px 0 32px rgba(0,0,0,0.4)",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
          position: "sticky",
          top: 0,
          background: "var(--surface)",
          zIndex: 1,
        }}
        className={`stripe-${skill.type}`}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              {skill.name}
            </span>
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "10px",
                color: "var(--muted)",
              }}
            >
              v{skill.version}
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "9px",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                padding: "1px 6px",
                borderRadius: "3px",
                border: `1px solid ${meta.color}`,
                color: meta.color,
                background: `${meta.color}18`,
              }}
            >
              {meta.icon} {meta.label}
            </span>
            {skill.authorHandle && (
              <span style={{ fontSize: "11px", color: "var(--muted)" }}>{skill.authorHandle}</span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar panel"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--muted)",
            fontSize: "18px",
            lineHeight: 1,
            padding: "2px 6px",
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "20px", flex: 1 }}>
        <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "20px" }}>
          {skill.description}
        </p>

        {/* Invoke snippet */}
        <Section label="Invocación">
          <code
            style={{
              display: "block",
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "12px",
              background: "var(--raised)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              padding: "10px 14px",
              color: "var(--accent)",
            }}
          >
            {invokeSnippet}
          </code>
        </Section>

        {/* Triggers */}
        <Section label="Triggers">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {skill.triggers.map((t) => (
              <code
                key={t}
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "11px",
                  background: "var(--accent-muted)",
                  color: "var(--accent)",
                  padding: "3px 8px",
                  borderRadius: "3px",
                  border: "1px solid rgba(59,110,255,0.25)",
                }}
              >
                {t}
              </code>
            ))}
          </div>
        </Section>

        {/* Tools */}
        {skill.tools.length > 0 && (
          <Section label="Herramientas requeridas">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {skill.tools.map((t) => (
                <span
                  key={t}
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "10px",
                    padding: "2px 7px",
                    borderRadius: "3px",
                    border: "1px solid var(--border)",
                    color: "var(--muted)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Compatibility */}
        <Section label="Compatibilidad">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {skill.compatibility.map((h) => (
              <span
                key={h}
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "10px",
                  padding: "2px 7px",
                  borderRadius: "3px",
                  border: "1px solid var(--green)",
                  color: "var(--green)",
                  background: "rgba(46,204,138,0.08)",
                }}
              >
                ✓ {h}
              </span>
            ))}
          </div>
        </Section>

        {/* Install configurator */}
        <Section label="Instalar">
          <div style={{ background: "var(--raised)", border: "1px solid var(--border)", borderRadius: "4px", padding: "14px" }}>
            {/* Harness selector */}
            <div style={{ marginBottom: "10px" }}>
              <div style={{ fontSize: "10px", letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                Harness
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {(Object.keys(HARNESSES) as HarnessKey[]).map((h) => (
                  <button
                    key={h}
                    onClick={() => setHarness(h)}
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "10px",
                      padding: "3px 8px",
                      borderRadius: "3px",
                      border: `1px solid ${h === harness ? "var(--accent)" : "var(--border)"}`,
                      background: h === harness ? "var(--accent-muted)" : "none",
                      color: h === harness ? "var(--accent)" : "var(--muted)",
                      cursor: "pointer",
                    }}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Scope */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "10px", letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                Alcance
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                {(["global", "local"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setScope(s)}
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "10px",
                      padding: "3px 8px",
                      borderRadius: "3px",
                      border: `1px solid ${s === scope ? "var(--accent)" : "var(--border)"}`,
                      background: s === scope ? "var(--accent-muted)" : "none",
                      color: s === scope ? "var(--accent)" : "var(--muted)",
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Path preview */}
            <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: "10px" }}>
              <span style={{ color: "var(--faint)" }}>→ </span>
              <code style={{ fontFamily: "var(--font-jetbrains-mono), monospace", color: "var(--cyan)" }}>
                {installPath}/{skill.slug}.{h.ext}
              </code>
            </div>

            {/* Command */}
            <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "4px", padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
              <code style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", color: "var(--text)", flex: 1, wordBreak: "break-all" }}>
                {cmd}
              </code>
              <button
                onClick={copyCmd}
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "10px",
                  padding: "3px 8px",
                  borderRadius: "3px",
                  border: `1px solid ${copied ? "var(--green)" : "var(--border)"}`,
                  background: "none",
                  color: copied ? "var(--green)" : "var(--muted)",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all .12s",
                }}
              >
                {copied ? "✓" : "Copiar"}
              </button>
            </div>
          </div>
        </Section>

        {/* Stats */}
        <div style={{ display: "flex", gap: "20px", paddingTop: "4px" }}>
          <div>
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "18px",
                fontWeight: 700,
                color: liveCount !== null ? "var(--green)" : "var(--text)",
                fontVariantNumeric: "tabular-nums",
                transition: "color .4s",
              }}
            >
              {displayCount.toLocaleString()}
            </div>
            <div style={{ fontSize: "11px", color: "var(--muted)" }}>instalaciones</div>
          </div>
          {skill.publishedAt && (
            <div>
              <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>
                {new Date(skill.publishedAt * 1000).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted)" }}>publicado</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "9px",
          letterSpacing: "1px",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: "8px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {label}
        <span style={{ flex: 1, height: "1px", background: "var(--border)" }} />
      </div>
      {children}
    </div>
  );
}

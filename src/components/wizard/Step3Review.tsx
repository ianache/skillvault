"use client";

import { useState } from "react";
import matter from "gray-matter";
import { CATEGORY_META_WIZARD } from "./wizard-types";

interface AttachedFile {
  path: string;
  fileType: "resource" | "script";
  content: string;
}

interface Props {
  content: string;
  attachedFiles?: AttachedFile[];
  onBack: () => void;
  onPublish: () => Promise<{ ok: boolean; slug?: string; error?: string }>;
}

export function Step3Review({ content, attachedFiles = [], onBack, onPublish }: Props) {
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  let fm: Record<string, unknown> = {};
  let body = "";
  try {
    const parsed = matter(content);
    fm = parsed.data as Record<string, unknown>;
    body = parsed.content;
  } catch { /* ignore */ }

  const meta = fm.metadata as Record<string, unknown> | undefined;
  const type = (meta?.type as string) ?? "";
  const catMeta = CATEGORY_META_WIZARD[type] ?? { label: type, color: "#8590A8", icon: "◇" };
  const triggers = (meta?.triggers as string[]) ?? [];
  const tools = (meta?.tools as string[]) ?? [];
  const compatibility = (fm.compatibility as string[]) ?? ["claude"];

  async function handlePublish() {
    setPublishing(true);
    setError(null);
    const result = await onPublish();
    if (!result.ok) {
      setError(result.error ?? "Error al publicar");
      setPublishing(false);
    }
    // On success, parent redirects to /publish/success
  }

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "22px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "6px",
          }}
        >
          Paso 4 — Revisión final
        </h1>
        <p style={{ fontSize: "13px", color: "var(--muted)" }}>
          Revisa los metadatos antes de publicar. Una vez publicado aparecerá en el catálogo.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>

        {/* Identity card */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            padding: "18px",
            borderTop: `3px solid ${catMeta.color}`,
          }}
        >
          <SectionLabel>Identidad</SectionLabel>
          <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "18px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
            {String(fm.name ?? "—")}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" }}>
            <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", color: "var(--muted)" }}>
              v{String(fm.version ?? "1.0.0")}
            </span>
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "9px",
                padding: "1px 6px",
                borderRadius: "3px",
                border: `1px solid ${catMeta.color}`,
                color: catMeta.color,
                background: `${catMeta.color}18`,
                letterSpacing: "0.8px",
                textTransform: "uppercase",
              }}
            >
              {catMeta.icon} {catMeta.label}
            </span>
            {fm.author ? (
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>{String(fm.author)}</span>
            ) : null}
          </div>
          <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.5, margin: 0 }}>
            {String(fm.description ?? "—")}
          </p>
        </div>

        {/* Triggers + tools */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              padding: "14px",
            }}
          >
            <SectionLabel>Triggers ({triggers.length})</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {triggers.map((t) => (
                <code
                  key={t}
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "11px",
                    background: "var(--accent-muted)",
                    color: "var(--accent)",
                    padding: "2px 7px",
                    borderRadius: "3px",
                    border: "1px solid rgba(59,110,255,0.25)",
                  }}
                >
                  {t}
                </code>
              ))}
            </div>
          </div>

          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              padding: "14px",
            }}
          >
            <SectionLabel>Herramientas</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
              {tools.length > 0 ? tools.map((t) => (
                <span
                  key={t}
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "10px",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    border: "1px solid var(--border)",
                    color: "var(--muted)",
                  }}
                >
                  {t}
                </span>
              )) : <span style={{ fontSize: "12px", color: "var(--faint)" }}>Ninguna declarada</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Compatibility */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "4px",
          padding: "14px",
          marginBottom: "16px",
        }}
      >
        <SectionLabel>Compatibilidad declarada</SectionLabel>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {compatibility.map((h) => (
            <span
              key={h}
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "11px",
                padding: "3px 9px",
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
      </div>

      {/* Body preview */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "4px",
          padding: "14px",
          marginBottom: "20px",
        }}
      >
        <SectionLabel>Cuerpo del skill ({body.trim().split("\n").length} líneas)</SectionLabel>
        <pre
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "11px",
            color: "var(--muted)",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            padding: "10px 12px",
            maxHeight: "160px",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            margin: 0,
          }}
        >
          {body.trim().slice(0, 600)}{body.trim().length > 600 ? "\n…" : ""}
        </pre>
      </div>

      {/* Attached files */}
      {attachedFiles.length > 0 && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            padding: "14px",
            marginBottom: "16px",
          }}
        >
          <SectionLabel>Archivos adjuntos ({attachedFiles.length})</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {attachedFiles.map((f) => (
              <div key={f.path} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px" }}>{f.fileType === "script" ? "⚡" : "📄"}</span>
                <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", color: f.fileType === "script" ? "var(--amber)" : "var(--muted)" }}>
                  {f.path}
                </span>
                <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", color: "var(--faint)", marginLeft: "auto" }}>
                  {f.content.split("\n").length} líneas
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(232,80,58,0.08)",
            border: "1px solid var(--red)",
            borderRadius: "4px",
            fontSize: "13px",
            color: "var(--red)",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "16px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <button
          onClick={onBack}
          disabled={publishing}
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "13px",
            padding: "9px 18px",
            borderRadius: "4px",
            border: "1px solid var(--border)",
            background: "none",
            color: "var(--muted)",
            cursor: "pointer",
          }}
        >
          ← Requisitos
        </button>
        <button
          onClick={handlePublish}
          disabled={publishing}
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "13px",
            fontWeight: 700,
            padding: "10px 28px",
            borderRadius: "4px",
            border: "none",
            background: publishing ? "var(--faint)" : "var(--accent)",
            color: "#fff",
            cursor: publishing ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {publishing ? "Enviando…" : "Enviar a revision"}
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: "9px",
        letterSpacing: "1px",
        textTransform: "uppercase",
        color: "var(--muted)",
        marginBottom: "10px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {children}
      <span style={{ flex: 1, height: "1px", background: "var(--border)" }} />
    </div>
  );
}

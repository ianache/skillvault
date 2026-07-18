"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { validateSkillFrontmatter, validateBodySections } from "@/lib/skill-schema";
import matter from "gray-matter";

interface Props {
  slug: string;
  initialContent: string;
}

interface Issue {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export function SkillEditor({ slug, initialContent }: Props) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<unknown>(null);
  const [content, setContent] = useState(initialContent);
  const [errors, setErrors] = useState<Issue[]>([]);
  const [warnings, setWarnings] = useState<Issue[]>([]);
  const [valid, setValid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [dirty, setDirty] = useState(false);

  const validate = useCallback((text: string) => {
    try {
      const parsed = matter(text);
      const fmResult = validateSkillFrontmatter(parsed.data);
      const bodyResult = validateBodySections(parsed.content);
      setErrors([...fmResult.errors, ...bodyResult.errors] as Issue[]);
      setWarnings([...fmResult.warnings, ...bodyResult.warnings] as Issue[]);
      setValid(fmResult.valid && bodyResult.errors.length === 0);
    } catch {
      setErrors([{ field: "frontmatter", message: "YAML inválido", severity: "error" }]);
      setWarnings([]);
      setValid(false);
    }
  }, []);

  useEffect(() => {
    validate(content);
  }, [content, validate]);

  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    (async () => {
      const { EditorView, keymap, lineNumbers, highlightActiveLine } = await import("@codemirror/view");
      const { EditorState } = await import("@codemirror/state");
      const { markdown } = await import("@codemirror/lang-markdown");
      const { defaultKeymap, historyKeymap, history } = await import("@codemirror/commands");
      const { oneDark } = await import("@codemirror/theme-one-dark");

      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark" ||
        (!document.documentElement.getAttribute("data-theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const text = update.state.doc.toString();
          setContent(text);
          setDirty(true);
          setSaveOk(false);
        }
      });

      const baseTheme = EditorView.theme({
        "&": { background: "var(--bg)", color: "var(--text)", fontSize: "12px", fontFamily: "var(--font-jetbrains-mono), monospace", height: "520px", overflow: "auto" },
        ".cm-scroller": { fontFamily: "var(--font-jetbrains-mono), monospace", lineHeight: "1.7" },
        ".cm-content": { padding: "12px 0" },
        ".cm-line": { padding: "0 16px" },
        ".cm-gutters": { background: "var(--surface)", border: "none", borderRight: "1px solid var(--border)", color: "var(--faint)" },
        ".cm-activeLineGutter": { background: "var(--raised)" },
        ".cm-activeLine": { background: "var(--raised)" },
        ".cm-selectionBackground, ::selection": { background: "rgba(59,110,255,0.25) !important" },
        ".cm-cursor": { borderLeftColor: "var(--accent)" },
      });

      const state = EditorState.create({
        doc: initialContent,
        extensions: [
          markdown(),
          history(),
          lineNumbers(),
          highlightActiveLine(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          updateListener,
          baseTheme,
          ...(isDark ? [oneDark] : []),
          EditorView.lineWrapping,
        ],
      });

      viewRef.current = new EditorView({ state, parent: editorRef.current! });
    })();

    return () => {
      if (viewRef.current) {
        (viewRef.current as { destroy: () => void }).destroy();
        viewRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaveOk(false);
    try {
      const res = await fetch(`/api/skills/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawContent: content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "Error al guardar");
      } else {
        setSaveOk(true);
        setDirty(false);
        router.refresh();
      }
    } catch (e) {
      setSaveError(String(e));
    } finally {
      setSaving(false);
    }
  }

  // Simple markdown preview
  const previewHtml = (() => {
    try {
      const parsed = matter(content);
      return parsed.content
        .replace(/^## (.+)$/gm, '<h2 style="color:var(--text);font-size:15px;margin:18px 0 8px;font-family:var(--font-geist),sans-serif">$1</h2>')
        .replace(/^### (.+)$/gm, '<h3 style="color:var(--text);font-size:13px;margin:14px 0 6px">$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.+?)`/g, '<code style="font-family:var(--font-jetbrains-mono),monospace;font-size:11px;background:var(--raised);padding:1px 5px;border-radius:3px;color:var(--accent)">$1</code>')
        .replace(/^- (.+)$/gm, '<li style="color:var(--muted);margin:3px 0">$1</li>')
        .replace(/\n\n/g, "<br/>");
    } catch { return ""; }
  })();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: "16px", alignItems: "start" }}>
      {/* Editor panel */}
      <div>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
          {(["editor", "preview"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "11px",
                padding: "8px 14px",
                border: "none",
                borderBottom: `2px solid ${activeTab === tab ? "var(--accent)" : "transparent"}`,
                background: "none",
                color: activeTab === tab ? "var(--accent)" : "var(--muted)",
                cursor: "pointer",
                marginBottom: "-1px",
              }}
            >
              {tab === "editor" ? "Editor SKILL.md" : "Preview"}
            </button>
          ))}
          {dirty && (
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "10px",
                color: "var(--amber)",
                padding: "8px 10px",
                marginLeft: "auto",
              }}
            >
              ● cambios sin guardar
            </span>
          )}
        </div>

        <div
          style={{
            border: "1px solid var(--border)",
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
            overflow: "hidden",
            background: "var(--bg)",
          }}
        >
          <div ref={editorRef} style={{ display: activeTab === "editor" ? "block" : "none", height: "520px" }} />
          {activeTab === "preview" && (
            <div
              style={{ padding: "20px 24px", height: "520px", overflowY: "auto", fontSize: "13px", lineHeight: 1.7, color: "var(--text)" }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          )}
        </div>

        {/* Save bar */}
        <div
          style={{
            marginTop: "14px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
          {saveError && (
            <span style={{ fontSize: "12px", color: "var(--red)", flex: 1 }}>{saveError}</span>
          )}
          {saveOk && (
            <span style={{ fontSize: "12px", color: "var(--green)", flex: 1 }}>✓ Guardado correctamente</span>
          )}
          <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", color: "var(--faint)" }}>
            {content.split("\n").length} líneas
          </span>
          <button
            onClick={handleSave}
            disabled={saving || !valid || !dirty}
            style={{
              fontFamily: "var(--font-geist), sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              padding: "9px 22px",
              borderRadius: "4px",
              border: "none",
              background: valid && dirty && !saving ? "var(--accent)" : "var(--faint)",
              color: valid && dirty && !saving ? "#fff" : "var(--muted)",
              cursor: valid && dirty && !saving ? "pointer" : "not-allowed",
            }}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>

      {/* Validation sidebar */}
      <div style={{ position: "sticky", top: "72px" }}>
        <div
          style={{
            background: "var(--surface)",
            border: `1px solid ${errors.length > 0 ? "var(--red)" : warnings.length > 0 ? "var(--amber)" : "var(--green)"}`,
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 14px",
              background: "var(--raised)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "13px" }}>
              {errors.length > 0 ? "⚠" : warnings.length > 0 ? "△" : "✓"}
            </span>
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "11px",
                color: errors.length > 0 ? "var(--red)" : warnings.length > 0 ? "var(--amber)" : "var(--green)",
              }}
            >
              {errors.length > 0
                ? `${errors.length} error${errors.length > 1 ? "es" : ""}`
                : warnings.length > 0
                ? `${warnings.length} aviso${warnings.length > 1 ? "s" : ""}`
                : "Sin errores"}
            </span>
          </div>
          <div style={{ padding: "10px", maxHeight: "360px", overflowY: "auto" }}>
            {errors.length === 0 && warnings.length === 0 ? (
              <div style={{ fontSize: "12px", color: "var(--muted)", padding: "4px" }}>
                Listo para guardar ✓
              </div>
            ) : (
              [...errors, ...warnings].map((issue, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: "11px",
                    padding: "6px 8px",
                    marginBottom: "4px",
                    borderRadius: "3px",
                    background: issue.severity === "error" ? "rgba(232,80,58,0.08)" : "rgba(232,139,58,0.08)",
                    borderLeft: `2px solid ${issue.severity === "error" ? "var(--red)" : "var(--amber)"}`,
                    color: "var(--muted)",
                    lineHeight: 1.4,
                  }}
                >
                  <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", color: issue.severity === "error" ? "var(--red)" : "var(--amber)", marginBottom: "2px" }}>
                    {issue.field}
                  </div>
                  {issue.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

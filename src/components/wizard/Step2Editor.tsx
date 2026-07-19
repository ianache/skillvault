"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { validateSkillFrontmatter, validateBodySections, ValidationError, ValidationWarning } from "@/lib/skill-schema";
import matter from "gray-matter";

interface Props {
  content: string;
  onChange: (content: string) => void;
  onNext: () => void;
  onBack: () => void;
}

interface ValidationState {
  errors: (ValidationError | ValidationWarning)[];
  warnings: (ValidationError | ValidationWarning)[];
  valid: boolean;
}

export function Step2Editor({ content, onChange, onNext, onBack }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<unknown>(null);
  const [validation, setValidation] = useState<ValidationState>({ errors: [], warnings: [], valid: false });
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  // Validate on content change
  const validate = useCallback((text: string) => {
    try {
      const parsed = matter(text);
      const fmResult = validateSkillFrontmatter(parsed.data);
      const bodyResult = validateBodySections(parsed.content);
      const errors = [...fmResult.errors, ...bodyResult.errors];
      const warnings = [...fmResult.warnings, ...bodyResult.warnings];
      setValidation({ errors, warnings, valid: errors.length === 0 });
    } catch {
      setValidation({
        errors: [{ field: "frontmatter", message: "YAML inválido en el frontmatter", severity: "error" }],
        warnings: [],
        valid: false,
      });
    }
  }, []);

  useEffect(() => {
    validate(content);
  }, [content, validate]);

  // Bootstrap CodeMirror only on client
  useEffect(() => {
    if (!editorRef.current || viewRef.current) return;

    (async () => {
      const { EditorView, keymap, lineNumbers, highlightActiveLine } = await import("@codemirror/view");
      const { EditorState } = await import("@codemirror/state");
      const { markdown } = await import("@codemirror/lang-markdown");
      const { defaultKeymap, historyKeymap } = await import("@codemirror/commands");
      const { history } = await import("@codemirror/commands");
      const { oneDark } = await import("@codemirror/theme-one-dark");

      const isDark = document.documentElement.getAttribute("data-theme") === "dark" ||
        (!document.documentElement.getAttribute("data-theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const text = update.state.doc.toString();
          onChange(text);
        }
      });

      const baseTheme = EditorView.theme({
        "&": {
          background: "var(--bg)",
          color: "var(--text)",
          fontSize: "12px",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          height: "460px",
          overflow: "auto",
        },
        ".cm-editor": { height: "100%" },
        ".cm-scroller": { fontFamily: "var(--font-jetbrains-mono), monospace", lineHeight: "1.7" },
        ".cm-content": { padding: "12px 0" },
        ".cm-line": { padding: "0 16px" },
        ".cm-gutters": {
          background: "var(--surface)",
          border: "none",
          borderRight: "1px solid var(--border)",
          color: "var(--faint)",
        },
        ".cm-activeLineGutter": { background: "var(--raised)" },
        ".cm-activeLine": { background: "var(--raised)" },
        ".cm-selectionBackground, ::selection": { background: "rgba(59,110,255,0.25) !important" },
        ".cm-cursor": { borderLeftColor: "var(--accent)" },
      });

      const extensions = [
        markdown(),
        history(),
        lineNumbers(),
        highlightActiveLine(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        updateListener,
        baseTheme,
        ...(isDark ? [oneDark] : []),
        EditorView.lineWrapping,
      ];

      const state = EditorState.create({
        doc: content,
        extensions,
      });

      const view = new EditorView({
        state,
        parent: editorRef.current!,
      });

      viewRef.current = view;
    })();

    return () => {
      if (viewRef.current) {
        (viewRef.current as { destroy: () => void }).destroy();
        viewRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external content changes into editor (e.g. reset)
  useEffect(() => {
    if (!viewRef.current) return;
    const view = viewRef.current as { state: { doc: { toString: () => string } }; dispatch: (tr: unknown) => void };
    const current = (view as { state: { doc: { toString: () => string } } }).state.doc.toString();
    if (current !== content) {
      const { EditorState } = require("@codemirror/state");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (view as any).dispatch({ changes: { from: 0, to: current.length, insert: content } });
    }
  }, [content]);

  // Simple markdown → HTML preview
  const renderPreview = (text: string) => {
    try {
      const parsed = matter(text);
      const fm = parsed.data;
      const body = parsed.content
        .replace(/^## (.+)$/gm, '<h2 style="color:var(--text);font-size:15px;margin:18px 0 8px;font-family:var(--font-geist),sans-serif">$1</h2>')
        .replace(/^### (.+)$/gm, '<h3 style="color:var(--text);font-size:13px;margin:14px 0 6px;font-family:var(--font-geist),sans-serif">$1</h3>')
        .replace(/^# (.+)$/gm, '<h1 style="color:var(--text);font-size:18px;font-weight:700;margin:0 0 12px;font-family:var(--font-geist),sans-serif">$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.+?)`/g, '<code style="font-family:var(--font-jetbrains-mono),monospace;font-size:11px;background:var(--raised);padding:1px 5px;border-radius:3px;color:var(--accent)">$1</code>')
        .replace(/```[\s\S]*?```/g, (m) => `<pre style="background:var(--raised);border:1px solid var(--border);border-radius:4px;padding:10px;font-family:var(--font-jetbrains-mono),monospace;font-size:11px;overflow-x:auto;color:var(--text)">${m.replace(/```\w*\n?/g, "")}</pre>`)
        .replace(/^- (.+)$/gm, '<li style="color:var(--muted);margin:3px 0">$1</li>')
        .replace(/\n\n/g, '<br/>')
        .trim();

      return { fm, body };
    } catch {
      return { fm: {}, body: text };
    }
  };

  const { fm, body } = renderPreview(content);

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "22px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "6px",
          }}
        >
          Paso 2 — Editor SKILL.md
        </h1>
        <p style={{ fontSize: "13px", color: "var(--muted)" }}>
          Edita el contenido completo. Los errores se muestran en tiempo real.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "16px", alignItems: "start" }}>

        {/* Editor panel */}
        <div>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "0" }}>
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
                  transition: "color .1s",
                }}
              >
                {tab === "editor" ? "Editor" : "Preview"}
              </button>
            ))}
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
            {/* CodeMirror mount */}
            <div
              ref={editorRef}
              style={{ display: activeTab === "editor" ? "block" : "none", height: "460px" }}
            />

            {/* Preview */}
            {activeTab === "preview" && (
              <div
                style={{
                  padding: "20px 24px",
                  height: "460px",
                  overflowY: "auto",
                  fontSize: "13px",
                  lineHeight: 1.7,
                  color: "var(--text)",
                }}
              >
                {/* Frontmatter summary */}
                {fm.name && (
                  <div
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "4px",
                      padding: "12px 14px",
                      marginBottom: "16px",
                      display: "flex",
                      gap: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", color: "var(--muted)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "3px" }}>Nombre</div>
                      <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontWeight: 700, color: "var(--accent)" }}>{fm.name}</div>
                    </div>
                    {fm.version && (
                      <div>
                        <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", color: "var(--muted)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "3px" }}>Versión</div>
                        <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", color: "var(--text)" }}>v{fm.version}</div>
                      </div>
                    )}
                    {fm.metadata?.type && (
                      <div>
                        <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", color: "var(--muted)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "3px" }}>Tipo</div>
                        <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", color: "var(--text)" }}>{fm.metadata.type}</div>
                      </div>
                    )}
                  </div>
                )}
                <div dangerouslySetInnerHTML={{ __html: body }} />
              </div>
            )}
          </div>
        </div>

        {/* Validation panel */}
        <div style={{ position: "sticky", top: "72px" }}>
          <div
            style={{
              background: "var(--surface)",
              border: `1px solid ${validation.errors.length > 0 ? "var(--red)" : validation.warnings.length > 0 ? "var(--amber)" : "var(--green)"}`,
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
                {validation.errors.length > 0 ? "⚠" : validation.warnings.length > 0 ? "△" : "✓"}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "11px",
                  color: validation.errors.length > 0 ? "var(--red)" : validation.warnings.length > 0 ? "var(--amber)" : "var(--green)",
                }}
              >
                {validation.errors.length > 0
                  ? `${validation.errors.length} error${validation.errors.length > 1 ? "es" : ""}`
                  : validation.warnings.length > 0
                  ? `${validation.warnings.length} aviso${validation.warnings.length > 1 ? "s" : ""}`
                  : "Listo para publicar"}
              </span>
            </div>

            <div style={{ padding: "10px" }}>
              {validation.errors.length === 0 && validation.warnings.length === 0 && (
                <div style={{ fontSize: "12px", color: "var(--muted)", padding: "4px" }}>
                  Todas las validaciones pasaron ✓
                </div>
              )}
              {[...validation.errors, ...validation.warnings].map((issue, i) => (
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
              ))}
            </div>
          </div>

          {/* Char count */}
          <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--faint)", textAlign: "right", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
            {content.length} chars · {content.split("\n").length} líneas
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          paddingTop: "20px",
          borderTop: "1px solid var(--border)",
          marginTop: "20px",
        }}
      >
        <button
          onClick={onBack}
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
          ← Metadatos
        </button>
        <button
          onClick={onNext}
          disabled={!validation.valid}
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            padding: "9px 20px",
            borderRadius: "4px",
            border: "none",
            background: validation.valid ? "var(--accent)" : "var(--faint)",
            color: validation.valid ? "#fff" : "var(--muted)",
            cursor: validation.valid ? "pointer" : "not-allowed",
          }}
        >
          Siguiente → Revisión
        </button>
      </div>
    </div>
  );
}

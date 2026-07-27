"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import matter from "gray-matter";
import { Category } from "@/lib/types";

interface Props {
  content: string;
  onChange: (content: string) => void;
  onNext: () => void;
  onBack: () => void;
  onAcceptanceChange?: (accepted: boolean) => void;
}

const MAX_SKILL_LINES = 300;

export function Step2Editor({ content, onChange, onNext, onBack, onAcceptanceChange }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<unknown>(null);
  const [lineCount, setLineCount] = useState(() => countLines(content));
  const [acceptedResponsibility, setAcceptedResponsibility] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => { if (d.categories) setCategories(d.categories); })
      .catch(() => {});
  }, []);

  const validate = useCallback((text: string) => {
    setLineCount(countLines(text));
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
  const lineLimitExceeded = lineCount > MAX_SKILL_LINES;
  const canContinue = !lineLimitExceeded && acceptedResponsibility;
  const descriptionValue = typeof fm.description === "string" ? fm.description : "";
  const descriptionLength = descriptionValue.length;
  const hasDescription = descriptionLength > 0;
  const descriptionValid = descriptionLength >= 20 && descriptionLength <= 280;

  function handleAcceptanceChange(nextAccepted: boolean) {
    setAcceptedResponsibility(nextAccepted);
    onAcceptanceChange?.(nextAccepted);
  }

  function handleCategoryChange(slug: string) {
    if (!content.startsWith("---\n")) return;
    const end = content.indexOf("\n---", 3);
    if (end === -1) return;
    const head = content.slice(0, end);
    if (!/^  type: .+$/m.test(head)) return;
    onChange(head.replace(/^  type: .+$/m, `  type: ${slug}`) + content.slice(end));
  }

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
          Edita el contenido completo. El unico bloqueo para continuar es superar 300 lineas.
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
              borderRadius: "0 0 10px 10px",
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
                      borderRadius: "8px",
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

        {/* Publication responsibility panel */}
        <div style={{ position: "sticky", top: "72px" }}>
          {/* Category selector */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "14px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "11px",
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: "8px",
              }}
            >
              Categoría del skill
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {categories.map((cat) => {
                const active = fm.metadata?.type === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => handleCategoryChange(cat.slug)}
                    style={{
                      fontFamily: "var(--font-geist), sans-serif",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      padding: "7px 12px",
                      borderRadius: "7px",
                      border: `1px solid ${active ? cat.color : "var(--border)"}`,
                      background: active ? `${cat.color}18` : "var(--bg)",
                      color: active ? cat.color : "var(--muted)",
                      cursor: "pointer",
                      transition: "all .1s",
                    }}
                  >
                    {cat.icon} {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            style={{
              background: "var(--surface)",
              border: `1px solid ${lineLimitExceeded ? "var(--red)" : "var(--green)"}`,
              borderRadius: "10px",
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
                {lineLimitExceeded ? "!" : "OK"}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "11px",
                  color: lineLimitExceeded ? "var(--red)" : "var(--green)",
                }}
              >
                {lineLimitExceeded ? "Limite superado" : "Dentro del limite"}
              </span>
            </div>

            <div style={{ padding: "10px" }}>
              <div
                style={{
                  fontSize: "12px",
                  padding: "8px",
                  borderRadius: "6px",
                  background: lineLimitExceeded ? "rgba(232,80,58,0.08)" : "rgba(46,204,138,0.08)",
                  borderLeft: `2px solid ${lineLimitExceeded ? "var(--red)" : "var(--green)"}`,
                  color: "var(--muted)",
                  lineHeight: 1.45,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "9px",
                    color: lineLimitExceeded ? "var(--red)" : "var(--green)",
                    marginBottom: "4px",
                  }}
                >
                  lineas
                </div>
                {lineCount} de {MAX_SKILL_LINES} lineas permitidas.
                {lineLimitExceeded && " Reduzca el contenido para continuar."}
              </div>

              <div
                style={{
                  fontSize: "12px",
                  padding: "8px",
                  borderRadius: "6px",
                  marginTop: "8px",
                  background: descriptionValid ? "rgba(46,204,138,0.08)" : "rgba(232,80,58,0.08)",
                  borderLeft: `2px solid ${descriptionValid ? "var(--green)" : "var(--red)"}`,
                  color: "var(--muted)",
                  lineHeight: 1.45,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "9px",
                    color: descriptionValid ? "var(--green)" : "var(--red)",
                    marginBottom: "4px",
                  }}
                >
                  descripcion (frontmatter)
                </div>
                {hasDescription
                  ? `${descriptionLength} de 20-280 caracteres permitidos.`
                  : "Sin campo description en el frontmatter."}
                {!descriptionValid && " Si publicas asi, SkillVault reemplaza esta descripcion por un texto generico y el skill queda sin descripcion util en el catalogo/busqueda."}
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  marginTop: "12px",
                  fontSize: "12px",
                  color: "var(--text)",
                  lineHeight: 1.45,
                  cursor: lineLimitExceeded ? "not-allowed" : "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={acceptedResponsibility}
                  disabled={lineLimitExceeded}
                  onChange={(event) => handleAcceptanceChange(event.target.checked)}
                  style={{ marginTop: "2px", accentColor: "var(--accent)" }}
                />
                <span>Acepto continuar con la publicacion</span>
              </label>
            </div>
          </div>

          {/* Char count */}
          <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--faint)", textAlign: "right", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
            {content.length} chars · {lineCount} lineas
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
            fontSize: "13.5px",
            fontWeight: 600,
            padding: "11px 18px",
            borderRadius: "8px",
            border: "1px solid var(--border-subtle)",
            background: "var(--surface)",
            color: "var(--text)",
            cursor: "pointer",
          }}
        >
          ← Metadatos
        </button>
        <button
          onClick={onNext}
          disabled={!canContinue}
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "14px",
            fontWeight: 700,
            padding: "11px 20px",
            borderRadius: "8px",
            border: "none",
            background: canContinue ? "var(--accent)" : "var(--faint)",
            color: canContinue ? "#fff" : "var(--muted)",
            cursor: canContinue ? "pointer" : "not-allowed",
          }}
        >
          Siguiente → Requisitos
        </button>
      </div>
    </div>
  );
}

function countLines(text: string) {
  return text.length === 0 ? 0 : text.split("\n").length;
}

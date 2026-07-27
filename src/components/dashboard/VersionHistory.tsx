"use client";

import { useEffect, useRef, useState } from "react";

interface Version {
  version: string;
  createdAt: number;
}

interface VersionDetail {
  version: string;
  createdAt: number;
  rawContent: string;
  files: Array<{ path: string; fileType: string; content: string }>;
}

interface Props {
  slug: string;
  refreshKey?: number;
}

export function VersionHistory({ slug, refreshKey }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<VersionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const detailRequestId = useRef(0);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/skills/${slug}/versions`)
      .then((r) => r.json())
      .then((d) => setVersions(d.versions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, refreshKey]);

  async function toggleExpand(version: string) {
    const requestId = ++detailRequestId.current;
    if (expanded === version) {
      setExpanded(null);
      setDetail(null);
      return;
    }
    setExpanded(version);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/skills/${slug}/versions/${version}`);
      const data = await res.json();
      if (detailRequestId.current === requestId) {
        setDetail(res.ok ? data : null);
      }
    } catch {
      if (detailRequestId.current === requestId) {
        setDetail(null);
      }
    } finally {
      if (detailRequestId.current === requestId) {
        setDetailLoading(false);
      }
    }
  }

  async function downloadVersion() {
    if (!detail) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const folder = zip.folder(`${slug}-${detail.version}`)!;
    folder.file("SKILL.md", detail.rawContent);
    for (const f of detail.files) {
      folder.file(f.path, f.content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-${detail.version}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return null;
  if (versions.length === 0) return null;

  return (
    <div
      style={{
        marginTop: "24px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 16px",
          background: "var(--raised)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "9px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: "var(--muted)",
          }}
        >
          Historial de versiones
        </span>
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "10px",
            padding: "1px 6px",
            borderRadius: "9px",
            background: "var(--surface)",
            color: "var(--faint)",
          }}
        >
          {versions.length}
        </span>
      </div>

      <div>
        {versions.map((v, i) => (
          <div key={i}>
            <div
              onClick={() => toggleExpand(v.version)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "9px 16px",
                borderBottom: expanded === v.version ? "none" : (i === versions.length - 1 ? "none" : "1px solid var(--border)"),
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {i === 0 && (
                  <span
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "9px",
                      letterSpacing: "0.5px",
                      padding: "1px 5px",
                      borderRadius: "3px",
                      border: "1px solid var(--green)",
                      color: "var(--green)",
                      background: "rgba(46,204,138,0.08)",
                    }}
                  >
                    actual
                  </span>
                )}
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "12px",
                    color: i === 0 ? "var(--text)" : "var(--muted)",
                    fontWeight: i === 0 ? 600 : 400,
                  }}
                >
                  v{v.version}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "11px",
                  color: "var(--faint)",
                }}
              >
                {new Date(v.createdAt * 1000).toLocaleDateString("es", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {expanded === v.version && (
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: i === versions.length - 1 ? "none" : "1px solid var(--border)",
                  background: "var(--bg)",
                }}
              >
                {detailLoading && (
                  <div style={{ fontSize: "11px", color: "var(--muted)" }}>Cargando...</div>
                )}
                {!detailLoading && !detail && (
                  <div style={{ fontSize: "11px", color: "var(--red)" }}>No se pudo cargar esta version.</div>
                )}
                {!detailLoading && detail && (
                  <>
                    <pre
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: "11px",
                        color: "var(--text)",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "4px",
                        padding: "10px",
                        maxHeight: "260px",
                        overflow: "auto",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {detail.rawContent}
                    </pre>
                    {detail.files.length > 0 && (
                      <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "6px" }}>
                        <div>
                          {detail.files.length} archivo{detail.files.length > 1 ? "s" : ""} adjunto{detail.files.length > 1 ? "s" : ""}:
                        </div>
                        <div style={{ marginTop: "3px", maxHeight: "88px", overflowY: "auto", overflowX: "hidden" }}>
                          {detail.files.map((f) => (
                            <div key={f.path} style={{ overflowWrap: "anywhere" }}>{f.path}</div>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={downloadVersion}
                      style={{
                        marginTop: "8px",
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: "11px",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        color: "var(--accent)",
                        cursor: "pointer",
                      }}
                    >
                      Descargar .zip
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

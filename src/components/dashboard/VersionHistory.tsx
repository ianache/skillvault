"use client";

import { useEffect, useState } from "react";

interface Version {
  version: string;
  createdAt: string;
}

interface Props {
  slug: string;
  refreshKey?: number;
}

export function VersionHistory({ slug, refreshKey }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/skills/${slug}/versions`)
      .then((r) => r.json())
      .then((d) => setVersions(d.versions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug, refreshKey]);

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
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "9px 16px",
              borderBottom: i === versions.length - 1 ? "none" : "1px solid var(--border)",
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
              {new Date(v.createdAt).toLocaleDateString("es", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

interface SkillFile {
  id: number;
  path: string;
  fileType: string;
  content: string;
}

interface Props {
  slug: string;
}

const EXT_LANG: Record<string, string> = {
  py: "python", ts: "typescript", js: "javascript", mjs: "javascript",
  md: "markdown", mdx: "markdown", yaml: "yaml", yml: "yaml", json: "json",
  sh: "bash", bash: "bash", txt: "text",
};

function extOf(path: string) {
  return path.split(".").pop()?.toLowerCase() ?? "text";
}

function iconOf(fileType: string, ext: string) {
  if (fileType === "script") {
    if (["py"].includes(ext)) return "🐍";
    if (["ts", "mjs", "cjs"].includes(ext)) return "🔷";
    if (["js"].includes(ext)) return "🟨";
    if (["sh", "bash"].includes(ext)) return "💻";
    return "⚡";
  }
  return "📄";
}

function buildTree(files: SkillFile[]) {
  const dirs: Record<string, SkillFile[]> = {};
  const roots: SkillFile[] = [];
  for (const f of files) {
    const parts = f.path.split("/");
    if (parts.length === 1) {
      roots.push(f);
    } else {
      const dir = parts[0];
      if (!dirs[dir]) dirs[dir] = [];
      dirs[dir].push(f);
    }
  }
  return { dirs, roots };
}

export function FileTree({ slug }: Props) {
  const [files, setFiles] = useState<SkillFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<SkillFile | null>(null);
  const [openDirs, setOpenDirs] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`/api/skills/${slug}/files`)
      .then((r) => r.json())
      .then((d) => {
        setFiles(d.files ?? []);
        // Auto-open all dirs
        const dirs = new Set<string>();
        for (const f of d.files ?? []) {
          const parts = f.path.split("/");
          if (parts.length > 1) dirs.add(parts[0]);
        }
        setOpenDirs(dirs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading || files.length === 0) return null;

  const { dirs, roots } = buildTree(files);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/skills/${slug}/download`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ } finally {
      setDownloading(false);
    }
  }

  function toggleDir(dir: string) {
    setOpenDirs((prev) => {
      const next = new Set(prev);
      if (next.has(dir)) next.delete(dir); else next.add(dir);
      return next;
    });
  }

  return (
    <div style={{ marginBottom: "12px" }}>
      {/* Header with download button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "9px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: "var(--muted)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          Archivos adjuntos
          <span style={{ padding: "1px 6px", borderRadius: "9px", background: "var(--raised)", color: "var(--faint)", fontSize: "10px" }}>
            {files.length}
          </span>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "10px",
            padding: "4px 10px",
            borderRadius: "3px",
            border: "1px solid var(--border)",
            background: "none",
            color: downloading ? "var(--faint)" : "var(--muted)",
            cursor: downloading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          {downloading ? "⏳" : "↓"} Descargar .zip
        </button>
      </div>

      {/* Tree */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        {/* Root files */}
        {roots.map((f) => (
          <FileRow
            key={f.path}
            file={f}
            depth={0}
            isSelected={preview?.id === f.id}
            onClick={() => setPreview(preview?.id === f.id ? null : f)}
          />
        ))}

        {/* Directories */}
        {Object.entries(dirs).map(([dir, dirFiles]) => (
          <div key={dir}>
            <button
              onClick={() => toggleDir(dir)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                background: "var(--raised)",
                border: "none",
                borderTop: "1px solid var(--border)",
                borderBottom: openDirs.has(dir) ? "1px solid var(--border)" : "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: "10px", color: "var(--faint)", transition: "transform .1s", display: "inline-block", transform: openDirs.has(dir) ? "rotate(90deg)" : "none" }}>▶</span>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", color: "var(--muted)" }}>
                {dir === "resources" ? "📁" : dir === "scripts" ? "⚡" : "📁"} {dir}/
              </span>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", color: "var(--faint)", marginLeft: "auto" }}>
                {dirFiles.length}
              </span>
            </button>
            {openDirs.has(dir) && dirFiles.map((f) => (
              <FileRow
                key={f.path}
                file={f}
                depth={1}
                isSelected={preview?.id === f.id}
                onClick={() => setPreview(preview?.id === f.id ? null : f)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Preview panel */}
      {preview && (
        <div
          style={{
            marginTop: "8px",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 14px",
              background: "var(--raised)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", color: "var(--accent)" }}>
              {preview.path}
            </span>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", color: "var(--faint)" }}>
                {EXT_LANG[extOf(preview.path)] ?? extOf(preview.path)} · {preview.content.split("\n").length} líneas
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(preview.content).catch(() => {})}
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "10px",
                  padding: "2px 7px",
                  borderRadius: "3px",
                  border: "1px solid var(--border)",
                  background: "none",
                  color: "var(--muted)",
                  cursor: "pointer",
                }}
              >
                Copiar
              </button>
              <button
                onClick={() => setPreview(null)}
                style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "14px", lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
          </div>
          <pre
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "12px",
              lineHeight: 1.65,
              color: "var(--text)",
              padding: "14px 16px",
              margin: 0,
              overflowX: "auto",
              maxHeight: "340px",
              overflowY: "auto",
              whiteSpace: "pre",
            }}
          >
            {preview.content}
          </pre>
        </div>
      )}
    </div>
  );
}

function FileRow({
  file,
  depth,
  isSelected,
  onClick,
}: {
  file: SkillFile;
  depth: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const ext = extOf(file.path);
  const icon = iconOf(file.fileType, ext);
  const filename = file.path.split("/").pop() ?? file.path;

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "7px",
        padding: `7px 14px 7px ${14 + depth * 16}px`,
        background: isSelected ? "var(--accent-muted)" : "none",
        border: "none",
        borderTop: "1px solid var(--border)",
        cursor: "pointer",
        textAlign: "left",
        transition: "background .1s",
      }}
      onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--raised)"; }}
      onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "none"; }}
    >
      <span style={{ fontSize: "12px" }}>{icon}</span>
      <span
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "11px",
          color: isSelected ? "var(--accent)" : file.fileType === "script" ? "var(--amber)" : "var(--muted)",
          flex: 1,
        }}
      >
        {filename}
      </span>
      <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", color: "var(--faint)" }}>
        {file.content.split("\n").length}L
      </span>
    </button>
  );
}

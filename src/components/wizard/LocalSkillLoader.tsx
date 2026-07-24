"use client";

import { useRef, useState } from "react";

export interface LoadedFile {
  path: string;       // relative path inside the skill folder, e.g. "resources/ref.md"
  fileType: "resource" | "script";
  content: string;
}

export interface LoadedSkill {
  skillMd: string;          // raw SKILL.md content
  files: LoadedFile[];      // adjuntos
  sourceLabel: string;      // "carpeta: mi-skill" | "archivo: mi-skill.zip"
}

interface Props {
  onLoaded: (skill: LoadedSkill) => void;
  onSkip: () => void;
}

const RESOURCE_EXTS = [".md", ".mdx", ".txt", ".yaml", ".yml", ".json"];
const SCRIPT_EXTS   = [".py", ".js", ".ts", ".mjs", ".cjs", ".sh", ".bash"];

function classifyExt(filename: string): "resource" | "script" | null {
  const lower = filename.toLowerCase();
  if (RESOURCE_EXTS.some((e) => lower.endsWith(e))) return "resource";
  if (SCRIPT_EXTS.some((e) => lower.endsWith(e))) return "script";
  return null;
}

function relativePath(file: File, rootName: string): string {
  const wp = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  if (wp) {
    const parts = wp.split("/");
    return parts.slice(1).join("/");
  }
  return file.name;
}

async function readText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function processFiles(fileList: FileList | File[]): Promise<LoadedSkill | null> {
  const files = Array.from(fileList);

  const skillFile =
    files.find((f) => {
      const rel = relativePath(f, "");
      return rel.toLowerCase() === "skill.md" || f.name.toLowerCase() === "skill.md";
    }) ??
    files.find((f) => f.name.toLowerCase() === "skill.md");

  if (!skillFile) return null;

  const skillMd = await readText(skillFile);
  const sourceLabel = (skillFile as File & { webkitRelativePath?: string }).webkitRelativePath
    ? `carpeta: ${(skillFile as File & { webkitRelativePath?: string }).webkitRelativePath!.split("/")[0]}`
    : `archivo: ${skillFile.name}`;

  const loaded: LoadedFile[] = [];
  for (const f of files) {
    if (f === skillFile) continue;
    const rel = relativePath(f, "");
    const type = classifyExt(f.name);
    if (!type) continue;
    const content = await readText(f);
    loaded.push({ path: rel, fileType: type, content });
  }

  return { skillMd, files: loaded, sourceLabel };
}

async function processZip(zipFile: File): Promise<LoadedSkill | null> {
  let JSZip: typeof import("jszip");
  try {
    JSZip = (await import("jszip")) as unknown as typeof import("jszip");
  } catch {
    throw new Error("jszip no disponible. Instala con: pnpm add jszip --ignore-scripts");
  }

  const zip = await (JSZip as unknown as { loadAsync: (f: File) => Promise<{ files: Record<string, { name: string; dir: boolean; async: (t: string) => Promise<string> }> }> }).loadAsync(zipFile);
  const entries = Object.values(zip.files).filter((f) => !f.dir);

  const skillEntry = entries.find((f) => f.name.toLowerCase().endsWith("skill.md") && !f.name.toLowerCase().endsWith("/skill.md") === false || f.name.toLowerCase() === "skill.md" || /\/skill\.md$/i.test(f.name));
  if (!skillEntry) return null;

  const skillMd = await skillEntry.async("text");
  const rootPrefix = skillEntry.name.includes("/") ? skillEntry.name.split("/")[0] + "/" : "";
  const sourceLabel = `zip: ${zipFile.name}`;

  const loaded: LoadedFile[] = [];
  for (const entry of entries) {
    if (entry === skillEntry) continue;
    const type = classifyExt(entry.name);
    if (!type) continue;
    const content = await entry.async("text");
    const rel = entry.name.startsWith(rootPrefix) ? entry.name.slice(rootPrefix.length) : entry.name;
    loaded.push({ path: rel, fileType: type, content });
  }

  return { skillMd, files: loaded, sourceLabel };
}

export function LocalSkillLoader({ onLoaded, onSkip }: Props) {
  const folderRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ label: string; fileCount: number } | null>(null);
  const [pending, setPending] = useState<LoadedSkill | null>(null);

  async function handleFolder(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await processFiles(files);
      if (!result) {
        setError("No se encontró SKILL.md en la carpeta seleccionada.");
        return;
      }
      setPending(result);
      setPreview({ label: result.sourceLabel, fileCount: result.files.length });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  async function handleZip(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await processZip(file);
      if (!result) {
        setError("No se encontró SKILL.md dentro del ZIP.");
        return;
      }
      setPending(result);
      setPreview({ label: result.sourceLabel, fileCount: result.files.length });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      let result: LoadedSkill | null = null;
      if (files.length === 1 && files[0].name.toLowerCase().endsWith(".zip")) {
        result = await processZip(files[0]);
        if (!result) {
          setError("No se encontró SKILL.md dentro del ZIP.");
          return;
        }
      } else {
        result = await processFiles(files);
        if (!result) {
          setError("No se encontró SKILL.md en los archivos arrastrados.");
          return;
        }
      }
      setPending(result);
      setPreview({ label: result.sourceLabel, fileCount: result.files.length });
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  function confirmLoad() {
    if (pending) onLoaded(pending);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={handleDrop}
      style={{
        border: isDragging ? "2px dashed var(--accent)" : "1px solid transparent",
        borderRadius: "12px",
        padding: "8px",
        transition: "all 0.2s ease",
        background: isDragging ? "rgba(232, 139, 58, 0.03)" : "transparent",
      }}
    >
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "6px",
          }}
        >
          Cargar skill local
        </h1>
        <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
          Selecciona o arrastra una carpeta con tu <code style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", color: "var(--accent)" }}>SKILL.md</code> o un archivo <code style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", color: "var(--accent)" }}>.zip</code> con la estructura del skill.
        </p>
      </div>

      {/* Terminal Structure Card */}
      <div
        style={{
          background: "var(--raised)",
          border: "1px solid var(--border)",
          borderRadius: "10px",
          padding: "20px 24px",
          marginBottom: "24px",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "12px",
          color: "var(--muted)",
          lineHeight: 1.8,
        }}
      >
        <div style={{ color: "var(--faint)", marginBottom: "6px", fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase" }}>
          Estructura esperada
        </div>
        <div><span style={{ color: "var(--accent)" }}>mi-skill/</span></div>
        <div>&nbsp;&nbsp;<span style={{ color: "var(--green)", fontWeight: 600 }}>SKILL.md</span> <span style={{ color: "var(--faint)" }}>← requerido</span></div>
        <div>&nbsp;&nbsp;resources/</div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;reference.md</div>
        <div>&nbsp;&nbsp;scripts/</div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;process.py</div>
      </div>

      {/* Upload Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "24px" }}>
        <UploadCard
          icon={
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#cfa554">
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
            </svg>
          }
          label="Seleccionar carpeta"
          hint="Sube toda la carpeta del skill"
          onClick={() => folderRef.current?.click()}
          loading={loading}
        />
        <UploadCard
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8H3M6 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2M4 8v12a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V8M10 12h4" />
            </svg>
          }
          label="Subir archivo .zip"
          hint="ZIP con estructura mi-skill/SKILL.md"
          onClick={() => zipRef.current?.click()}
          loading={loading}
        />
      </div>

      {/* Hidden inputs */}
      <input
        ref={folderRef}
        type="file"
        // @ts-expect-error webkitdirectory is non-standard
        webkitdirectory=""
        multiple
        style={{ display: "none" }}
        onChange={handleFolder}
      />
      <input
        ref={zipRef}
        type="file"
        accept=".zip"
        style={{ display: "none" }}
        onChange={handleZip}
      />

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(232,80,58,0.08)",
            border: "1px solid var(--red)",
            borderRadius: "8px",
            fontSize: "13px",
            color: "var(--red)",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {/* Preview Card */}
      {preview && pending && (
        <div
          style={{
            background: "rgba(16,185,129,0.08)",
            backdropFilter: "blur(8px)",
            border: "1px solid var(--green)",
            borderRadius: "10px",
            padding: "20px 22px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ fontSize: "16px", color: "var(--green)" }}>✓</span>
            <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12.5px", fontWeight: 600, color: "var(--green)" }}>
              {preview.label}
            </span>
          </div>
          <div style={{ display: "flex", gap: "20px", fontSize: "12px", color: "var(--muted)", marginBottom: "12px" }}>
            <span>SKILL.md encontrado</span>
            {preview.fileCount > 0 && (
              <span>{preview.fileCount} archivo{preview.fileCount > 1 ? "s" : ""} adjunto{preview.fileCount > 1 ? "s" : ""}</span>
            )}
          </div>
          {/* File list */}
          {pending.files.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "12px" }}>
              {pending.files.map((f) => (
                <span
                  key={f.path}
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "10px",
                    padding: "2px 7px",
                    borderRadius: "3px",
                    border: `1px solid ${f.fileType === "script" ? "var(--amber)" : "var(--border)"}`,
                    color: f.fileType === "script" ? "var(--amber)" : "var(--muted)",
                    background: f.fileType === "script" ? "rgba(232,139,58,0.08)" : "none",
                  }}
                >
                  {f.fileType === "script" ? "⚡" : "📄"} {f.path}
                </span>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={confirmLoad}
            style={{
              fontFamily: "var(--font-geist), sans-serif",
              fontSize: "13.5px",
              fontWeight: 700,
              padding: "11px 22px",
              borderRadius: "8px",
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Cargar en el wizard →
          </button>
        </div>
      )}

      {/* Skip button */}
      <div style={{ textAlign: "center", paddingTop: "8px" }}>
        <button
          type="button"
          onClick={onSkip}
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "13px",
            color: "var(--muted)",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          Empezar desde cero sin cargar archivos
        </button>
      </div>
    </div>
  );
}

function UploadCard({
  icon,
  label,
  hint,
  onClick,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      style={{
        background: "var(--surface)",
        border: "1.5px dashed var(--border)",
        borderRadius: "10px",
        padding: "36px 20px",
        textAlign: "center",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "border-color 0.15s ease, background 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
      }}
      onMouseEnter={(e) => {
        if (loading) return;
        const el = e.currentTarget;
        el.style.borderColor = "var(--accent)";
        el.style.background = "var(--raised)";
        el.style.transform = "translateY(-2px)";
        el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
      }}
      onMouseLeave={(e) => {
        if (loading) return;
        const el = e.currentTarget;
        el.style.borderColor = "var(--border)";
        el.style.background = "var(--surface)";
        el.style.transform = "none";
        el.style.boxShadow = "none";
      }}
    >
      <div style={{ width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", opacity: loading ? 0.4 : 1 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: "14.5px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
          {label}
        </div>
        <div style={{ fontSize: "12.5px", color: "var(--muted)" }}>{hint}</div>
      </div>
    </button>
  );
}

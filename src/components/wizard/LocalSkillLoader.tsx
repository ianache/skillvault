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
  // webkitRelativePath = "root/resources/file.md" — strip the root prefix
  const wp = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  if (wp) {
    const parts = wp.split("/");
    return parts.slice(1).join("/"); // drop root folder name
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

  // Find SKILL.md (case-insensitive, at any depth but prefer root)
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
  // Dynamically import JSZip only when needed
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

  function confirmLoad() {
    if (pending) onLoaded(pending);
  }

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "22px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "6px",
          }}
        >
          Cargar skill local
        </h1>
        <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6 }}>
          Selecciona una carpeta con tu SKILL.md o un archivo <code style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", color: "var(--accent)" }}>.zip</code> con la estructura del skill.
          Los archivos en <code style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", color: "var(--accent)" }}>resources/</code> y <code style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", color: "var(--accent)" }}>scripts/</code> se suben junto con el skill.
        </p>
      </div>

      {/* Estructura esperada */}
      <div
        style={{
          background: "var(--raised)",
          border: "1px solid var(--border)",
          borderRadius: "4px",
          padding: "14px 16px",
          marginBottom: "24px",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "12px",
          color: "var(--muted)",
          lineHeight: 1.8,
        }}
      >
        <div style={{ color: "var(--faint)", marginBottom: "4px", fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase" }}>Estructura esperada</div>
        <div><span style={{ color: "var(--accent)" }}>mi-skill/</span></div>
        <div>&nbsp;&nbsp;<span style={{ color: "var(--green)" }}>SKILL.md</span> <span style={{ color: "var(--faint)" }}>← requerido</span></div>
        <div>&nbsp;&nbsp;resources/</div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;reference.md</div>
        <div>&nbsp;&nbsp;scripts/</div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;process.py</div>
        <div>&nbsp;&nbsp;&nbsp;&nbsp;transform.ts</div>
      </div>

      {/* Upload options */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        {/* Folder */}
        <UploadCard
          icon="📁"
          label="Seleccionar carpeta"
          hint="Sube toda la carpeta del skill"
          onClick={() => folderRef.current?.click()}
          loading={loading}
        />
        {/* ZIP */}
        <UploadCard
          icon="🗜"
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
            borderRadius: "4px",
            fontSize: "13px",
            color: "var(--red)",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {/* Preview of loaded skill */}
      {preview && pending && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--green)",
            borderRadius: "4px",
            padding: "14px 16px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ fontSize: "16px" }}>✓</span>
            <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", color: "var(--green)" }}>
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
            onClick={confirmLoad}
            style={{
              fontFamily: "var(--font-geist), sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              padding: "8px 20px",
              borderRadius: "4px",
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

      {/* Skip */}
      <div style={{ textAlign: "center", paddingTop: "8px" }}>
        <button
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
  icon: string;
  label: string;
  hint: string;
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        background: "var(--surface)",
        border: "2px dashed var(--border)",
        borderRadius: "6px",
        padding: "24px 16px",
        textAlign: "center",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "border-color .12s, background .12s",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "var(--accent)";
        el.style.background = "var(--raised)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "var(--border)";
        el.style.background = "var(--surface)";
      }}
    >
      <span style={{ fontSize: "28px" }}>{loading ? "⏳" : icon}</span>
      <div>
        <div style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>
          {label}
        </div>
        <div style={{ fontSize: "11px", color: "var(--muted)" }}>{hint}</div>
      </div>
    </button>
  );
}

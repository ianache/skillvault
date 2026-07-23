"use client";

import { useState } from "react";
import matter from "gray-matter";

export type ReqType = "env_var" | "executable" | "runtime" | "service" | "directory" | "file" | "secret";

export interface ConfigRequirement {
  key: string;
  type: ReqType;
  label: string;
  description?: string;
  optional: boolean;
  // type-specific
  variableName?: string;
  executableName?: string;
  runtime?: string;
  versionConstraint?: string;
  probeType?: "tcp" | "http";
  host?: string;
  port?: number;
  path?: string;
  secretKey?: string;
}

const TYPE_META: Record<ReqType, { iconPath: string; label: string; color: string }> = {
  env_var:    { iconPath: "M4 6h16M4 12h16M4 18h7",                                                              label: "Variable de entorno", color: "#3B6EFF" },
  executable: { iconPath: "M5 3l14 9-14 9V3z",                                                                   label: "Ejecutable",          color: "#E88B3A" },
  runtime:    { iconPath: "M13 2L3 14h7l-1 8 10-12h-7l1-8z",                                                     label: "Runtime",             color: "#0f9488" },
  service:    { iconPath: "M4 12h4l3-9 4 18 3-9h4",                                                              label: "Servicio/Endpoint",   color: "#4AB8E8" },
  directory:  { iconPath: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z",         label: "Directorio",          color: "#a9772e" },
  file:       { iconPath: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",                 label: "Archivo",             color: "#5c6270" },
  secret:     { iconPath: "M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 9V7a5 5 0 0 0-10 0v2M5 9h14v11H5z",            label: "Secreto",             color: "#c46a3f" },
};

function TypeIcon({ path, color, size = 13 }: { path: string; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

const RUNTIME_OPTIONS = ["node", "python", "java", "dotnet", "ruby", "go"];

const EMPTY_REQ: ConfigRequirement = {
  key: "", type: "env_var", label: "", description: "", optional: false,
};

interface Props {
  content: string;
  onChange: (content: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepRequirements({ content, onChange, onNext, onBack }: Props) {
  const [requirements, setRequirements] = useState<ConfigRequirement[]>(() => {
    try {
      const parsed = matter(content);
      return (parsed.data.config_requirements as ConfigRequirement[]) ?? [];
    } catch {
      return [];
    }
  });

  const [adding, setAdding] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [form, setForm] = useState<ConfigRequirement>({ ...EMPTY_REQ });
  const [formError, setFormError] = useState<string | null>(null);

  function openAdd() {
    setForm({ ...EMPTY_REQ });
    setFormError(null);
    setEditIdx(null);
    setAdding(true);
  }

  function openEdit(i: number) {
    setForm({ ...requirements[i] });
    setFormError(null);
    setEditIdx(i);
    setAdding(true);
  }

  function setField<K extends keyof ConfigRequirement>(k: K, v: ConfigRequirement[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function validateForm(): string | null {
    if (!form.key.trim()) return "La clave (key) es requerida";
    if (!/^[a-z0-9_-]+$/.test(form.key)) return "Clave: solo minúsculas, números, guiones y underscores";
    if (!form.label.trim()) return "El label es requerido";
    if (editIdx === null && requirements.some((r) => r.key === form.key)) return `Ya existe un requisito con key "${form.key}"`;
    if (form.type === "env_var" && !form.variableName?.trim()) return "variableName es requerido";
    if (form.type === "executable" && !form.executableName?.trim()) return "executableName es requerido";
    if (form.type === "runtime" && !form.runtime) return "Selecciona el runtime";
    if (form.type === "service" && (!form.host?.trim() || !form.port)) return "host y port son requeridos";
    if (form.type === "directory" && !form.path?.trim()) return "path es requerido";
    if (form.type === "file" && !form.path?.trim()) return "path es requerido";
    if (form.type === "secret" && !form.secretKey?.trim()) return "secretKey es requerido";
    return null;
  }

  function saveReq() {
    const err = validateForm();
    if (err) { setFormError(err); return; }
    const cleaned = cleanReq(form);
    const next = editIdx !== null
      ? requirements.map((r, i) => (i === editIdx ? cleaned : r))
      : [...requirements, cleaned];
    setRequirements(next);
    setAdding(false);
  }

  function removeReq(i: number) {
    setRequirements(requirements.filter((_, idx) => idx !== i));
  }

  function cleanReq(r: ConfigRequirement): ConfigRequirement {
    const base = { key: r.key, type: r.type, label: r.label, description: r.description, optional: r.optional };
    switch (r.type) {
      case "env_var":    return { ...base, variableName: r.variableName };
      case "executable": return { ...base, executableName: r.executableName, versionConstraint: r.versionConstraint };
      case "runtime":    return { ...base, runtime: r.runtime, versionConstraint: r.versionConstraint };
      case "service":    return { ...base, probeType: r.probeType ?? "tcp", host: r.host, port: r.port };
      case "directory":  return { ...base, path: r.path };
      case "file":       return { ...base, path: r.path };
      case "secret":     return { ...base, secretKey: r.secretKey };
    }
  }

  function handleNext() {
    // Inject config_requirements into frontmatter
    try {
      const parsed = matter(content);
      parsed.data.config_requirements = requirements;
      // Rebuild frontmatter block manually
      const yamlLines = buildYamlLines(parsed.data);
      const newContent = `---\n${yamlLines}\n---\n${parsed.content}`;
      onChange(newContent);
    } catch {
      // fallback: inject block before closing ---
      onChange(content);
    }
    onNext();
  }

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: "22px", fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>
          Paso 3 — Requisitos de configuración
        </h1>
        <p style={{ fontSize: "13px", color: "var(--muted)" }}>
          Declara qué necesita este skill para ejecutarse: variables de entorno, ejecutables, runtimes, servicios, secretos, etc.
          Esta información guía al usuario durante la instalación.
        </p>
      </div>

      {/* Type legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
        {(Object.keys(TYPE_META) as ReqType[]).map((t) => {
          const m = TYPE_META[t];
          return (
            <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", padding: "3px 9px", borderRadius: "6px", border: `1px solid ${m.color}40`, color: m.color, background: `${m.color}10` }}>
              <TypeIcon path={m.iconPath} color={m.color} size={11} /> {m.label}
            </span>
          );
        })}
      </div>

      {/* Requirements list */}
      {requirements.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
          {requirements.map((req, i) => {
            const m = TYPE_META[req.type];
            return (
              <div key={req.key} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${m.color}`, borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ flexShrink: 0, marginTop: "1px" }}><TypeIcon path={m.iconPath} color={m.color} size={14} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", fontWeight: 700, color: "var(--text)" }}>{req.key}</span>
                    <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", padding: "1px 5px", borderRadius: "3px", border: `1px solid ${m.color}50`, color: m.color }}>{req.type}</span>
                    {req.optional && <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", color: "var(--faint)", border: "1px solid var(--border)", padding: "1px 5px", borderRadius: "3px" }}>opcional</span>}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>{req.label}</div>
                  {req.description && <div style={{ fontSize: "11px", color: "var(--faint)", marginTop: "2px" }}>{req.description}</div>}
                  <ReqSummary req={req} />
                </div>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button onClick={() => openEdit(i)} style={iconBtn}>✎</button>
                  <button onClick={() => removeReq(i)} style={{ ...iconBtn, color: "var(--red)" }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {requirements.length === 0 && !adding && (
        <div style={{ textAlign: "center", padding: "44px 24px", background: "var(--surface)", border: "1px dashed var(--border-subtle)", borderRadius: "10px", marginBottom: "16px" }}>
          <div style={{ fontSize: "28px", marginBottom: "8px" }}>◷</div>
          <div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "4px" }}>Sin requisitos declarados</div>
          <div style={{ fontSize: "12px", color: "var(--faint)" }}>Los skills sin requisitos se instalan directamente. Añade uno si tu skill necesita configuración previa.</div>
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--accent)", borderRadius: "10px", padding: "18px", marginBottom: "16px" }}>
          <div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "14px" }}>
            {editIdx !== null ? "Editar requisito" : "Nuevo requisito"}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {/* Key */}
            <FL label="Clave (key)" required hint="snake_case, único">
              <input value={form.key} onChange={(e) => setField("key", e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                placeholder="db_password" style={iStyle} onFocus={fo} onBlur={bl} />
            </FL>

            {/* Type */}
            <FL label="Tipo" required>
              <select value={form.type} onChange={(e) => setField("type", e.target.value as ReqType)} style={iStyle}>
                {(Object.keys(TYPE_META) as ReqType[]).map((t) => (
                  <option key={t} value={t}>{TYPE_META[t].label}</option>
                ))}
              </select>
            </FL>

            {/* Label */}
            <FL label="Label" required hint="Nombre legible">
              <input value={form.label} onChange={(e) => setField("label", e.target.value)}
                placeholder="Contraseña de base de datos" style={iStyle} onFocus={fo} onBlur={bl} />
            </FL>

            {/* Optional */}
            <FL label="Obligatorio / Opcional">
              <div style={{ display: "flex", gap: "8px", paddingTop: "2px" }}>
                {([false, true] as const).map((v) => (
                  <button key={String(v)} type="button" onClick={() => setField("optional", v)}
                    style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", padding: "7px 15px", borderRadius: "7px", border: `1px solid ${form.optional === v ? "var(--accent)" : "var(--border)"}`, background: form.optional === v ? "var(--accent-muted)" : "none", color: form.optional === v ? "var(--accent)" : "var(--muted)", cursor: "pointer" }}>
                    {v ? "Opcional" : "Obligatorio"}
                  </button>
                ))}
              </div>
            </FL>
          </div>

          {/* Description */}
          <div style={{ marginTop: "10px" }}>
            <FL label="Descripción" hint="Ayuda al usuario a entender cómo cumplir este requisito">
              <input value={form.description ?? ""} onChange={(e) => setField("description", e.target.value)}
                placeholder="p.ej. Contraseña del servidor PostgreSQL de producción" style={iStyle} onFocus={fo} onBlur={bl} />
            </FL>
          </div>

          {/* Type-specific fields */}
          <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
            <TypeFields form={form} setField={setField} />
          </div>

          {formError && (
            <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--red)", padding: "8px 10px", background: "rgba(232,80,58,.08)", borderRadius: "3px", borderLeft: "2px solid var(--red)" }}>
              {formError}
            </div>
          )}

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "14px" }}>
            <button onClick={() => setAdding(false)} style={{ fontSize: "12.5px", padding: "8px 16px", borderRadius: "7px", border: "1px solid var(--border-subtle)", background: "var(--surface)", color: "var(--text)", cursor: "pointer" }}>
              Cancelar
            </button>
            <button onClick={saveReq} style={{ fontSize: "12.5px", fontWeight: 700, padding: "8px 20px", borderRadius: "7px", border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer" }}>
              {editIdx !== null ? "Guardar cambios" : "Añadir requisito"}
            </button>
          </div>
        </div>
      )}

      {!adding && (
        <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "var(--accent)", background: "var(--accent-muted)", border: "1px solid var(--accent)", borderRadius: "8px", padding: "10px 18px", cursor: "pointer", marginBottom: "24px" }}>
          + Añadir requisito
        </button>
      )}

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
        <button onClick={onBack} style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: "13.5px", fontWeight: 600, padding: "11px 18px", borderRadius: "8px", border: "1px solid var(--border-subtle)", background: "var(--surface)", color: "var(--text)", cursor: "pointer" }}>
          ← Editor
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {requirements.length > 0 && (
            <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", color: "var(--muted)" }}>
              {requirements.length} requisito{requirements.length !== 1 ? "s" : ""} · {requirements.filter((r) => !r.optional).length} obligatorio{requirements.filter((r) => !r.optional).length !== 1 ? "s" : ""}
            </span>
          )}
          <button onClick={handleNext} style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: "14px", fontWeight: 700, padding: "11px 20px", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer" }}>
            Siguiente → Revisión
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Type-specific fields ──────────────────────────────────────────

function TypeFields({ form, setField }: { form: ConfigRequirement; setField: <K extends keyof ConfigRequirement>(k: K, v: ConfigRequirement[K]) => void }) {
  switch (form.type) {
    case "env_var":
      return (
        <FL label="Nombre de variable" required hint="p.ej. DATABASE_URL">
          <input value={form.variableName ?? ""} onChange={(e) => setField("variableName", e.target.value)}
            placeholder="DATABASE_URL" style={iStyle} onFocus={fo} onBlur={bl} />
        </FL>
      );
    case "executable":
      return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <FL label="Nombre del ejecutable" required hint="p.ej. docker">
            <input value={form.executableName ?? ""} onChange={(e) => setField("executableName", e.target.value)}
              placeholder="docker" style={iStyle} onFocus={fo} onBlur={bl} />
          </FL>
          <FL label="Versión mínima" hint="SemVer constraint">
            <input value={form.versionConstraint ?? ""} onChange={(e) => setField("versionConstraint", e.target.value)}
              placeholder=">=20.0.0" style={iStyle} onFocus={fo} onBlur={bl} />
          </FL>
        </div>
      );
    case "runtime":
      return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <FL label="Runtime" required>
            <select value={form.runtime ?? ""} onChange={(e) => setField("runtime", e.target.value)} style={iStyle}>
              <option value="">Seleccionar…</option>
              {RUNTIME_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </FL>
          <FL label="Versión mínima" hint="SemVer constraint">
            <input value={form.versionConstraint ?? ""} onChange={(e) => setField("versionConstraint", e.target.value)}
              placeholder=">=18.0.0" style={iStyle} onFocus={fo} onBlur={bl} />
          </FL>
        </div>
      );
    case "service":
      return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 100px", gap: "12px" }}>
          <FL label="Tipo de probe">
            <select value={form.probeType ?? "tcp"} onChange={(e) => setField("probeType", e.target.value as "tcp" | "http")} style={iStyle}>
              <option value="tcp">TCP</option>
              <option value="http">HTTP</option>
            </select>
          </FL>
          <FL label="Host" required>
            <input value={form.host ?? ""} onChange={(e) => setField("host", e.target.value)}
              placeholder="localhost" style={iStyle} onFocus={fo} onBlur={bl} />
          </FL>
          <FL label="Puerto" required>
            <input type="number" value={form.port ?? ""} onChange={(e) => setField("port", parseInt(e.target.value) || undefined)}
              placeholder="5432" style={iStyle} onFocus={fo} onBlur={bl} />
          </FL>
        </div>
      );
    case "directory":
    case "file":
      return (
        <FL label="Ruta" required hint="Ruta absoluta o relativa al home">
          <input value={form.path ?? ""} onChange={(e) => setField("path", e.target.value)}
            placeholder={form.type === "directory" ? "/data/models" : "/etc/app/config.yaml"} style={iStyle} onFocus={fo} onBlur={bl} />
        </FL>
      );
    case "secret":
      return (
        <FL label="Secret key" required hint="Identificador en el almacén de secretos">
          <input value={form.secretKey ?? ""} onChange={(e) => setField("secretKey", e.target.value)}
            placeholder="myapp/db/password" style={iStyle} onFocus={fo} onBlur={bl} />
        </FL>
      );
  }
}

function ReqSummary({ req }: { req: ConfigRequirement }) {
  let detail = "";
  switch (req.type) {
    case "env_var":    detail = `$${req.variableName}`; break;
    case "executable": detail = req.versionConstraint ? `${req.executableName} ${req.versionConstraint}` : req.executableName ?? ""; break;
    case "runtime":    detail = req.versionConstraint ? `${req.runtime} ${req.versionConstraint}` : req.runtime ?? ""; break;
    case "service":    detail = `${req.probeType?.toUpperCase()} ${req.host}:${req.port}`; break;
    case "directory":
    case "file":       detail = req.path ?? ""; break;
    case "secret":     detail = req.secretKey ?? ""; break;
  }
  if (!detail) return null;
  return (
    <div style={{ marginTop: "4px", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", color: "var(--faint)" }}>
      {detail}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────

function FL({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "5px" }}>
        <label style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", letterSpacing: "0.6px", textTransform: "uppercase", color: "var(--muted)" }}>{label}</label>
        {required && <span style={{ color: "var(--red)", fontSize: "10px" }}>*</span>}
        {hint && <span style={{ fontSize: "10px", color: "var(--faint)", marginLeft: "auto" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const iStyle: React.CSSProperties = {
  width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
  borderRadius: "7px", padding: "8px 11px", fontSize: "12.5px", color: "var(--text)",
  outline: "none", fontFamily: "inherit", transition: "border-color .12s",
};
const iconBtn: React.CSSProperties = {
  background: "none", border: "1px solid var(--border)", borderRadius: "6px",
  padding: "3px 7px", fontSize: "11px", cursor: "pointer", color: "var(--muted)",
};
function fo(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) { e.target.style.borderColor = "var(--accent)"; }
function bl(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) { e.target.style.borderColor = "var(--border)"; }

// Simple YAML serializer for frontmatter (gray-matter stringify isn't always available)
function buildYamlLines(data: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (v === null || v === undefined) continue;
    if (k === "config_requirements") {
      if (!Array.isArray(v) || v.length === 0) {
        lines.push("config_requirements: []");
      } else {
        lines.push("config_requirements:");
        for (const req of v as ConfigRequirement[]) {
          lines.push(`  - key: ${req.key}`);
          lines.push(`    type: ${req.type}`);
          lines.push(`    label: "${req.label.replace(/"/g, '\\"')}"`);
          if (req.description) lines.push(`    description: "${req.description.replace(/"/g, '\\"')}"`);
          lines.push(`    optional: ${req.optional}`);
          if (req.variableName) lines.push(`    variableName: ${req.variableName}`);
          if (req.executableName) lines.push(`    executableName: ${req.executableName}`);
          if (req.runtime) lines.push(`    runtime: ${req.runtime}`);
          if (req.versionConstraint) lines.push(`    versionConstraint: "${req.versionConstraint}"`);
          if (req.probeType) lines.push(`    probeType: ${req.probeType}`);
          if (req.host) lines.push(`    host: ${req.host}`);
          if (req.port) lines.push(`    port: ${req.port}`);
          if (req.path) lines.push(`    path: "${req.path.replace(/"/g, '\\"')}"`);
          if (req.secretKey) lines.push(`    secretKey: ${req.secretKey}`);
        }
      }
      continue;
    }
    if (k === "metadata" && typeof v === "object") {
      lines.push("metadata:");
      for (const [mk, mv] of Object.entries(v as Record<string, unknown>)) {
        if (Array.isArray(mv)) {
          lines.push(`  ${mk}:`);
          for (const item of mv) lines.push(`    - ${item}`);
        } else if (mv !== undefined && mv !== null) {
          lines.push(`  ${mk}: ${mv}`);
        }
      }
      continue;
    }
    if (Array.isArray(v)) {
      if (v.length === 0) { lines.push(`${k}: []`); continue; }
      lines.push(`${k}:`);
      for (const item of v) lines.push(`  - ${item}`);
      continue;
    }
    if (typeof v === "string") {
      lines.push(`${k}: ${v.includes(":") || v.includes('"') ? `"${v.replace(/"/g, '\\"')}"` : v}`);
    } else {
      lines.push(`${k}: ${v}`);
    }
  }
  return lines.join("\n");
}

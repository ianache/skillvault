"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import type { PackageDraftVersion, PackageSummary } from "@/lib/packages/types";

type Skill = { id: number; name: string; slug: string; version: string; status: string; description: string; compatibility?: string[] };

export function PackageEditorClient({ packageInfo, isNew = false, initialDraft = null }: { packageInfo: PackageSummary; isNew?: boolean; initialDraft?: PackageDraftVersion | null }) {
  const router = useRouter();
  const [name, setName] = useState(packageInfo.name);
  const [description, setDescription] = useState(packageInfo.description);
  const [role, setRole] = useState(packageInfo.role);
  const [version, setVersion] = useState(initialDraft?.version ?? "1.0.0");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillQuery, setSkillQuery] = useState("");
  const [selected, setSelected] = useState<Record<number, "latest" | "pinned">>(() => Object.fromEntries((initialDraft?.items ?? []).map((item) => [item.skillId, item.versionPolicy])));
  const [versionCreated, setVersionCreated] = useState(initialDraft?.releaseStatus === "draft");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetch("/api/skills?sort=az").then((response) => response.json()).then((body) => setSkills(body.skills ?? [])).catch(() => setError("No se pudieron cargar los Skills.")); }, []);

  const selectedSkills = useMemo(() => Object.keys(selected).map(Number).map((id) => skills.find((skill) => skill.id === id)).filter((skill): skill is Skill => Boolean(skill)), [selected, skills]);
  const availableSkills = useMemo(() => {
    const query = skillQuery.trim().toLowerCase();
    return skills.filter((skill) => !(skill.id in selected) && (!query || `${skill.name} ${skill.slug} ${skill.description}`.toLowerCase().includes(query)));
  }, [skillQuery, selected, skills]);

  function packageSlug() {
    return (name.trim() || "nuevo-paquete").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function addSkill(skillId: number) { setSelected((current) => ({ ...current, [skillId]: "latest" })); }
  function removeSkill(skillId: number) { setSelected((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== String(skillId)))); }
  function setPolicy(skillId: number, policy: "latest" | "pinned") { setSelected((current) => ({ ...current, [skillId]: policy })); }
  function moveSkill(skillId: number, direction: -1 | 1) {
    setSelected((current) => {
      const ids = Object.keys(current).map(Number);
      const index = ids.indexOf(skillId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= ids.length) return current;
      [ids[index], ids[nextIndex]] = [ids[nextIndex], ids[index]];
      return Object.fromEntries(ids.map((id) => [id, current[id]]));
    });
  }

  async function saveDraft() {
    setError(null);
    const response = isNew ? await fetch("/api/packages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: packageSlug(), name, description, role }) }) : await fetch(`/api/packages/${packageInfo.slug}`, { method: "PATCH", headers: { "content-type": "application/json", "if-match": packageInfo.currentVersion ?? "draft" }, body: JSON.stringify({ name, description, role }) });
    const body = await response.json();
    if (!response.ok) { setError(body.error ?? "No se pudo guardar el borrador"); return; }
    setMessage("Borrador guardado.");
    if (isNew) router.replace(`/packages/${body.package.slug}/edit`);
  }

  async function createVersion() {
    setError(null);
    const items = Object.entries(selected).map(([skillId, versionPolicy], position) => ({ skillId: Number(skillId), versionPolicy, ...(versionPolicy === "pinned" ? { pinnedVersion: skills.find((skill) => skill.id === Number(skillId))?.version } : {}), position }));
    if (!items.length) { setError("Agrega al menos un Skill al paquete."); return; }
    if (isNew) { setError("Guarda primero el borrador del paquete."); return; }
    const response = await fetch(`/api/packages/${packageInfo.slug}/versions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ version, items }) });
    const body = await response.json();
    if (!response.ok) { setError(body.error ?? "No se pudo crear la versión"); return; }
    setVersionCreated(true);
    setMessage(`Versión ${body.version.version} creada como borrador.`);
  }

  function submitReview() { setError(null); router.push(`/packages/${packageInfo.slug}/review?version=${version}`); }

  return <>
    <PageHeader title={isNew ? "Nuevo paquete" : name} description="Editor de paquete. Los cambios se guardan como borrador hasta publicarse." />
    <main style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 32px 40px", display: "grid", gap: 20 }}>
      {message && <p role="status" style={successBox}>{message}</p>}{error && <p role="alert" style={errorBox}>{error}</p>}
      <div style={editorGrid}>
        <section style={card}><div style={cardHeading}><h2 style={{ margin: 0 }}>Información del paquete</h2><span style={draftBadge}>{isNew ? "nuevo" : packageInfo.status} · BORRADOR</span></div><label>Nombre *<input value={name} onChange={(event) => setName(event.target.value)} style={input} /></label><label>Descripción y propósito *<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} style={input} /><small style={{ color: "var(--muted)" }}>Se muestra en el catálogo público. Explica para quién es y qué resuelve.</small></label><label>Rol destinatario *<select value={role} onChange={(event) => setRole(event.target.value)} style={input}><option>QA</option><option>Product Owner</option><option>Desarrollador</option><option>Data</option><option>Seguridad</option><option>Todos</option></select></label><div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}><strong>Política resultante</strong><p style={{ margin: "10px 0 0", color: "var(--muted)" }}>↑ Latest</p><small style={{ color: "var(--muted)" }}>Se instala la última versión publicada al momento de instalar.</small></div></section>
        <section style={card}><div style={cardHeading}><div><h2 style={{ margin: 0 }}>Skills incluidos</h2><p style={{ color: "var(--muted)" }}>El orden define la secuencia de instalación. Cada Skill se instala por separado según su estándar y la ruta de cada harness.</p></div><span style={{ color: "var(--muted)", whiteSpace: "nowrap" }}>{selectedSkills.length} skills · {selectedSkills.length} instalables</span></div><label style={{ fontWeight: 600 }}>Agregar skill<div style={searchBox}><input aria-label="Buscar skills" value={skillQuery} onChange={(event) => setSkillQuery(event.target.value)} placeholder="Buscar en el catálogo de skills..." style={{ ...input, marginTop: 0, border: 0, outline: 0 }} />{skillQuery && <button type="button" onClick={() => setSkillQuery("")} aria-label="Limpiar búsqueda" style={clearButton}>×</button>}</div></label><div style={availableList}>{availableSkills.map((skill) => <div key={skill.id} style={resultRow}><span><strong>{skill.name}</strong> <small style={{ color: "var(--muted)" }}>{skill.version}</small></span><button type="button" onClick={() => addSkill(skill.id)} style={secondaryButton}>+ Agregar</button></div>)}{!availableSkills.length && <p style={emptyState}>{skills.length ? "No hay Skills que coincidan con la búsqueda." : "No hay Skills publicados disponibles."}</p>}</div><div style={selectedList}>{selectedSkills.length ? selectedSkills.map((skill, index) => <div key={skill.id} style={selectedCard}><span style={orderNumber}>{String(index + 1).padStart(2, "0")}</span><div style={{ flex: 1 }}><strong>{skill.name}</strong><div style={{ color: "var(--muted)", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 13 }}>{skill.slug} · última {skill.version}</div><div style={selectedActions}><button type="button" onClick={() => moveSkill(skill.id, -1)} disabled={index === 0} style={iconButton} aria-label="Mover skill arriba">⌃</button><button type="button" onClick={() => moveSkill(skill.id, 1)} disabled={index === selectedSkills.length - 1} style={iconButton} aria-label="Mover skill abajo">⌄</button><button type="button" onClick={() => removeSkill(skill.id)} style={deleteButton} aria-label={`Quitar ${skill.name}`}>♧</button></div></div><select aria-label={`Política de versión de ${skill.name}`} value={selected[skill.id]} onChange={(event) => setPolicy(skill.id, event.target.value as "latest" | "pinned")} style={policySelect}><option value="latest">Latest</option><option value="pinned">Fijada {skill.version}</option></select></div>) : <p style={emptyState}>Agrega al menos un skill publicado desde el buscador.</p>}</div></section>
      </div>
      <div style={actionBar}><span style={{ color: "var(--muted)" }}>{message ?? "Cambios sin guardar"}</span><div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}><button type="button" onClick={() => router.push("/packages")} style={secondaryButton}>Cancelar</button><button type="button" onClick={saveDraft} style={secondaryButton}>Guardar borrador</button><button type="button" onClick={createVersion} style={secondaryButton}>Crear versión</button><button type="button" onClick={submitReview} disabled={!versionCreated} style={{ ...primaryButton, opacity: versionCreated ? 1 : .5, cursor: versionCreated ? "pointer" : "not-allowed" }}>Revisar y publicar →</button></div></div>
    </main>
  </>;
}

const input = { display: "block", width: "100%", marginTop: 6, padding: "9px 10px", border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg)", color: "var(--text)" } as const;
const editorGrid = { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 32, alignItems: "start" } as const;
const card = { padding: 28, border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", display: "grid", gap: 16 } as const;
const cardHeading = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 } as const;
const searchBox = { display: "flex", alignItems: "center", border: "1px solid var(--accent)", borderRadius: 8, marginTop: 6, background: "var(--bg)" } as const;
const clearButton = { border: 0, background: "transparent", color: "var(--accent)", fontSize: 24, padding: "0 12px", cursor: "pointer" } as const;
const availableList = { display: "grid", gap: 0, maxHeight: 220, overflowY: "auto" as const, border: "1px solid var(--border)", borderRadius: 8 } as const;
const resultRow = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 12px", borderBottom: "1px solid var(--border)" } as const;
const selectedList = { display: "grid", gap: 10, borderTop: "1px solid var(--border)", paddingTop: 16 } as const;
const selectedCard = { display: "flex", alignItems: "flex-start", gap: 12, padding: 12, border: "1px solid var(--border)", borderRadius: 8 } as const;
const selectedActions = { display: "flex", gap: 6, marginTop: 10 } as const;
const orderNumber = { color: "var(--muted)", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 13, paddingTop: 2 } as const;
const policySelect = { padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--bg)", color: "var(--text)" } as const;
const iconButton = { width: 32, height: 32, border: "1px solid var(--border)", borderRadius: 8, background: "transparent", color: "var(--text)", cursor: "pointer" } as const;
const deleteButton = { width: 32, height: 32, border: "1px solid var(--border)", borderRadius: 8, background: "transparent", color: "#b83232", cursor: "pointer" } as const;
const emptyState = { padding: 18, margin: 0, border: "1px dashed var(--border)", borderRadius: 8, color: "var(--muted)", textAlign: "center" as const } as const;
const draftBadge = { padding: "4px 8px", borderRadius: 999, background: "var(--raised)", color: "var(--muted)", fontSize: 12 } as const;
const actionBar = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "18px 22px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", flexWrap: "wrap" as const } as const;
const primaryButton = { border: 0, borderRadius: 8, padding: "10px 14px", background: "var(--accent)", color: "#fff", fontWeight: 700, cursor: "pointer" } as const;
const secondaryButton = { border: "1px solid var(--border)", borderRadius: 8, padding: "9px 13px", background: "transparent", color: "var(--text)", cursor: "pointer" } as const;
const successBox = { padding: 12, borderRadius: 6, background: "rgba(15,148,136,.12)", color: "var(--teal)" } as const;
const errorBox = { padding: 12, borderRadius: 6, background: "rgba(180,50,50,.12)", color: "#b83232" } as const;

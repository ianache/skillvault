"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { filterPackageSummaries, packageStatusLabel } from "@/lib/packages/ui";
import type { PackageSummary } from "@/lib/packages/types";

const roles = ["Todos", "QA", "Product Owner", "Desarrollador", "Data", "Seguridad"];
const headers = ["Paquete", "Rol", "Estado", "Versión", "Skills", "Actualizado", "Acciones"];

export function PackageCatalogClient({ initialPackages }: { initialPackages: PackageSummary[] }) {
  const [packages, setPackages] = useState(initialPackages);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("Todos");
  const [status, setStatus] = useState("Todos");
  const [error, setError] = useState<string | null>(null);
  const visible = useMemo(() => filterPackageSummaries(packages, { query, role, status }), [packages, query, role, status]);

  async function retirePackage(slug: string) {
    if (!window.confirm("¿Retirar este paquete del catálogo público?")) return;
    const response = await fetch(`/api/packages/${slug}`, { method: "DELETE" });
    if (!response.ok) { setError("No se pudo retirar el paquete"); return; }
    setPackages((current) => current.map((item) => item.slug === slug ? { ...item, status: "retired" } : item));
  }

  async function duplicatePackage(slug: string) {
    const response = await fetch(`/api/packages/${slug}/duplicate`, { method: "POST" });
    const body = await response.json();
    if (!response.ok) { setError(body.error ?? "No se pudo duplicar el paquete"); return; }
    setPackages((current) => [body.package, ...current]);
    window.location.assign(`/packages/${body.package.slug}/edit`);
  }

  return <section style={section}>
    <div style={toolbar}>
      <label style={field}>Buscar paquetes<div style={searchBox}><span aria-hidden="true" style={searchIcon}>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, rol o descripción" aria-label="Buscar paquetes" style={plainInput} />{query && <button type="button" onClick={() => setQuery("")} aria-label="Limpiar búsqueda" style={clearSearch}>×</button>}</div></label>
      <label style={field}>Rol<select value={role} onChange={(event) => setRole(event.target.value)} style={select}>{roles.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label style={field}>Estado<select value={status} onChange={(event) => setStatus(event.target.value)} style={select}><option value="Todos">Todos</option><option value="draft">Borrador</option><option value="published">Publicado</option><option value="retired">Retirado</option></select></label>
    </div>
    {error && <p role="alert" style={errorBox}>{error}</p>}
    <div style={resultsHeader}><span>{visible.length} {visible.length === 1 ? "paquete" : "paquetes"}</span><span style={{ color: "var(--muted)" }}>Actualizados recientemente</span></div>
    <div style={tableShell}>
      <table style={table}><caption style={visuallyHidden}>Paquetes de Skills administrables</caption><thead><tr>{headers.map((header) => <th key={header} style={th}>{header}</th>)}</tr></thead><tbody>{visible.map((item) => <PackageRow key={item.slug} item={item} onDuplicate={duplicatePackage} onRetire={retirePackage} />)}</tbody></table>
      {!visible.length && <div style={emptyState}><strong>No hay paquetes para estos filtros.</strong><span>Prueba con otros criterios o crea un nuevo paquete.</span><Link href="/packages/new" style={emptyAction}>+ Nuevo paquete</Link></div>}
    </div>
  </section>;
}

function PackageRow({ item, onDuplicate, onRetire }: { item: PackageSummary; onDuplicate: (slug: string) => void; onRetire: (slug: string) => void }) {
  const retiredCount = item.retiredSkillCount ?? 0;
  return <tr>
    <td style={packageCell}><Link href={`/packages/${item.slug}/edit`} style={packageLink}>{item.name}</Link><p style={description}>{item.description}</p></td>
    <td style={cell}>{item.role}</td>
    <td style={cell}><span style={statusBadge(item.status)}><span aria-hidden="true">●</span> {packageStatusLabel(item.status).toUpperCase()}</span></td>
    <td style={versionCell}>{item.currentVersion ?? "—"}</td>
    <td style={cell}><strong>{item.skillCount ?? 0}</strong>{retiredCount > 0 && <span style={warningBadge} role="note">⚠ {retiredCount} {retiredCount === 1 ? "skill retirado" : "skills retirados"}</span>}</td>
    <td style={dateCell}>{formatDate(item.updatedAt)}</td>
    <td style={actionsCell}><Link href={`/packages/${item.slug}/edit`} style={iconButton} aria-label={`Editar ${item.name}`} title="Editar">✎</Link><button type="button" onClick={() => onDuplicate(item.slug)} style={iconButton} aria-label={`Duplicar ${item.name}`} title="Duplicar">▣</button>{item.status === "draft" ? <Link href={`/packages/${item.slug}/review`} style={iconButton} aria-label={`Revisar ${item.name}`} title="Revisar y publicar">↥</Link> : item.status !== "retired" ? <button type="button" onClick={() => onRetire(item.slug)} style={retireButton} aria-label={`Retirar ${item.name}`} title="Retirar">▤</button> : null}</td>
  </tr>;
}

function formatDate(timestamp?: number) {
  if (!timestamp) return "—";
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(timestamp * 1000)).replace(".", "");
}

const section = { display: "grid", gap: 16 } as const;
const toolbar = { display: "grid", gridTemplateColumns: "minmax(280px, 2fr) repeat(2, minmax(160px, 1fr))", gap: 14, padding: 20, border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" } as const;
const field = { display: "grid", gap: 6, color: "var(--muted)", fontSize: 12, fontWeight: 600 } as const;
const searchBox = { display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 7, background: "var(--bg)" } as const;
const searchIcon = { paddingLeft: 10, color: "var(--muted)", fontSize: 19 } as const;
const plainInput = { width: "100%", border: 0, outline: 0, padding: "10px 8px", background: "transparent", color: "var(--text)" } as const;
const clearSearch = { border: 0, background: "transparent", color: "var(--muted)", fontSize: 20, padding: "0 10px", cursor: "pointer" } as const;
const select = { width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: 7, background: "var(--bg)", color: "var(--text)" } as const;
const resultsHeader = { display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13, flexWrap: "wrap" as const } as const;
const tableShell = { overflowX: "auto", border: "1px solid var(--border)", borderRadius: 10, background: "var(--surface)" } as const;
const table = { width: "100%", borderCollapse: "collapse" as const, minWidth: 1080 } as const;
const th = { textAlign: "left" as const, padding: "15px 20px", background: "var(--raised)", borderBottom: "1px solid var(--border)", color: "var(--muted)", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase" as const, whiteSpace: "nowrap" } as const;
const cell = { padding: "19px 20px", borderBottom: "1px solid var(--border)", verticalAlign: "top" as const, whiteSpace: "nowrap" } as const;
const packageCell = { ...cell, whiteSpace: "normal" as const, width: "32%" } as const;
const packageLink = { color: "var(--text)", textDecoration: "none", fontSize: 17, fontWeight: 700 } as const;
const description = { margin: "7px 0 0", color: "var(--muted)", lineHeight: 1.5, maxWidth: 360 } as const;
const versionCell = { ...cell, fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 15 } as const;
const dateCell = { ...cell, color: "var(--muted)", whiteSpace: "nowrap" as const } as const;
const actionsCell = { ...cell, display: "flex", gap: 8 } as const;
const statusBadge = (status: string) => ({ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 999, background: status === "published" ? "rgba(15,148,136,.12)" : status === "retired" ? "rgba(180,50,50,.10)" : "var(--raised)", color: status === "published" ? "var(--teal)" : status === "retired" ? "#b83232" : "var(--muted)", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: 11, letterSpacing: ".5px", whiteSpace: "nowrap" as const });
const warningBadge = { display: "block", width: "max-content", marginTop: 8, padding: "5px 9px", border: "1px solid #e4b45c", borderRadius: 999, background: "rgba(228,180,92,.12)", color: "#946200", fontSize: 12, whiteSpace: "nowrap" as const } as const;
const iconButton = { display: "inline-grid", placeItems: "center", width: 42, height: 42, border: "1px solid var(--border)", borderRadius: 9, background: "var(--surface)", color: "var(--text)", textDecoration: "none", cursor: "pointer", fontSize: 21 } as const;
const retireButton = { ...iconButton, color: "#b83232" } as const;
const emptyState = { display: "grid", justifyItems: "center", gap: 10, padding: 48, color: "var(--muted)" } as const;
const emptyAction = { marginTop: 4, padding: "9px 14px", borderRadius: 8, background: "var(--accent)", color: "#fff", textDecoration: "none", fontWeight: 700 } as const;
const errorBox = { padding: 12, borderRadius: 6, background: "rgba(180,50,50,.12)", color: "#b83232" } as const;
const visuallyHidden = { position: "absolute" as const, width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden" as const, clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap" as const, border: 0 } as const;

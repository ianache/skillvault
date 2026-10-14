"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PackageSummary } from "@/lib/packages/types";
import { filterPublicPackageSummaries, formatPackageVersion, formatSkillCount, packageCardHref, retiredSkillsNote } from "@/lib/packages/ui";

export function PublicPackageCatalogClient({ initialPackages }: { initialPackages: PackageSummary[] }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("Todos");
  const packages = useMemo(() => filterPublicPackageSummaries(initialPackages, { query, role }), [initialPackages, query, role]);
  const roles = ["Todos", ...Array.from(new Set(initialPackages.filter((item) => item.status === "published").map((item) => item.role)))];

  return <main style={main}><div><h1>Catálogo de paquetes</h1><p style={muted}>Paquetes de Skills por rol. Descarga el paquete o consulta el comando CLI para instalarlo localmente.</p></div><div style={toolbar}><label>Buscar<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar paquetes" style={input} /></label><label>Rol<select value={role} onChange={(event) => setRole(event.target.value)} style={input}>{roles.map((item) => <option key={item}>{item}</option>)}</select></label></div><p style={count}>{packages.length} paquetes publicados</p>{packages.length ? <div style={grid}>{packages.map((item) => { const href = packageCardHref(item.slug, "public-readonly"); const skillCount = formatSkillCount(item.skillCount); const retiredNote = retiredSkillsNote(item.retiredSkillCount); return <article key={item.slug} style={card}><span style={badge}>Publicado</span><h2 style={title}>{href ? <Link href={href} style={link}>{item.name}</Link> : item.name}</h2><p style={description}>{item.description}</p><div style={meta}><span>Rol · {item.role}</span><span>{formatPackageVersion(item.currentVersion)}</span></div><div style={meta}><span>{skillCount ?? "Skills no disponibles"}</span>{retiredNote && <span style={warning}>{retiredNote}</span>}</div></article>; })}</div> : <div style={empty}>No hay paquetes publicados para estos filtros.</div>}</main>;
}

const main = { maxWidth: 1180, margin: "0 auto", padding: "32px 24px", display: "grid", gap: 20 } as const;
const muted = { color: "var(--muted)" } as const;
const toolbar = { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 } as const;
const count = { color: "var(--muted)", fontSize: 13 } as const;
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 } as const;
const input = { display: "block", width: "100%", marginTop: 6, padding: "9px 10px", border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg)", color: "var(--text)" } as const;
const card = { padding: 20, border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" } as const;
const badge = { fontSize: 11, color: "var(--teal)", letterSpacing: ".06em", textTransform: "uppercase" as const } as const;
const title = { marginBottom: 8 } as const;
const description = { color: "var(--muted)", minHeight: 42 } as const;
const meta = { display: "flex", justifyContent: "space-between", gap: 12, color: "var(--muted)", fontSize: 13, flexWrap: "wrap" as const } as const;
const warning = { color: "#946200" } as const;
const link = { color: "var(--text)", textDecoration: "none" } as const;
const empty = { padding: 24, border: "1px dashed var(--border)", color: "var(--muted)" } as const;

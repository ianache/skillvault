"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PackageSummary } from "@/lib/packages/types";

export function PublicPackageCatalogClient({ initialPackages }: { initialPackages: PackageSummary[] }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("Todos");
  const packages = useMemo(() => initialPackages.filter((item) => (!query || `${item.name} ${item.description} ${item.role}`.toLowerCase().includes(query.toLowerCase())) && (role === "Todos" || item.role === role)), [initialPackages, query, role]);
  const roles = ["Todos", ...Array.from(new Set(initialPackages.map((item) => item.role)))];
  return <main style={{ maxWidth: 1180, margin: "0 auto", padding: "32px 24px", display: "grid", gap: 20 }}><div><h1>Catálogo de paquetes</h1><p style={{ color: "var(--muted)" }}>Paquetes de Skills por rol. Cada Skill se instala de forma independiente en tu harness.</p></div><div style={toolbar}><label>Buscar<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar paquetes" style={input} /></label><label>Rol<select value={role} onChange={(event) => setRole(event.target.value)} style={input}>{roles.map((item) => <option key={item}>{item}</option>)}</select></label></div><p style={{ color: "var(--muted)", fontSize: 13 }}>{packages.length} paquetes disponibles</p>{packages.length ? <div style={grid}>{packages.map((item) => <article key={item.slug} style={card}><span style={badge}>PUBLICADO</span><h2 style={{ marginBottom: 8 }}><Link href={`/packages/public/${item.slug}`} style={link}>{item.name}</Link></h2><p style={{ color: "var(--muted)", minHeight: 42 }}>{item.description}</p><div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)", fontSize: 13 }}><span>Rol · {item.role}</span><span>{item.currentVersion ?? "—"}</span></div></article>)}</div> : <div style={empty}>No hay paquetes para estos filtros.</div>}</main>;
}

const toolbar = { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 } as const;
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 } as const;
const input = { display: "block", width: "100%", marginTop: 6, padding: "9px 10px", border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg)", color: "var(--text)" } as const;
const card = { padding: 20, border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" } as const;
const badge = { fontSize: 11, color: "var(--teal)", letterSpacing: ".06em" } as const;
const link = { color: "var(--text)", textDecoration: "none" } as const;
const empty = { padding: 24, border: "1px dashed var(--border)", color: "var(--muted)" } as const;

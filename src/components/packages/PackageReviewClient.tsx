"use client";

import { useRouter } from "next/navigation";
import type { PackageManifest, PackageSummary } from "@/lib/packages/types";

export function PackageReviewClient({ packageInfo, manifest, version }: { packageInfo: PackageSummary; manifest: PackageManifest; version: string }) {
  const router = useRouter();
  async function sendToReview() {
    const response = await fetch(`/api/packages/${packageInfo.slug}/review-requests`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ version }) });
    const body = await response.json();
    if (!response.ok) { window.alert(body.error ?? "No se pudo enviar a revisión."); return; }
    router.push("/review");
  }
  return <main style={{ maxWidth: 980, margin: "0 auto", padding: "32px 24px", display: "grid", gap: 20 }}>
    <div><p style={{ color: "var(--muted)" }}>Paquetes / Revisión</p><h1>{packageInfo.name}</h1><p>{packageInfo.description}</p></div>
    <section style={card}><div style={{ display: "flex", justifyContent: "space-between" }}><strong>ROL · {packageInfo.role}</strong><span style={badge}>BORRADOR · v{version}</span></div><h2>Resumen de validación</h2><p>✓ Nombre, descripción y rol definidos</p><p>✓ {manifest.items.length} Skills instalables</p>{manifest.excludedItems.length > 0 && <p role="alert" style={warning}>⚠️ {manifest.excludedItems.length} Skill(s) retirado(s) serán omitidos al publicar.</p>}<p style={{ color: "var(--muted)" }}>La publicación conserva las mismas reglas de auditoría y versionado que los Skills individuales.</p></section>
    <section style={card}><h2>Skills incluidos</h2><ul>{manifest.items.map((item) => <li key={item.slug} style={{ marginBottom: 8 }}>{item.slug} · {item.versionPolicy === "pinned" ? `fijada ${item.version}` : "latest"}</li>)}{manifest.excludedItems.map((item) => <li key={item.slug} style={{ color: "var(--muted)" }}>⚠️ {item.slug} · omitido: {item.reason}</li>)}</ul></section>
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}><button type="button" onClick={() => router.push(`/packages/${packageInfo.slug}/edit`)} style={secondaryButton}>← Volver a editar</button><button type="button" onClick={sendToReview} style={primaryButton}>Enviar a revisión</button></div>
  </main>;
}

const card = { padding: 20, border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" } as const;
const badge = { padding: "4px 8px", borderRadius: 999, background: "var(--raised)", fontSize: 12 } as const;
const warning = { padding: 12, borderRadius: 6, background: "rgba(190,130,20,.14)", color: "#9b6b0b" } as const;
const primaryButton = { border: 0, borderRadius: 6, padding: "10px 14px", background: "var(--accent)", color: "#1c1a17", fontWeight: 700, cursor: "pointer" } as const;
const secondaryButton = { border: "1px solid var(--border)", borderRadius: 6, padding: "9px 13px", background: "transparent", color: "var(--text)", cursor: "pointer" } as const;

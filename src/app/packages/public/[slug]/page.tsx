import Link from "next/link";
import { notFound } from "next/navigation";
import { client } from "@/lib/db";
import { getPublishedManifest, getPackage } from "@/lib/packages/service";
import { packageWarning } from "@/lib/packages/ui";

export const dynamic = "force-dynamic";

export default async function PublicPackageDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  try {
    const [pkg, manifest] = await Promise.all([getPackage(slug, client), getPublishedManifest(slug, undefined, client)]);
    const warningText = packageWarning(manifest);
    return <main style={main}><Link href="/packages/public" style={{ color: "var(--accent)" }}>← Catálogo de paquetes</Link><div><span style={role}>ROL · {pkg.role}</span><h1>{pkg.name}</h1><p style={muted}>{pkg.description}</p><span style={badge}>PUBLICADO · v{manifest.version}</span></div>{warningText && <p role="alert" style={warning}>{warningText}</p>}<section style={card}><h2>Skills incluidos ({manifest.items.length})</h2><p style={muted}>La política de versiones se aplica por Skill y cada uno se instala en la ruta correspondiente del harness.</p><ul>{manifest.items.map((item, index) => <li key={item.slug} style={{ marginBottom: 10 }}><strong>{String(index + 1).padStart(2, "0")} · {item.slug}</strong><div style={muted}>{item.versionPolicy === "pinned" ? `Fijada · ${item.version}` : "Latest"}</div></li>)}{manifest.excludedItems.map((item) => <li key={item.slug} style={muted}>⚠️ {item.slug} · retirado · se omitirá</li>)}</ul></section><section style={card}><h2>Instalar desde CLI</h2><p>La instalación es exclusivamente desde el CLI; esta página solo descarga artefactos y entrega el comando. No se instala en el navegador.</p><pre style={code}>skillvault package install {manifest.package} --format json --version {manifest.version} --harness claude</pre><div style={actions}><a href={`/api/packages/${manifest.package}/download?format=json&version=${manifest.version}`} style={button}>Descargar manifiesto JSON</a><a href={`/api/packages/${manifest.package}/download?format=zip&version=${manifest.version}`} style={button}>Descargar ZIP</a></div></section></main>;
  } catch { notFound(); }
}

const main = { maxWidth: 980, margin: "0 auto", padding: "32px 24px", display: "grid", gap: 20 } as const;
const muted = { color: "var(--muted)" } as const;
const role = { color: "var(--teal)", fontSize: 12 } as const;
const card = { padding: 20, border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)" } as const;
const badge = { display: "inline-block", padding: "4px 8px", borderRadius: 999, background: "var(--raised)", fontSize: 12 } as const;
const warning = { padding: 12, borderRadius: 6, background: "rgba(190,130,20,.14)", color: "#9b6b0b" } as const;
const code = { padding: 14, overflowX: "auto", borderRadius: 6, background: "var(--bg)", fontFamily: "var(--sv-font-mono), monospace", fontSize: 12 } as const;
const actions = { display: "flex", gap: 12, flexWrap: "wrap" as const } as const;
const button = { display: "inline-block", padding: "10px 14px", borderRadius: 6, background: "var(--accent)", color: "#1c1a17", textDecoration: "none", fontWeight: 700 } as const;

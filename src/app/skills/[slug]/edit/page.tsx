import { client } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { notFound } from "next/navigation";
import { SkillEditor } from "@/components/dashboard/SkillEditor";
import { VersionHistory } from "@/components/dashboard/VersionHistory";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

function buildRawContent(r: Record<string, unknown>): string {
  const name = r.slug as string;
  const type = r.type as string;
  const description = r.description as string ?? "";
  const version = r.version as string ?? "1.0.0";
  const author = r.author_handle as string | null;
  const triggers: string[] = JSON.parse(r.triggers as string ?? "[]");
  const tools: string[] = JSON.parse(r.tools as string ?? "[]");
  const compatibility: string[] = JSON.parse(r.compatibility as string ?? '["claude"]');

  return `---
name: ${name}
description: ${description}
version: ${version}
schema_version: "1.1"
${author ? `author: "${author}"\n` : ""}
metadata:
  type: ${type}
  triggers:
${triggers.map((t) => `    - ${t}`).join("\n") || `    - /${name}`}
  tools:
${tools.map((t) => `    - ${t}`).join("\n") || "    - Read"}

compatibility:
${compatibility.map((h) => `  - ${h}`).join("\n")}

dependencies: []
---

# ${name}

## Descripción

${description}

## Cuándo usar

Invoca este skill cuando:
- El usuario escribe \`/${name}\` o variantes

## Instrucciones

Describe aquí los pasos que el modelo debe seguir al ejecutar este skill.

## Ejemplos de uso

\`\`\`
Skill({ skill: "${name}" })
\`\`\`
`;
}

async function getSkill(slug: string) {
  const res = await client.execute({
    sql: "SELECT * FROM skills WHERE slug = ?",
    args: [slug],
  });
  if (res.rows.length === 0) return null;
  const r = res.rows[0] as Record<string, unknown>;
  const rawContent = (r.raw_content as string) || buildRawContent(r);
  return {
    slug: r.slug as string,
    name: r.name as string,
    type: r.type as string,
    version: r.version as string,
    rawContent,
    installCount: r.install_count as number,
    publishedAt: r.published_at as string | null,
  };
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  return { title: `Editar ${slug} — SkillVault` };
}

export default async function EditPage({ params }: Props) {
  const { slug } = await params;
  const skill = await getSkill(slug);
  if (!skill) notFound();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <AppHeader />
      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "28px 24px" }}>

        {/* Breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px", fontSize: "12px", color: "var(--muted)" }}>
          <Link href="/dashboard" style={{ color: "var(--muted)", textDecoration: "none" }}>Dashboard</Link>
          <span>/</span>
          <Link href={`/skills/${skill.slug}`} style={{ color: "var(--muted)", textDecoration: "none" }}>{skill.name}</Link>
          <span>/</span>
          <span style={{ color: "var(--text)" }}>Editar</span>
        </nav>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h1
              style={{
                fontFamily: "var(--font-geist), sans-serif",
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--text)",
                margin: 0,
              }}
            >
              Editar skill
            </h1>
            <div style={{ display: "flex", gap: "12px", marginTop: "6px", alignItems: "center" }}>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "13px",
                  color: "var(--accent)",
                }}
              >
                {skill.name}
              </span>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", color: "var(--faint)" }}>
                v{skill.version}
              </span>
              <span style={{ fontSize: "11px", color: "var(--faint)" }}>
                {skill.installCount} installs
              </span>
            </div>
          </div>
          <Link
            href={`/skills/${skill.slug}`}
            style={{
              fontSize: "12px",
              color: "var(--muted)",
              textDecoration: "none",
              padding: "6px 12px",
              border: "1px solid var(--border)",
              borderRadius: "4px",
            }}
          >
            ↗ Ver en catálogo
          </Link>
        </div>

        <SkillEditor slug={skill.slug} initialContent={skill.rawContent} />
        <VersionHistory slug={skill.slug} />
      </main>
    </div>
  );
}

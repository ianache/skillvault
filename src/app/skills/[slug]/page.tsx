import { notFound } from "next/navigation";
import { client } from "@/lib/db";
import { CATEGORY_META, SkillRow, SkillType } from "@/lib/types";
import type { Metadata } from "next";
import { FileTree } from "@/components/FileTree";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getSkill(slug: string): Promise<SkillRow | null> {
  const result = await client.execute({
    sql: `SELECT * FROM skills WHERE slug = ? AND status = 'published' LIMIT 1`,
    args: [slug],
  });
  if (result.rows.length === 0) return null;
  const row = result.rows[0] as Record<string, unknown>;
  return {
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description),
    type: String(row.type) as SkillType,
    authorHandle: row.author_handle ? String(row.author_handle) : null,
    version: String(row.version),
    triggers: JSON.parse(String(row.triggers ?? "[]")),
    tools: JSON.parse(String(row.tools ?? "[]")),
    compatibility: JSON.parse(String(row.compatibility ?? '["claude"]')),
    status: String(row.status) as SkillRow["status"],
    installCount: Number(row.install_count),
    createdAt: Number(row.created_at),
    publishedAt: row.published_at ? Number(row.published_at) : null,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const skill = await getSkill(slug);
  if (!skill) return { title: "Skill no encontrado" };
  return {
    title: `${skill.name} v${skill.version}`,
    description: skill.description,
    openGraph: {
      title: `${skill.name} v${skill.version} — SkillVault`,
      description: skill.description,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: `${skill.name} — SkillVault`,
      description: skill.description,
    },
  };
}

export default async function SkillDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const skill = await getSkill(slug);
  if (!skill) notFound();

  const meta = CATEGORY_META[skill.type] ?? { label: skill.type, color: "#8590A8", icon: "◇" };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Back nav */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "12px 24px",
          background: "var(--surface)",
        }}
      >
        <a
          href="/"
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "12px",
            color: "var(--muted)",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          ← Catálogo
        </a>
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "24px",
            marginBottom: "20px",
            borderTop: `3px solid ${meta.color}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
                <h1
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "var(--text)",
                    margin: 0,
                  }}
                >
                  {skill.name}
                </h1>
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "12px",
                    color: "var(--muted)",
                    padding: "2px 8px",
                    border: "1px solid var(--border)",
                    borderRadius: "3px",
                  }}
                >
                  v{skill.version}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "9px",
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    padding: "2px 7px",
                    borderRadius: "3px",
                    border: `1px solid ${meta.color}`,
                    color: meta.color,
                    background: `${meta.color}18`,
                  }}
                >
                  {meta.icon} {meta.label}
                </span>
                {skill.authorHandle && (
                  <span style={{ fontSize: "12px", color: "var(--muted)" }}>{skill.authorHandle}</span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              <StatBox label="instalaciones" value={skill.installCount.toLocaleString()} />
              {skill.publishedAt && (
                <StatBox
                  label="publicado"
                  value={new Date(skill.publishedAt * 1000).toLocaleDateString("es-ES", { month: "short", year: "numeric" })}
                />
              )}
            </div>
          </div>

          <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6, marginTop: "16px", marginBottom: 0 }}>
            {skill.description}
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "16px" }}>
          {/* Left column */}
          <div>
            {/* Invoke */}
            <Card label="Invocación">
              <code
                style={{
                  display: "block",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "13px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  padding: "12px 16px",
                  color: "var(--accent)",
                }}
              >
                {`Skill({ skill: "${skill.slug}" })`}
              </code>
            </Card>

            {/* Triggers */}
            <Card label="Triggers">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {skill.triggers.map((t: string) => (
                  <code
                    key={t}
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      fontSize: "12px",
                      background: "var(--accent-muted)",
                      color: "var(--accent)",
                      padding: "4px 10px",
                      borderRadius: "3px",
                      border: "1px solid rgba(59,110,255,0.25)",
                    }}
                  >
                    {t}
                  </code>
                ))}
              </div>
            </Card>

            {/* Tools */}
            {skill.tools.length > 0 && (
              <Card label="Herramientas requeridas">
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {skill.tools.map((t: string) => (
                    <span
                      key={t}
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        fontSize: "11px",
                        padding: "3px 8px",
                        borderRadius: "3px",
                        border: "1px solid var(--border)",
                        color: "var(--muted)",
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right column */}
          <div>
            <Card label="Compatibilidad">
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {skill.compatibility.map((h: string) => (
                  <div
                    key={h}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "12px",
                    }}
                  >
                    <span style={{ color: "var(--green)", fontSize: "11px" }}>✓</span>
                    <span
                      style={{
                        fontFamily: "var(--font-jetbrains-mono), monospace",
                        color: "var(--text)",
                      }}
                    >
                      {h}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <FileTree slug={skill.slug} />

            <Card label="Instalar rápido">
              <code
                style={{
                  display: "block",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "11px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  padding: "10px 12px",
                  color: "var(--text)",
                  wordBreak: "break-all",
                }}
              >
                {`skillvault install ${skill.slug} --harness claude --scope global`}
              </code>
              <a
                href="/"
                style={{
                  display: "inline-block",
                  marginTop: "10px",
                  fontSize: "12px",
                  color: "var(--accent)",
                  textDecoration: "none",
                }}
              >
                ← Ver opciones de instalación
              </a>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "20px",
          fontWeight: 700,
          color: "var(--text)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "11px", color: "var(--muted)" }}>{label}</div>
    </div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "4px",
        padding: "16px",
        marginBottom: "12px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "9px",
          letterSpacing: "1px",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {label}
        <span style={{ flex: 1, height: "1px", background: "var(--border)" }} />
      </div>
      {children}
    </div>
  );
}

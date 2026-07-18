import { client } from "@/lib/db";
import { CatalogClient } from "@/components/CatalogClient";
import { AppHeader } from "@/components/AppHeader";
import { SkillRow, SkillType } from "@/lib/types";

async function getPublishedSkills(): Promise<SkillRow[]> {
  const result = await client.execute(
    `SELECT * FROM skills WHERE status = 'published' ORDER BY install_count DESC`
  );
  return result.rows.map((r) => {
    const row = r as Record<string, unknown>;
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
  });
}

interface HomeProps {
  searchParams: Promise<{ q?: string; type?: string }>;
}

export default async function HomePage({ searchParams }: HomeProps) {
  const { q, type } = await searchParams;
  const skills = await getPublishedSkills();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <AppHeader />

      {/* Hero strip */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "16px 24px",
          background: "var(--surface)",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "2px",
          }}
        >
          {q ? `Resultados para "${q}"` : "Catálogo de Skills"}
        </h1>
        <p style={{ fontSize: "13px", color: "var(--muted)" }}>
          Skills reutilizables para Claude Code y otros harnesses compatibles con el estándar SKILL.md de Anthropic.
        </p>
      </div>

      <CatalogClient initialSkills={skills} initialQuery={q ?? ""} initialType={type ?? ""} />
    </div>
  );
}

import { client } from "@/lib/db";
import { auth } from "@/auth";
import { CatalogClient } from "@/components/CatalogClient";
import { AppHeader } from "@/components/AppHeader";
import { PageHeader } from "@/components/PageHeader";
import { Category, SkillRow, SkillType } from "@/lib/types";

async function getCategories(): Promise<Category[]> {
  const result = await client.execute(
    "SELECT slug, label, icon, color, description, sort_order FROM categories ORDER BY sort_order ASC"
  );
  return result.rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      slug: String(row.slug),
      label: String(row.label),
      icon: String(row.icon),
      color: String(row.color),
      description: String(row.description),
      sort_order: Number(row.sort_order),
    };
  });
}

async function getPublishedSkills(userId: string | null): Promise<SkillRow[]> {
  const result = await client.execute({
    sql: `SELECT s.*, r.rating AS user_rating
          FROM skills s
          LEFT JOIN skill_ratings r ON r.skill_id = s.id AND r.user_id = ?
          WHERE s.status = 'published'
          ORDER BY s.install_count DESC`,
    args: [userId],
  });
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
      configRequirements: JSON.parse(String(row.config_requirements ?? "[]")),
      status: String(row.status) as SkillRow["status"],
      installCount: Number(row.install_count),
      avgRating: Number(row.avg_rating ?? 0),
      ratingCount: Number(row.rating_count ?? 0),
      userRating: row.user_rating != null ? Number(row.user_rating) : null,
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
  const session = await auth();
  const [skills, categories] = await Promise.all([
    getPublishedSkills(session?.user?.id ?? null),
    getCategories(),
  ]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <AppHeader />

      <PageHeader
        title={q ? `Resultados para "${q}"` : "Catálogo de Skills"}
        description="Skills reutilizables para Claude Code y otros harnesses compatibles con el estándar SKILL.md de Anthropic."
      />

      {/* CLI download banner */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "10px 24px",
          background: "var(--raised)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "13px", color: "var(--muted)" }}>
          <span style={{ marginRight: "6px" }}>⬇</span>
          Instala el CLI para gestionar skills desde la terminal:
        </span>
        <code
          style={{
            fontSize: "12px",
            color: "var(--accent)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            padding: "2px 8px",
            fontFamily: "monospace",
          }}
        >
          skillvault install &lt;slug&gt; --harness claude
        </code>
        <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
          <a
            href="https://github.com/ianache/skillvault/releases/latest/download/skillvault-win-x64.exe"
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--accent)",
              background: "var(--surface)",
              border: "1px solid var(--accent)",
              borderRadius: "6px",
              padding: "4px 12px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            ↓ Windows .exe
          </a>
          <a
            href="https://github.com/ianache/skillvault/releases/latest/download/skillvault-macos-x64"
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "4px 12px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            ↓ macOS
          </a>
          <a
            href="https://github.com/ianache/skillvault/releases/latest/download/skillvault-linux-x64"
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--text)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "4px 12px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            ↓ Linux
          </a>
          <a
            href="https://github.com/ianache/skillvault/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "12px",
              color: "var(--muted)",
              padding: "4px 8px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Ver releases →
          </a>
        </div>
      </div>

      <CatalogClient initialSkills={skills} initialCategories={categories} initialQuery={q ?? ""} initialType={type ?? ""} />
    </div>
  );
}

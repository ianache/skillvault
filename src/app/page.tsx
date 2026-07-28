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
            id="download-windows"
            className="cli-download-btn"
            href="https://github.com/ianache/skillvault/releases/latest/download/skillvault-win-x64.exe"
            style={{
              fontSize: "12.5px",
              fontWeight: 600,
              color: "var(--sv-accent)",
              background: "var(--sv-surface)",
              border: "1px solid var(--sv-accent)",
              borderRadius: "6px",
              padding: "6px 14px",
              textDecoration: "none",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.15s ease",
            }}
            title="Descargar para Windows de 64 bits"
          >
            <svg width="14" height="14" viewBox="0 0 88 88" className="windows-svg" fill="currentColor">
              <path d="M0 12.402l35.687-4.86.016 34.61-35.703.111zm0 34.195l35.703.098.016 34.703-35.719-4.898zm39.117-34.633L88 6.137v35.805l-48.883.082zm0 34.602l48.883.082V81.82l-48.883-5.918z" />
            </svg>
            Windows
          </a>
          <a
            id="download-macos"
            className="cli-download-btn"
            href="https://github.com/ianache/skillvault/releases/latest/download/skillvault-macos-x64"
            style={{
              fontSize: "12.5px",
              fontWeight: 600,
              color: "var(--sv-text)",
              background: "var(--sv-surface)",
              border: "1px solid var(--sv-border)",
              borderRadius: "6px",
              padding: "6px 14px",
              textDecoration: "none",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.15s ease",
            }}
            title="Descargar para macOS de 64 bits"
          >
            <svg width="14" height="14" viewBox="0 0 170 170" className="apple-svg" fill="currentColor">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.92-14.36-6.13-3.18-2.63-7.07-7.27-11.69-13.93-10.74-15.62-18.7-33.8-23.86-54.51-3.21-12.98-4.82-25.29-4.82-36.94 0-15.74 3.73-28.84 11.21-39.29 7.47-10.45 16.71-15.73 27.72-15.86 5.51 0 11.13 1.41 16.85 4.24 5.73 2.83 9.69 4.24 11.89 4.24 2.06 0 5.62-1.22 10.67-3.66 6.85-3.41 12.87-5.16 18.06-5.23 15.61.26 27.42 6.13 35.43 17.61-13.32 8.12-19.82 19.33-19.51 33.62.25 10.45 4.13 19.16 11.65 26.13 7.52 6.97 16.29 10.8 26.29 11.49-2.43 6.94-5.61 14.15-9.54 21.65zm-11.02-111.4c-.06 8.25-3.24 15.89-9.54 22.91-6.3 7.02-13.67 11.14-22.1 12.35.13-7.53 3.34-15.02 9.63-22.48 6.29-7.46 13.79-11.68 22.48-12.66.19 1.1.28 2.21.28 3.32z" />
            </svg>
            macOS
          </a>
          <a
            id="download-linux"
            className="cli-download-btn"
            href="https://github.com/ianache/skillvault/releases/latest/download/skillvault-linux-x64"
            style={{
              fontSize: "12.5px",
              fontWeight: 600,
              color: "var(--sv-text)",
              background: "var(--sv-surface)",
              border: "1px solid var(--sv-border)",
              borderRadius: "6px",
              padding: "6px 14px",
              textDecoration: "none",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.15s ease",
            }}
            title="Descargar para Linux de 64 bits"
          >
            <svg width="14" height="14" viewBox="0 0 342 342" className="linux-svg" fill="currentColor">
              <path d="M165.9 313.2c-56.1 0-101.4-45.3-101.4-101.4 0-21.7 6.9-42.5 19.8-59.8l10-13.4c5-6.7 5.6-15.8 1.5-23.1-6-9.1-9-19.5-9-30.2 0-30.7 25-55.7 55.7-55.7 13.9 0 27.2 5.1 37.5 14.4 7 6.4 17.1 8 25.7 4.1 6.8-3.1 14.1-4.7 21.6-4.7 28.5 0 51.7 23.2 51.7 51.7 0 11.5-3.8 22.7-10.9 31.9-5.4 7-6.2 16.5-2.1 24.3l8.7 16.5c11.4 21.5 17.4 45.4 17.4 69.9.2 55.9-45.1 101.1-101.1 101.1l-24.8.9zm-46-178.6c1.5 0 3 .1 4.5.4 7.6 1.1 12.8 8.1 11.7 15.7s-8.1 12.8-15.7 11.7c-17-2.5-32.8-10.4-44.5-22.3-5.4-5.5-5.3-14.3.2-19.7s14.3-5.3 19.7.2c8.2 8.3 19.1 13.7 30.9 15.4 1.1.2 2.1.3 3.2.3zm136 5.8c-1.5 0-3-.1-4.5-.4-7.6-1.1-12.8-8.1-11.7-15.7s8.1-12.8 15.7-11.7c17 2.5 32.8 10.4 44.5 22.3 5.4 5.5 5.3 14.3-.2 19.7s-14.3 5.3-19.7-.2c-8.2-8.3-19.1-13.7-30.9-15.4-1.1-.2-2.1-.3-3.2-.3z" />
            </svg>
            Linux
          </a>
          <a
            href="https://github.com/ianache/skillvault/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "12.5px",
              color: "var(--sv-text-muted)",
              padding: "6px 10px",
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "color 0.15s ease",
            }}
          >
            Ver releases →
          </a>
        </div>
      </div>

      <CatalogClient
        initialSkills={skills}
        initialCategories={categories}
        initialQuery={q ?? ""}
        initialType={type ?? ""}
        user={session?.user ? { id: session.user.id, name: session.user.name, email: session.user.email, roles: (session.user as any).roles ?? [] } : null}
      />
    </div>
  );
}

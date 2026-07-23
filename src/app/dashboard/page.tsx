import { client } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import Link from "next/link";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

async function getStats() {
  const [skillsRes, installsRes, typesRes] = await Promise.all([
    client.execute("SELECT COUNT(*) as count FROM skills WHERE status = 'published'"),
    client.execute("SELECT COALESCE(SUM(install_count), 0) as total FROM skills WHERE status = 'published'"),
    client.execute("SELECT type, COUNT(*) as count FROM skills WHERE status = 'published' GROUP BY type ORDER BY count DESC"),
  ]);

  return {
    totalSkills: Number(skillsRes.rows[0]?.count ?? 0),
    totalInstalls: Number(installsRes.rows[0]?.total ?? 0),
    byType: (typesRes.rows as { type: string; count: number }[]),
  };
}

async function getSkills() {
  const res = await client.execute(
    "SELECT id, slug, name, description, type, author_handle, version, triggers, compatibility, install_count, created_at, published_at, status FROM skills ORDER BY install_count DESC, created_at DESC"
  );
  return res.rows.map((r) => ({
    id: r.id as number,
    slug: r.slug as string,
    name: r.name as string,
    description: r.description as string,
    type: r.type as string,
    authorHandle: r.author_handle as string | null,
    version: r.version as string,
    triggers: JSON.parse(r.triggers as string ?? "[]") as string[],
    compatibility: JSON.parse(r.compatibility as string ?? '["claude"]') as string[],
    installCount: r.install_count as number,
    createdAt: Number(r.created_at),
    publishedAt: r.published_at === null || r.published_at === undefined ? null : Number(r.published_at),
    status: r.status as string,
  }));
}

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [stats, skills] = await Promise.all([getStats(), getSkills()]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <AppHeader />
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <h1
              style={{
                fontFamily: "var(--font-geist), sans-serif",
                fontSize: "24px",
                fontWeight: 700,
                color: "var(--text)",
                margin: 0,
              }}
            >
              Dashboard
            </h1>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>
              Gestiona y monitorea todos los skills del catálogo.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Link
              href="/dashboard/categories"
              style={{
                fontFamily: "var(--font-geist), sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                padding: "8px 18px",
                borderRadius: "4px",
                background: "var(--raised)",
                color: "var(--text)",
                textDecoration: "none",
                border: "1px solid var(--border)",
              }}
            >
              Categorías
            </Link>
            <Link
              href="/dashboard/proposals"
              style={{
                fontFamily: "var(--font-geist), sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                padding: "8px 18px",
                borderRadius: "4px",
                background: "var(--raised)",
                color: "var(--text)",
                textDecoration: "none",
                border: "1px solid var(--border)",
              }}
            >
              Mis propuestas
            </Link>
            <Link
              href="/dashboard/review"
              style={{
                fontFamily: "var(--font-geist), sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                padding: "8px 18px",
                borderRadius: "4px",
                background: "var(--raised)",
                color: "var(--text)",
                textDecoration: "none",
                border: "1px solid var(--border)",
              }}
            >
              Revision
            </Link>
            <Link
              href="/publish"
              style={{
                fontFamily: "var(--font-geist), sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                padding: "8px 18px",
                borderRadius: "4px",
                background: "var(--accent)",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              + Publicar skill
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          <StatCard label="Skills publicados" value={stats.totalSkills} accent="var(--accent)" />
          <StatCard label="Total installs" value={stats.totalInstalls.toLocaleString()} accent="var(--green)" />
          <StatCard label="Categorías activas" value={stats.byType.length} accent="var(--amber)" />
          <StatCard
            label="Categoría top"
            value={stats.byType[0]?.type ?? "—"}
            accent="var(--text)"
            mono
          />
        </div>

        {/* Type breakdown */}
        {stats.byType.length > 0 && (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              padding: "16px 20px",
              marginBottom: "24px",
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "9px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "var(--muted)",
                flexShrink: 0,
              }}
            >
              Por categoría
            </span>
            {stats.byType.map((t) => (
              <div key={t.type} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "11px",
                    color: "var(--text)",
                  }}
                >
                  {t.type}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "11px",
                    padding: "1px 7px",
                    borderRadius: "9px",
                    background: "var(--raised)",
                    color: "var(--muted)",
                  }}
                >
                  {t.count}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Skills table */}
        <DashboardClient initialSkills={skills} />
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  mono = false,
}: {
  label: string;
  value: string | number;
  accent: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "4px",
        padding: "16px 18px",
        borderTop: `3px solid ${accent}`,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "9px",
          letterSpacing: "1px",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: "10px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: mono ? "var(--font-jetbrains-mono), monospace" : "var(--font-geist), sans-serif",
          fontSize: mono ? "16px" : "28px",
          fontWeight: 700,
          color: "var(--text)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

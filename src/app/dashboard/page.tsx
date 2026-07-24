import { client } from "@/lib/db";
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

export const metadata = { title: "Mis Skills" };

export default async function DashboardPage() {
  const [stats, skills] = await Promise.all([getStats(), getSkills()]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
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
              Mis Skills
            </h1>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>
              Gestiona, edita y monitorea tus skills creados y reutilizables en SkillVault.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Link
              href="/publish"
              style={{
                fontFamily: "var(--font-geist), sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                padding: "9px 20px",
                borderRadius: "8px",
                background: "var(--accent)",
                color: "#fff",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              }}
            >
              + Publicar nuevo skill
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

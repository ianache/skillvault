import { signIn } from "@/auth";
import { client } from "@/lib/db";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const metadata = { title: "Acceder — SkillVault" };

interface RankedRow {
  rank: string;
  name: string;
  value: string;
  pct: number;
}

function rankRows(items: { name: string; value: string; raw: number }[]): RankedRow[] {
  if (items.length === 0) return [];
  const max = Math.max(...items.map((i) => i.raw));
  return items.map((it, i) => ({
    rank: String(i + 1).padStart(2, "0"),
    name: it.name,
    value: it.value,
    pct: max > 0 ? Math.round((it.raw / max) * 100) : 0,
  }));
}

function daysAgoLabel(daysAgo: number): string {
  if (daysAgo <= 0) return "hoy";
  if (daysAgo === 1) return "hace 1 día";
  return `hace ${daysAgo} días`;
}

async function getStats() {
  try {
    const [skills, installs, authors, topInstalls, topContributors, topCategories, topRecent] = await Promise.all([
      client.execute({ sql: "SELECT COUNT(*) as n FROM skills WHERE status = 'published'" }),
      client.execute({ sql: "SELECT COALESCE(SUM(install_count), 0) as n FROM skills WHERE status = 'published'" }),
      client.execute({ sql: "SELECT COUNT(DISTINCT author_handle) as n FROM skills WHERE author_handle IS NOT NULL" }),
      client.execute({ sql: "SELECT name, install_count FROM skills WHERE status = 'published' ORDER BY install_count DESC LIMIT 5" }),
      client.execute({ sql: "SELECT author_handle, COUNT(*) as n FROM skills WHERE status = 'published' AND author_handle IS NOT NULL GROUP BY author_handle ORDER BY n DESC LIMIT 5" }),
      client.execute({
        sql: `SELECT c.label, COUNT(s.id) as n FROM categories c
              LEFT JOIN skills s ON s.type = c.slug AND s.status = 'published'
              GROUP BY c.slug, c.label ORDER BY n DESC LIMIT 5`,
      }),
      client.execute({ sql: "SELECT name, created_at FROM skills WHERE status = 'published' ORDER BY created_at DESC LIMIT 5" }),
    ]);
    const row = (r: { rows: Record<string, unknown>[] }) => Number(r.rows[0]?.n ?? 0);

    const nowSec = Math.floor(Date.now() / 1000);
    const recentWithAge = topRecent.rows.map((r) => ({
      name: String(r.name),
      daysAgo: Math.max(0, Math.floor((nowSec - Number(r.created_at)) / 86400)),
    }));
    const maxDaysAgo = recentWithAge.length ? Math.max(...recentWithAge.map((r) => r.daysAgo)) : 0;

    return {
      published: row(skills),
      installs: row(installs),
      contributors: row(authors),
      topInstalls: topInstalls.rows.map((r) => ({
        name: String(r.name),
        value: fmt(Number(r.install_count)),
        raw: Number(r.install_count),
      })),
      topContributors: topContributors.rows.map((r) => ({
        name: String(r.author_handle),
        value: `${r.n} skill${Number(r.n) > 1 ? "s" : ""}`,
        raw: Number(r.n),
      })),
      topCategories: topCategories.rows
        .filter((r) => Number(r.n) > 0)
        .map((r) => ({
          name: String(r.label),
          value: `${r.n} skill${Number(r.n) > 1 ? "s" : ""}`,
          raw: Number(r.n),
        })),
      topRecent: recentWithAge.map((r) => ({
        name: r.name,
        value: daysAgoLabel(r.daysAgo),
        raw: maxDaysAgo - r.daysAgo + 1,
      })),
    };
  } catch {
    return { published: 0, installs: 0, contributors: 0, topInstalls: [], topContributors: [], topCategories: [], topRecent: [] };
  }
}

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return String(n);
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session) redirect((await searchParams).callbackUrl ?? "/");

  const stats = await getStats();
  const callbackUrl = (await searchParams).callbackUrl ?? "/";

  const kpis = [
    { label: "Skills publicados", value: fmt(stats.published), iconColor: "var(--accent)", iconBg: "var(--accent-muted)", iconPath: "M20 6L9 17l-5-5" },
    { label: "Instalaciones de skills", value: fmt(stats.installs), iconColor: "var(--green)", iconBg: "rgba(15,148,136,0.12)", iconPath: "M12 3v14M5 12l7 7 7-7M4 21h16" },
    { label: "Contribuyentes", value: fmt(stats.contributors), iconColor: "var(--accent)", iconBg: "var(--accent-muted)", iconPath: "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  ];

  const topLists = [
    { title: "Top 5 Skills · instalaciones", barColor: "var(--green)", rows: rankRows(stats.topInstalls) },
    { title: "Top 5 Skills · recientes", barColor: "var(--accent)", rows: rankRows(stats.topRecent) },
    { title: "Top 5 Contribuyentes", barColor: "var(--accent-indigo)", rows: rankRows(stats.topContributors) },
    { title: "Top 5 Categorías", barColor: "#c46a3f", rows: rankRows(stats.topCategories) },
  ].filter((l) => l.rows.length > 0);

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      width: "100%",
      fontFamily: "var(--font-geist), sans-serif",
      background: "var(--bg)",
      color: "var(--text)",
    }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: "264px",
        flexShrink: 0,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "28px 20px",
        position: "sticky",
        top: 0,
        height: "100vh",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "40px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "9px",
            background: "linear-gradient(155deg, var(--accent), var(--accent-dim))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(169,119,46,0.25)", flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2.6L20 7v10l-8 4.4L4 17V7l8-4.4z" fill="var(--bg)" />
              <path d="M8 9.6v4.8l4 2.2 4-2.2V9.6L12 7.4 8 9.6z" fill="var(--accent)" />
              <circle cx="12" cy="12" r="1.6" fill="var(--bg)" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "17px", letterSpacing: "-0.01em", lineHeight: 1 }}>SkillVault</div>
            <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
              agent skill catalog
            </div>
          </div>
        </div>

        <form action={async () => {
          "use server";
          await signIn("keycloak", { redirectTo: callbackUrl });
        }}>
          <button
            type="submit"
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "9px",
              background: "var(--raised)", border: "1px solid var(--border-subtle)", color: "var(--text)",
              padding: "11px 14px", borderRadius: "8px",
              fontFamily: "var(--font-geist), sans-serif", fontSize: "13.5px", fontWeight: 600, cursor: "pointer",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 7a4 4 0 1 1-4 4" />
              <path d="M11 11L3 19v2h2l8-8" />
              <path d="M16 6l2 2" />
            </svg>
            Iniciar sesión con Keycloak
          </button>
        </form>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: "20px", padding: "12px 14px",
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px",
        }}>
          <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11.5px", color: "var(--muted)" }}>
            v0.1.0
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>Status</span>
            <span style={{
              position: "relative", width: "9px", height: "9px", borderRadius: "50%",
              background: "var(--green)", boxShadow: "0 0 0 3px rgba(15,148,136,0.18)", flexShrink: 0,
            }} />
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, padding: "36px 44px 60px", maxWidth: "1400px" }}>

        {/* KPI grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px,1fr))",
          gap: "16px",
          marginBottom: "40px",
        }}>
          {kpis.map((kpi) => (
            <div key={kpi.label} style={{
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px",
              padding: "20px", boxShadow: "0 1px 2px rgba(20,20,20,0.04)",
            }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "14px" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "8px", background: kpi.iconBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={kpi.iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={kpi.iconPath} />
                  </svg>
                </div>
              </div>
              <div style={{ fontSize: "26px", fontWeight: 700, fontFamily: "var(--font-jetbrains-mono), monospace", letterSpacing: "-0.01em" }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: "12.5px", color: "var(--muted)", marginTop: "5px" }}>
                {kpi.label}
              </div>
            </div>
          ))}
        </div>

        {/* Top lists */}
        {topLists.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px,1fr))",
            gap: "18px",
          }}>
            {topLists.map((col) => (
              <div key={col.title} style={{
                background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px",
                padding: "20px", boxShadow: "0 1px 2px rgba(20,20,20,0.04)",
              }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "14.5px", fontWeight: 600 }}>{col.title}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {col.rows.map((row) => (
                    <div key={row.name} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "22px", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", color: "var(--faint)", flexShrink: 0 }}>
                        {row.rank}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" }}>
                          <span style={{ fontSize: "13.5px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {row.name}
                          </span>
                          <span style={{ fontSize: "12px", fontFamily: "var(--font-jetbrains-mono), monospace", color: "var(--muted)", flexShrink: 0 }}>
                            {row.value}
                          </span>
                        </div>
                        <div style={{ height: "4px", background: "var(--border)", borderRadius: "2px", marginTop: "6px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${row.pct}%`, background: col.barColor, borderRadius: "2px" }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

import { signIn } from "@/auth";
import { client } from "@/lib/db";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const metadata = { title: "Acceder — SkillVault" };

async function getStats() {
  try {
    const [skills, installs, authors, recent, categories] = await Promise.all([
      client.execute({ sql: "SELECT COUNT(*) as n FROM skills WHERE status = 'published'" }),
      client.execute({ sql: "SELECT COALESCE(SUM(install_count), 0) as n FROM skills WHERE status = 'published'" }),
      client.execute({ sql: "SELECT COUNT(DISTINCT author_handle) as n FROM skills WHERE author_handle IS NOT NULL" }),
      client.execute({ sql: "SELECT COUNT(*) as n FROM skills WHERE status = 'published' AND created_at >= ?", args: [Math.floor(Date.now() / 1000) - 7 * 86400] }),
      client.execute({ sql: "SELECT COUNT(*) as n FROM categories" }),
    ]);
    const row = (r: { rows: Record<string, unknown>[] }) => Number(r.rows[0]?.n ?? 0);
    return {
      published:    row(skills),
      installs:     row(installs),
      contributors: row(authors),
      recentWeek:   row(recent),
      categories:   row(categories),
      harnesses:    5,
    };
  } catch {
    return { published: 0, installs: 0, contributors: 0, recentWeek: 0, categories: 0, harnesses: 5 };
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
    { label: "Skills publicados",   value: fmt(stats.published),    color: "#3B6EFF", icon: "⌨",  desc: "listos para instalar"       },
    { label: "Instalaciones",        value: fmt(stats.installs),     color: "#2ECC8A", icon: "↓",  desc: "realizadas por la comunidad" },
    { label: "Contribuyentes",       value: fmt(stats.contributors), color: "#C45FD4", icon: "◈",  desc: "autores activos"             },
    { label: "Skills esta semana",   value: fmt(stats.recentWeek),   color: "#E88B3A", icon: "◷",  desc: "recién publicados"           },
    { label: "Categorías",           value: fmt(stats.categories),   color: "#4AB8E8", icon: "▦",  desc: "áreas de conocimiento"       },
    { label: "Harnesses",            value: fmt(stats.harnesses),    color: "#E8503A", icon: "⚡", desc: "agentes compatibles"         },
  ];

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      fontFamily: "var(--font-geist), system-ui, sans-serif",
      background: "var(--bg)",
      color: "var(--text)",
    }}>

      {/* ── Panel izquierdo — identidad + login ──────────────────── */}
      <div style={{
        flex: "0 0 50%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 40px",
        position: "relative",
        overflow: "hidden",
        background: "var(--bg)",
      }}>
        {/* Dot-grid background */}
        <div aria-hidden style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(circle, #252A3D 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.6,
        }} />
        {/* Accent glow blob */}
        <div aria-hidden style={{
          position: "absolute",
          width: "340px", height: "340px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,110,255,0.13) 0%, transparent 70%)",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: "340px" }}>
          {/* Logotipo */}
          <div style={{ marginBottom: "24px" }}>
            <svg width="108" height="108" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="svGlow1" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3.5" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="svGlow2" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="7" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <radialGradient id="svCoreGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#3B6EFF" stopOpacity=".9"/>
                  <stop offset="100%" stopColor="#1A3BAF" stopOpacity=".6"/>
                </radialGradient>
                <radialGradient id="svHaloGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#3B6EFF" stopOpacity=".14"/>
                  <stop offset="100%" stopColor="#3B6EFF" stopOpacity="0"/>
                </radialGradient>
              </defs>

              {/* Halo exterior */}
              <circle cx="80" cy="80" r="72" fill="url(#svHaloGrad)"/>

              {/* Órbita guía */}
              <circle cx="80" cy="80" r="52" stroke="#3B6EFF" strokeWidth=".8" strokeDasharray="2 5" opacity=".3"/>

              {/* Skill nodes en órbita */}
              <g transform="translate(80,28)">
                <circle r="11" fill="#0C0F1A" stroke="#3B6EFF" strokeWidth="1.5" opacity=".9"/>
                <text x="0" y="4" textAnchor="middle" fontFamily="monospace" fontSize="9" fill="#3B6EFF" fontWeight="700">{"{/}"}</text>
              </g>
              <g transform="translate(132,80)">
                <circle r="11" fill="#0C0F1A" stroke="#2ECC8A" strokeWidth="1.5" opacity=".9"/>
                <text x="0" y="4" textAnchor="middle" fontFamily="monospace" fontSize="9" fill="#2ECC8A" fontWeight="700">MEM</text>
              </g>
              <g transform="translate(80,132)">
                <circle r="11" fill="#0C0F1A" stroke="#C45FD4" strokeWidth="1.5" opacity=".9"/>
                <text x="0" y="4" textAnchor="middle" fontFamily="monospace" fontSize="9" fill="#C45FD4" fontWeight="700">WEB</text>
              </g>
              <g transform="translate(28,80)">
                <circle r="11" fill="#0C0F1A" stroke="#E88B3A" strokeWidth="1.5" opacity=".9"/>
                <text x="0" y="4" textAnchor="middle" fontFamily="monospace" fontSize="9" fill="#E88B3A" fontWeight="700">API</text>
              </g>

              {/* Líneas de flujo skill → agente */}
              <line x1="80" y1="39" x2="80" y2="62" stroke="#3B6EFF" strokeWidth="1" strokeDasharray="3 3" opacity=".5"/>
              <line x1="121" y1="80" x2="98" y2="80" stroke="#2ECC8A" strokeWidth="1" strokeDasharray="3 3" opacity=".5"/>
              <line x1="80" y1="121" x2="80" y2="98" stroke="#C45FD4" strokeWidth="1" strokeDasharray="3 3" opacity=".5"/>
              <line x1="39" y1="80" x2="62" y2="80" stroke="#E88B3A" strokeWidth="1" strokeDasharray="3 3" opacity=".5"/>

              {/* Núcleo del Agente AI */}
              <circle cx="80" cy="80" r="22" fill="url(#svCoreGrad)" filter="url(#svGlow2)"/>
              <circle cx="80" cy="80" r="18" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth=".8"/>
              {/* Triángulo activar */}
              <path d="M80 69L88 87H72L80 69Z" fill="none" stroke="white" strokeWidth="1.8" strokeLinejoin="round" opacity=".9"/>
              <circle cx="80" cy="81" r="2.5" fill="white" opacity=".85"/>
            </svg>
          </div>

          {/* Nombre y tagline */}
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
            SkillVault
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.6, margin: "0 0 40px" }}>
            El catálogo de skills reutilizables para<br />Claude Code y agentes de IA.
          </p>

          {/* Botón Keycloak */}
          <form action={async () => {
            "use server";
            await signIn("keycloak", { redirectTo: callbackUrl });
          }}>
            <button
              type="submit"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                padding: "13px 24px",
                background: "#3B6EFF",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: "0.01em",
                transition: "background 0.15s",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" fill="rgba(255,255,255,0.15)" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Acceder con Keycloak
            </button>
          </form>

          <p style={{ marginTop: "24px", fontSize: "12px", color: "var(--faint)" }}>
            Autenticación gestionada por tu organización
          </p>
        </div>
      </div>

      {/* Divisor vertical */}
      <div style={{ width: "1px", background: "var(--border)", flexShrink: 0 }} />

      {/* ── Panel derecho — KPIs ──────────────────────────────────── */}
      <div style={{
        flex: "1",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "48px 52px",
        background: "var(--surface)",
      }}>
        <div style={{ maxWidth: "480px" }}>
          <p style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--muted)",
            marginBottom: "8px",
          }}>
            Plataforma en números
          </p>
          <h2 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 32px", letterSpacing: "-0.3px" }}>
            La comunidad crece cada día
          </h2>

          {/* Grid 2×3 */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}>
            {kpis.map((kpi) => (
              <div
                key={kpi.label}
                style={{
                  background: "var(--raised)",
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                }}
              >
                {/* Barra de color superior */}
                <div style={{ height: "3px", background: kpi.color }} />
                <div style={{ padding: "18px 20px" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "10px",
                  }}>
                    <span style={{ fontSize: "16px", lineHeight: 1 }}>{kpi.icon}</span>
                    <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 500, letterSpacing: "0.02em" }}>
                      {kpi.label}
                    </span>
                  </div>
                  <div style={{
                    fontSize: "32px",
                    fontWeight: 700,
                    color: kpi.color,
                    lineHeight: 1,
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    marginBottom: "4px",
                  }}>
                    {kpi.value}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--faint)" }}>
                    {kpi.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p style={{
            marginTop: "28px",
            fontSize: "12px",
            color: "var(--faint)",
            borderTop: "1px solid var(--border)",
            paddingTop: "20px",
          }}>
            Skills compatibles con Claude Code · Codex · OpenCode · Agy · Cursor
          </p>
        </div>
      </div>
    </div>
  );
}

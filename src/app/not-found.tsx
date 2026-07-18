import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", marginBottom: "40px" }}>
        <span
          style={{
            width: "28px",
            height: "28px",
            background: "var(--accent)",
            borderRadius: "5px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            color: "#fff",
            fontWeight: 700,
            fontFamily: "var(--font-jetbrains-mono), monospace",
          }}
        >
          SV
        </span>
        <span style={{ fontFamily: "var(--font-geist), sans-serif", fontWeight: 700, fontSize: "16px", color: "var(--text)" }}>
          SkillVault
        </span>
      </Link>

      {/* 404 code */}
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "80px",
          fontWeight: 700,
          color: "var(--border)",
          lineHeight: 1,
          marginBottom: "16px",
          letterSpacing: "-4px",
        }}
      >
        404
      </div>

      <h1
        style={{
          fontFamily: "var(--font-geist), sans-serif",
          fontSize: "22px",
          fontWeight: 700,
          color: "var(--text)",
          margin: "0 0 10px",
        }}
      >
        Skill no encontrado
      </h1>
      <p style={{ fontSize: "14px", color: "var(--muted)", maxWidth: "380px", lineHeight: 1.6, marginBottom: "32px" }}>
        Este skill no existe o fue eliminado del catálogo. Prueba buscando en el catálogo.
      </p>

      {/* Inline search hint */}
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "12px",
          color: "var(--muted)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "4px",
          padding: "10px 18px",
          marginBottom: "24px",
        }}
      >
        <span style={{ color: "var(--faint)" }}>$ </span>
        <span style={{ color: "var(--accent)" }}>skillvault search </span>
        <span style={{ color: "var(--text)" }}>{"<nombre-del-skill>"}</span>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            padding: "9px 20px",
            borderRadius: "4px",
            background: "var(--accent)",
            color: "#fff",
            textDecoration: "none",
          }}
        >
          Ver catálogo
        </Link>
        <Link
          href="/publish"
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "13px",
            padding: "9px 20px",
            borderRadius: "4px",
            border: "1px solid var(--border)",
            color: "var(--muted)",
            textDecoration: "none",
          }}
        >
          Publicar skill
        </Link>
      </div>
    </div>
  );
}

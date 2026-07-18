"use client";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        color: "var(--text)",
        fontFamily: "var(--font-geist), sans-serif",
      }}
    >
      <div style={{ fontSize: "48px" }}>🔒</div>
      <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>Acceso denegado</h1>
      <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>
        No tienes los permisos necesarios para acceder a esta página.
      </p>
      <Link
        href="/"
        style={{
          marginTop: "8px",
          padding: "8px 20px",
          background: "var(--accent)",
          color: "#fff",
          borderRadius: "6px",
          textDecoration: "none",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        Volver al catálogo
      </Link>
    </div>
  );
}

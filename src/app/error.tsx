"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "11px",
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: "var(--red)",
          marginBottom: "16px",
        }}
      >
        Error de runtime
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
        Algo salió mal
      </h1>

      <p style={{ fontSize: "13px", color: "var(--muted)", maxWidth: "400px", lineHeight: 1.6, marginBottom: "8px" }}>
        Ocurrió un error inesperado. Puedes intentar recargar la página.
      </p>

      {error.digest && (
        <p
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "11px",
            color: "var(--faint)",
            marginBottom: "28px",
          }}
        >
          ID: {error.digest}
        </p>
      )}

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: "13px",
            fontWeight: 600,
            padding: "9px 20px",
            borderRadius: "4px",
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
        <Link
          href="/"
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
          Ir al catálogo
        </Link>
      </div>
    </div>
  );
}

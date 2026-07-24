"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  proposals: "Mis propuestas",
  review: "Revisión",
  categories: "Categorías",
  users: "Usuarios y roles",
  publish: "Publicar skill",
  skills: "Skills",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return (
      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>
        Catálogo
      </span>
    );
  }

  let accum = "";
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}>
      <Link href="/" style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500 }}>
        Inicio
      </Link>
      {segments.map((seg, idx) => {
        accum += `/${seg}`;
        const isLast = idx === segments.length - 1;
        const label = ROUTE_LABELS[seg] ?? seg;

        return (
          <span key={accum} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "var(--faint)" }}>/</span>
            {isLast ? (
              <span style={{ fontWeight: 600, color: "var(--text)" }}>{label}</span>
            ) : (
              <Link href={accum} style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500 }}>
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

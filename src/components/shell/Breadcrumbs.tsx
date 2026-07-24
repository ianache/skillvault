"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Mis Skills",
  proposals: "Mis propuestas",
  review: "Revisión",
  categories: "Categorías",
  users: "Usuarios y roles",
  publish: "Publicar skill",
  skills: "Skills",
  edit: "Editar",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}>
      <Link href="/" title="Inicio" style={{ color: "var(--muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 500 }}>
        <span>🏠</span>
        <span>Inicio</span>
      </Link>
      {segments.map((seg, idx) => {
        const isLast = idx === segments.length - 1;
        const label = ROUTE_LABELS[seg] ?? seg;
        const path = "/" + segments.slice(0, idx + 1).join("/");

        return (
          <span key={path} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "var(--faint)" }}>/</span>
            {isLast ? (
              <span style={{ fontWeight: 600, color: "var(--text)" }}>{label}</span>
            ) : (
              <Link href={path} style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500 }}>
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}

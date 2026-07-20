"use client";
import { usePathname } from "next/navigation";

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
      <NavLink href="/" active={pathname === "/"}>Catálogo</NavLink>
      <NavLink href="/dashboard" active={pathname === "/dashboard"}>Mis Skills</NavLink>
      <NavLink href="/dashboard/categories" active={pathname.startsWith("/dashboard/categories")}>Categorías</NavLink>
      <NavLink href="/dashboard/proposals" active={pathname.startsWith("/dashboard/proposals")}>Mis propuestas</NavLink>
      <NavLink href="/dashboard/review" active={pathname.startsWith("/dashboard/review")}>Revision</NavLink>
      <NavLink href="/publish" active={pathname.startsWith("/publish")}>Publicar</NavLink>
    </nav>
  );
}

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <a
      href={href}
      style={{
        fontSize: "13px",
        color: active ? "var(--text)" : "var(--muted)",
        fontWeight: active ? 600 : 400,
        textDecoration: "none",
        padding: "5px 10px",
        borderRadius: "4px",
        background: active ? "var(--raised)" : "none",
        transition: "color .1s, background .1s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.color = "var(--text)";
        (e.currentTarget as HTMLElement).style.background = "var(--raised)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = active ? "var(--text)" : "var(--muted)";
        (e.currentTarget as HTMLElement).style.background = active ? "var(--raised)" : "none";
      }}
    >
      {children}
    </a>
  );
}

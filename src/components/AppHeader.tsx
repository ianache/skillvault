"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBar } from "./SearchBar";

export function AppHeader() {
  const pathname = usePathname();
  return (
    <header
      style={{
        height: "56px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: "16px",
        position: "sticky",
        top: 0,
        background: "var(--bg)",
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <a
        href="/"
        style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: "24px",
            height: "24px",
            background: "var(--accent)",
            borderRadius: "4px",
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
        <span
          style={{
            fontFamily: "var(--font-geist), sans-serif",
            fontWeight: 700,
            fontSize: "15px",
            color: "var(--text)",
            letterSpacing: "-0.3px",
          }}
        >
          SkillVault
        </span>
      </a>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: "480px" }}>
        <SearchBar />
      </div>

      {/* Nav */}
      <nav style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}>
        <NavLink href="/" active={pathname === "/"}>Catálogo</NavLink>
        <NavLink href="/dashboard" active={pathname.startsWith("/dashboard")}>Mis Skills</NavLink>
        <NavLink href="/publish" active={pathname.startsWith("/publish")}>Publicar</NavLink>
        <div style={{ marginLeft: "8px" }}>
          <ThemeToggle />
        </div>
      </nav>
    </header>
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

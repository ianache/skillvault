import { ThemeToggle } from "./ThemeToggle";
import { SearchBar } from "./SearchBar";
import { NavLinks } from "./NavLinks";
import { UserMenu } from "./UserMenu";

export function AppHeader() {
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

      {/* Nav + auth */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
        <NavLinks />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

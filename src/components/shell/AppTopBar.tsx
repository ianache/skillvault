"use client";

import { SearchBar } from "../SearchBar";
import { ThemeToggle } from "../ThemeToggle";
import { UserMenu } from "../UserMenu";
import { Breadcrumbs } from "./Breadcrumbs";

type Props = {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  onOpenMobileDrawer: () => void;
};

export function AppTopBar({ user, onOpenMobileDrawer }: Props) {
  return (
    <header
      style={{
        height: "56px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: "14px",
        position: "sticky",
        top: 0,
        background: "var(--bg)",
        zIndex: 20,
      }}
    >
      <button
        type="button"
        onClick={onOpenMobileDrawer}
        style={{
          background: "transparent",
          border: "none",
          fontSize: "18px",
          color: "var(--text)",
          cursor: "pointer",
          padding: "4px 8px",
          borderRadius: "4px",
        }}
        className="mobile-menu-btn"
        title="Menú / Opciones"
      >
        ☰
      </button>

      <Breadcrumbs />

      <div style={{ flex: 1, maxWidth: "420px", marginLeft: "auto" }}>
        <SearchBar />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}

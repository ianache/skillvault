"use client";

import { SearchBar } from "../SearchBar";
import { ThemeToggle } from "../ThemeToggle";
import { UserMenu } from "../UserMenu";
import { Breadcrumbs } from "./Breadcrumbs";

type Props = {
  onOpenMobileDrawer: () => void;
};

export function AppTopBar({ onOpenMobileDrawer }: Props) {
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
        zIndex: 20,
      }}
    >
      <button
        type="button"
        onClick={onOpenMobileDrawer}
        style={{
          display: "none",
          background: "transparent",
          border: "none",
          fontSize: "18px",
          color: "var(--text)",
          cursor: "pointer",
          padding: "4px",
        }}
        className="mobile-menu-btn"
      >
        ☰
      </button>

      <Breadcrumbs />

      <div style={{ flex: 1, maxWidth: "420px", marginLeft: "auto" }}>
        <SearchBar />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

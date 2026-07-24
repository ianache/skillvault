"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppTopBar } from "./AppTopBar";

type Props = {
  children: React.ReactNode;
  userRoles?: string[];
};

export function AppShell({ children, userRoles = [] }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("skillvault_sidebar_collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("skillvault_sidebar_collapsed", String(next));
      return next;
    });
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <AppSidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} userRoles={userRoles} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <AppTopBar onOpenMobileDrawer={() => setMobileOpen(true)} />
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}

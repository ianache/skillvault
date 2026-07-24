"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppTopBar } from "./AppTopBar";

type UserProp = {
  name?: string | null;
  email?: string | null;
  roles?: string[];
} | null;

type Props = {
  children: React.ReactNode;
  user?: UserProp;
  userRoles?: string[];
};

export function AppShell({ children, user, userRoles }: Props) {
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

  const effectiveRoles = user?.roles ?? userRoles ?? [];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <AppSidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} userRoles={effectiveRoles} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <AppTopBar user={user} onOpenMobileDrawer={() => setMobileOpen(true)} />
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
}

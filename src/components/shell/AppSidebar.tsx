"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavigationGroups } from "./navigation";

type Props = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  userRoles?: string[];
};

export function AppSidebar({ collapsed, onToggleCollapse, userRoles = [] }: Props) {
  const pathname = usePathname();
  const navGroups = getNavigationGroups(userRoles);

  return (
    <aside
      style={{
        width: collapsed ? "64px" : "240px",
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "var(--sv-sidebar-bg)",
        borderRight: "1px solid var(--sv-sidebar-border)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        zIndex: 30,
        userSelect: "none",
      }}
    >
      {/* Brand Header */}
      <div style={{ height: "56px", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--sv-sidebar-border)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <span style={{ width: "30px", height: "30px", background: "var(--sv-accent)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#1c1a17", fontWeight: 800, fontSize: "13px", fontFamily: "var(--sv-font-mono), monospace" }}>
            SV
          </span>
          {!collapsed && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--sv-dark-text)", letterSpacing: "-0.3px", fontFamily: "var(--sv-font-display), sans-serif", lineHeight: 1.1 }}>
                SkillVault
              </span>
              <span style={{ fontSize: "9px", color: "var(--sv-sidebar-text-dim)", fontFamily: "var(--sv-font-mono), monospace" }}>
                agent skill catalog
              </span>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={onToggleCollapse}
          style={{ background: "transparent", border: "none", color: "var(--sv-sidebar-text-dim)", cursor: "pointer", padding: "4px", borderRadius: "4px", display: "flex", alignItems: "center" }}
          title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* Navigation Groups */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 8px" }}>
        {navGroups.map((group, index) => (
          <div
            key={group.title}
            style={{
              marginBottom: "16px",
              borderTop: index > 0 ? "1px solid var(--sv-sidebar-border)" : "none",
              paddingTop: index > 0 ? "16px" : "0",
            }}
          >
            {!collapsed && (
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--sv-sidebar-text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 12px 8px", fontFamily: "var(--sv-font-mono), monospace" }}>
                {group.title}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: collapsed ? "10px 0" : "8px 12px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "13.5px",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "var(--sv-sidebar-active-text)" : "var(--sv-sidebar-text)",
                    background: isActive ? "var(--sv-sidebar-active-bg)" : "transparent",
                    transition: "all 0.15s ease",
                    marginBottom: "2px",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0, color: isActive ? "var(--sv-sidebar-active-text)" : "var(--sv-sidebar-text-dim)" }}
                  >
                    <path d={item.iconPath} />
                  </svg>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Version */}
      {!collapsed && (
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--sv-sidebar-border)", fontSize: "11px", color: "var(--sv-sidebar-text-dim)", fontFamily: "var(--sv-font-mono), monospace", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>v0.3.0</span>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span>Status</span>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--sv-teal)", boxShadow: "0 0 0 3px rgba(15,148,136,0.18)" }} />
          </div>
        </div>
      )}
    </aside>
  );
}

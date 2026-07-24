"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  collapsed: boolean;
  onToggleCollapse: () => void;
  userRoles?: string[];
};

export function AppSidebar({ collapsed, onToggleCollapse, userRoles = [] }: Props) {
  const pathname = usePathname();
  const isAdmin = userRoles.includes("admin");
  const isReviewer = userRoles.includes("reviewer") || isAdmin;

  const navGroups = [
    {
      title: "Exploración",
      items: [
        { label: "Catálogo", href: "/", icon: "🔍" },
        { label: "Publicar skill", href: "/publish", icon: "➕" },
      ],
    },
    {
      title: "Mi Contenido",
      items: [
        { label: "Mis Skills", href: "/dashboard", icon: "📦" },
        { label: "Mis propuestas", href: "/dashboard/proposals", icon: "📝" },
      ],
    },
    ...(isReviewer
      ? [
          {
            title: "Revisión",
            items: [
              { label: "Cola de revisión", href: "/dashboard/review", icon: "🛡️" },
              { label: "Categorías", href: "/dashboard/categories", icon: "🏷️" },
            ],
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            title: "Administración",
            items: [{ label: "Usuarios y roles", href: "/dashboard/users", icon: "👥" }],
          },
        ]
      : []),
  ];

  return (
    <aside
      style={{
        width: collapsed ? "64px" : "240px",
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        zIndex: 30,
        userSelect: "none",
      }}
    >
      {/* Brand Header */}
      <div style={{ height: "56px", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <span style={{ width: "28px", height: "28px", background: "var(--accent)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "12px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
            SV
          </span>
          {!collapsed && <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--text)", letterSpacing: "-0.3px" }}>SkillVault</span>}
        </Link>
        <button
          type="button"
          onClick={onToggleCollapse}
          style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px", borderRadius: "4px" }}
          title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {collapsed ? "❯" : "❮"}
        </button>
      </div>

      {/* Navigation Groups */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 8px" }}>
        {navGroups.map((group) => (
          <div key={group.title} style={{ marginBottom: "20px" }}>
            {!collapsed && (
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--faint)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "0 12px 6px" }}>
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
                    fontSize: "13px",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "var(--accent)" : "var(--text)",
                    background: isActive ? "var(--accent-muted)" : "transparent",
                    transition: "all 0.15s ease",
                    marginBottom: "2px",
                  }}
                >
                  <span style={{ fontSize: "15px" }}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Version */}
      {!collapsed && (
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", fontSize: "11px", color: "var(--faint)", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
          SkillVault v0.3.0
        </div>
      )}
    </aside>
  );
}

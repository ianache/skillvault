"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { logoutAction } from "@/app/actions/auth";

type Props = {
  user?: {
    name?: string | null;
    email?: string | null;
    roles?: string[];
  } | null;
};

const roleBadgeMap: Record<string, { label: string; bg: string; color: string; border: string }> = {
  admin: { label: "Administrador", bg: "rgba(169, 119, 46, 0.08)", color: "var(--sv-accent-dark)", border: "1px solid rgba(169, 119, 46, 0.3)" },
  reviewer: { label: "Revisor", bg: "rgba(15, 148, 136, 0.08)", color: "var(--sv-teal)", border: "1px solid rgba(15, 148, 136, 0.3)" },
  author: { label: "Creador", bg: "rgba(217, 130, 43, 0.08)", color: "var(--sv-accent-2)", border: "1px solid rgba(217, 130, 43, 0.3)" },
  editor: { label: "Editor", bg: "var(--sv-subtle)", color: "var(--sv-text-muted)", border: "1px solid var(--sv-border)" },
  user: { label: "Usuario", bg: "var(--sv-subtle)", color: "var(--sv-text-muted)", border: "1px solid var(--sv-border)" },
};

export function UserMenu({ user }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

    return (
      <Link
        href={`/signin?callbackUrl=${encodeURIComponent(currentUrl)}`}
        style={{
          display: "inline-block",
          textDecoration: "none",
          fontSize: "13px",
          fontWeight: 600,
          color: "#fff",
          background: "var(--accent)",
          border: "none",
          borderRadius: "6px",
          padding: "5px 14px",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Iniciar sesión
      </Link>
    );
  }

  const name = user.name ?? user.email ?? "Usuario";
  const email = user.email ?? "";
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w: string) => w[0] || "")
    .join("")
    .toUpperCase();

  const roles = user.roles ?? [];

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Toggle Avatar Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "var(--sv-accent)",
          color: "#1c1a17",
          fontSize: "12px",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid var(--sv-border)",
          cursor: "pointer",
          outline: "none",
          boxShadow: "var(--sv-shadow-sm)",
        }}
        title={name}
      >
        {initials}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "40px",
            width: "240px",
            background: "var(--sv-surface)",
            border: "1px solid var(--sv-border)",
            borderRadius: "12px",
            boxShadow: "var(--sv-shadow-md)",
            padding: "16px",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            animation: "svFadeUp 0.15s ease forwards",
          }}
        >
          {/* User Meta */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--sv-text)", fontFamily: "var(--sv-font-display), sans-serif" }}>
              {name}
            </span>
            {email && (
              <span style={{ fontSize: "11px", color: "var(--sv-text-muted)", fontFamily: "var(--sv-font-mono), monospace" }}>
                {email}
              </span>
            )}
          </div>

          {/* Badges Container */}
          {roles.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {roles.map((role) => {
                const badge = roleBadgeMap[role] ?? { label: role, bg: "var(--sv-subtle)", color: "var(--sv-text-muted)", border: "1px solid var(--sv-border)" };
                return (
                  <span
                    key={role}
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 600,
                      background: badge.bg,
                      color: badge.color,
                      border: badge.border,
                      padding: "2px 8px",
                      borderRadius: "5px",
                      fontFamily: "var(--sv-font-mono), monospace",
                    }}
                  >
                    {badge.label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Sutil Divider */}
          <div style={{ height: "1px", background: "var(--sv-border)" }} />

          {/* Logout Action */}
          <form action={logoutAction} style={{ width: "100%" }}>
            <button
              type="submit"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "var(--sv-danger)",
                background: "transparent",
                border: "1px solid var(--sv-border)",
                borderRadius: "8px",
                padding: "8px 12px",
                cursor: "pointer",
                fontFamily: "var(--sv-font-display), sans-serif",
                transition: "background 0.15s ease",
              }}
            >
              Salir de sesión
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

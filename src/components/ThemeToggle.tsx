"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem("sv-theme") as "dark" | "light" | null;
    const initial = stored ?? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("sv-theme", next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Cambiar a tema ${theme === "dark" ? "claro" : "oscuro"}`}
      style={{
        background: "none",
        border: "1px solid var(--border)",
        borderRadius: "4px",
        cursor: "pointer",
        padding: "6px 10px",
        color: "var(--muted)",
        fontSize: "14px",
        transition: "border-color .12s, color .12s",
        display: "flex",
        alignItems: "center",
        gap: "5px",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
      }}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}

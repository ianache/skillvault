"use client";

import { loginAction, logoutAction } from "@/app/actions/auth";

type Props = {
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
};

export function UserMenu({ user }: Props) {
  if (!user) {
    return (
      <form action={loginAction}>
        <button
          type="submit"
          style={{
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
        </button>
      </form>
    );
  }

  const name = user.name ?? user.email ?? "Usuario";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: "var(--accent)",
          color: "#fff",
          fontSize: "11px",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        title={name}
      >
        {initials}
      </div>
      <form action={logoutAction}>
        <button
          type="submit"
          style={{
            fontSize: "12px",
            color: "var(--muted)",
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "4px 10px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Salir
        </button>
      </form>
    </div>
  );
}

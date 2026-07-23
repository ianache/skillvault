import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";

function buildKeycloakLogoutUrl(idToken?: string): string | null {
  const issuer = process.env.AUTH_KEYCLOAK_ISSUER;
  if (!issuer || !idToken) return null;

  const logoutUrl = new URL(`${issuer}/protocol/openid-connect/logout`);
  logoutUrl.searchParams.set("id_token_hint", idToken);
  logoutUrl.searchParams.set("post_logout_redirect_uri", process.env.AUTH_URL ?? "/");
  return logoutUrl.toString();
}

export async function UserMenu() {
  const session = await auth();

  if (!session) {
    return (
      <form
        action={async () => {
          "use server";
          await signIn("keycloak");
        }}
      >
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

  const name = session.user?.name ?? session.user?.email ?? "Usuario";
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
      <form
        action={async () => {
          "use server";
          const keycloakLogoutUrl = buildKeycloakLogoutUrl(session.idToken);
          await signOut({ redirect: false });
          redirect(keycloakLogoutUrl ?? "/");
        }}
      >
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

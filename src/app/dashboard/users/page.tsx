import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppHeader } from "@/components/AppHeader";
import { UsersManager } from "@/components/UsersManager";
import { ensureUser, listUsers } from "@/lib/users/service";

export const dynamic = "force-dynamic";

export const metadata = { title: "Gestión de roles" };

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin");
  }
  if (!session.user.roles?.includes("admin")) {
    redirect("/unauthorized");
  }

  await ensureUser({
    id: session.user.id,
    username: session.user.name ?? session.user.email ?? session.user.id,
    email: session.user.email ?? "",
    keycloakRoles: session.user.roles,
  });
  const users = await listUsers();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <AppHeader />
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ marginBottom: "28px" }}>
          <h1
            style={{
              fontFamily: "var(--font-geist), sans-serif",
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "4px",
            }}
          >
            Gestión de roles
          </h1>
          <p style={{ fontSize: "13px", color: "var(--muted)", maxWidth: "62ch" }}>
            Los usuarios provienen de Keycloak y ya existen en el sistema. Aquí solo se asignan o revocan sus roles dentro de SkillVault.
          </p>
        </div>
        <UsersManager initialUsers={users} />
      </div>
    </div>
  );
}

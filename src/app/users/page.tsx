import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/components/PageHeader";
import { UsersManager } from "@/components/UsersManager";
import { decidePageAccess, hasCapability } from "@/lib/auth/access-policy";
import { ensureUser, listUsers } from "@/lib/users/service";

export const dynamic = "force-dynamic";

export const metadata = { title: "Gestión de roles" };

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin");
  }
  const roles = session.user.roles ?? [];
  if (
    decidePageAccess("/users", true, roles) === "catalog" ||
    !hasCapability(roles, "admin:manage")
  ) {
    redirect("/");
  }

  await ensureUser({
    id: session.user.id,
    username: session.user.name ?? session.user.email ?? session.user.id,
    email: session.user.email ?? "",
    keycloakRoles: roles,
  });
  const users = await listUsers();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <PageHeader
        title="Gestión de roles"
        description={
          <span style={{ display: "block", maxWidth: "62ch" }}>
            Los usuarios provienen de Keycloak y ya existen en el sistema. Aquí solo se asignan o revocan sus roles dentro de SkillVault.
          </span>
        }
      />
      <div style={{ padding: "32px 24px" }}>
        <UsersManager initialUsers={users} />
      </div>
    </div>
  );
}

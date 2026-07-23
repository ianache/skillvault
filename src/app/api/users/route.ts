import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureUser, listUsers } from "@/lib/users/service";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.roles?.includes("admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await ensureUser({
    id: session.user.id,
    username: session.user.name ?? session.user.email ?? session.user.id,
    email: session.user.email ?? "",
    keycloakRoles: session.user.roles,
  });

  const users = await listUsers();
  return NextResponse.json({ users });
}

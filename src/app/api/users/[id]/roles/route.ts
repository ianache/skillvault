import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { APP_ROLES, setUserRoles } from "@/lib/users/service";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id || !session.user.roles?.includes("admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const allowed: readonly string[] = APP_ROLES;
  const roles = Array.isArray(body?.roles) ? body.roles : null;
  if (!roles || !roles.every((r: unknown) => typeof r === "string" && allowed.includes(r))) {
    return NextResponse.json({ error: `roles debe ser un array de: ${APP_ROLES.join(", ")}` }, { status: 400 });
  }

  try {
    const user = await setUserRoles(id, roles as typeof APP_ROLES[number][]);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }
}

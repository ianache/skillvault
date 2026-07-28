import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { client } from "@/lib/db";

type RouteContext = { params: Promise<{ slug: string }> };

export function createCategoryHandlers(dependencies: { getSession?: () => Promise<any>, database?: any } = {}) {
  const getSession = dependencies.getSession ?? auth;
  const database = dependencies.database ?? client;

  async function PUT(req: NextRequest, { params }: RouteContext) {
    const session = await getSession();
    const roles = session?.user?.roles ?? [];
    const isAuthorized = roles.includes("admin") || roles.includes("reviewer") || roles.includes("editor");

    if (!isAuthorized) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await req.json().catch(() => ({}));
    const newType = body.type;

    if (!newType || typeof newType !== "string") {
      return NextResponse.json({ error: "Tipo de categoría inválido o ausente" }, { status: 400 });
    }

    const catCheck = await database.execute({
      sql: "SELECT slug FROM categories WHERE slug = ? LIMIT 1",
      args: [newType],
    });

    if (catCheck.rows.length === 0) {
      return NextResponse.json({ error: "La categoría especificada no existe" }, { status: 400 });
    }

    await database.execute({
      sql: "UPDATE skills SET type = ? WHERE slug = ? AND status = 'published'",
      args: [newType, slug],
    });

    return NextResponse.json({ success: true, type: newType });
  }

  return { PUT };
}

export const { PUT } = createCategoryHandlers();

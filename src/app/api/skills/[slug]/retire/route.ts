import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { client } from "@/lib/db";

type RouteContext = { params: Promise<{ slug: string }> };

export function createRetireHandlers(dependencies: { getSession?: () => Promise<any>, database?: any } = {}) {
  const getSession = dependencies.getSession ?? auth;
  const database = dependencies.database ?? client;

  async function POST(req: NextRequest, { params }: RouteContext) {
    const session = await getSession();
    const roles = session?.user?.roles ?? [];
    const isAuthorized = roles.includes("admin") || roles.includes("reviewer") || roles.includes("editor");

    if (!isAuthorized) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { slug } = await params;

    const existing = await database.execute({
      sql: "SELECT slug FROM skills WHERE slug = ? AND status = 'published' LIMIT 1",
      args: [slug],
    });

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Skill no encontrado o no publicado" }, { status: 404 });
    }

    await database.execute({
      sql: "UPDATE skills SET status = 'retired' WHERE slug = ? AND status = 'published'",
      args: [slug],
    });

    return NextResponse.json({ success: true });
  }

  return { POST };
}

export const { POST } = createRetireHandlers();

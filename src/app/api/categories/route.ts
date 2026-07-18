import { NextResponse } from "next/server";
import { client } from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  const result = await client.execute(
    "SELECT slug, label, icon, color, description, sort_order FROM categories ORDER BY sort_order ASC"
  );
  return NextResponse.json({ categories: result.rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.roles?.includes("admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { slug, label, icon, color, description } = body;

  if (!slug || !label) {
    return NextResponse.json({ error: "slug y label son requeridos" }, { status: 400 });
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "slug: solo minúsculas, números y guiones" }, { status: 400 });
  }

  const maxOrder = await client.execute("SELECT MAX(sort_order) as m FROM categories");
  const nextOrder = Number((maxOrder.rows[0] as Record<string, unknown>)["m"] ?? 0) + 1;

  await client.execute({
    sql: "INSERT INTO categories (slug, label, icon, color, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
    args: [slug, label, icon ?? "📦", color ?? "#8590A8", description ?? "", nextOrder],
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

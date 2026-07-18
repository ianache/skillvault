import { NextResponse } from "next/server";
import { client } from "@/lib/db";
import { auth } from "@/auth";

async function requireAdmin() {
  const session = await auth();
  return session?.user?.roles?.includes("admin") ?? false;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { slug } = await params;
  const body = await req.json();
  const { label, icon, color, description, sort_order } = body;

  const fields: string[] = [];
  const args: unknown[] = [];

  if (label !== undefined)       { fields.push("label = ?");       args.push(label); }
  if (icon !== undefined)        { fields.push("icon = ?");        args.push(icon); }
  if (color !== undefined)       { fields.push("color = ?");       args.push(color); }
  if (description !== undefined) { fields.push("description = ?"); args.push(description); }
  if (sort_order !== undefined)  { fields.push("sort_order = ?");  args.push(sort_order); }

  if (fields.length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  args.push(slug);
  await client.execute({ sql: `UPDATE categories SET ${fields.join(", ")} WHERE slug = ?`, args });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { slug } = await params;

  // Check no skills use this category
  const used = await client.execute({ sql: "SELECT COUNT(*) as c FROM skills WHERE type = ?", args: [slug] });
  const count = Number((used.rows[0] as Record<string, unknown>)["c"]);
  if (count > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: ${count} skill(s) usan esta categoría` },
      { status: 409 }
    );
  }

  await client.execute({ sql: "DELETE FROM categories WHERE slug = ?", args: [slug] });
  return NextResponse.json({ ok: true });
}

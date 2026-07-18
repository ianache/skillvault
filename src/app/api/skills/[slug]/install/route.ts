import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const existing = await client.execute({
    sql: "SELECT install_count FROM skills WHERE slug = ? AND status = 'published'",
    args: [slug],
  });

  if (existing.rows.length === 0) {
    return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
  }

  await client.execute({
    sql: "UPDATE skills SET install_count = install_count + 1 WHERE slug = ?",
    args: [slug],
  });

  const newCount = Number(existing.rows[0].install_count) + 1;
  return NextResponse.json({ slug, installCount: newCount });
}

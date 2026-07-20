import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const skill = await client.execute({
    sql: "SELECT id FROM skills WHERE slug = ?",
    args: [slug],
  });
  if (skill.rows.length === 0) {
    return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
  }

  const skillId = skill.rows[0].id;
  const files = await client.execute({
    sql: "SELECT id, path, file_type, content FROM skill_files WHERE skill_id = ? ORDER BY file_type, path",
    args: [skillId],
  });

  return NextResponse.json({
    files: files.rows.map((r) => ({
      id: r.id,
      path: r.path as string,
      fileType: r.file_type as string,
      content: r.content as string,
    })),
  });
}

export async function POST() {
  return NextResponse.json(
    { error: "Skill file updates must be submitted through a review request" },
    { status: 405 }
  );
}

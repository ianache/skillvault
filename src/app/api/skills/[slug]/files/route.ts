import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/db";

interface FileEntry {
  path: string;
  fileType: "resource" | "script";
  content: string;
}

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

export async function POST(
  req: NextRequest,
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

  const skillId = skill.rows[0].id as number;
  const { files } = (await req.json()) as { files: FileEntry[] };

  if (!Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: "files[] requerido" }, { status: 400 });
  }

  // Delete existing files for this skill and re-insert
  await client.execute({ sql: "DELETE FROM skill_files WHERE skill_id = ?", args: [skillId] });

  for (const f of files) {
    const fileType = f.fileType === "script" ? "script" : "resource";
    await client.execute({
      sql: "INSERT INTO skill_files (skill_id, path, file_type, content) VALUES (?, ?, ?, ?)",
      args: [skillId, f.path, fileType, f.content ?? ""],
    });
  }

  return NextResponse.json({ saved: files.length });
}

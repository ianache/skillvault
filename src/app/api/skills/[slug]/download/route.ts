import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const skillRow = await client.execute({
    sql: "SELECT id, raw_content FROM skills WHERE slug = ? AND status = 'published'",
    args: [slug],
  });
  if (skillRow.rows.length === 0) {
    return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
  }

  const skillId = skillRow.rows[0].id as number;
  const rawContent = (skillRow.rows[0].raw_content as string) || "";

  const filesRow = await client.execute({
    sql: "SELECT path, file_type, content FROM skill_files WHERE skill_id = ?",
    args: [skillId],
  });

  // Build ZIP in-memory with JSZip
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const folder = zip.folder(slug)!;

  folder.file("SKILL.md", rawContent);
  for (const f of filesRow.rows) {
    folder.file(f.path as string, f.content as string);
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slug}.zip"`,
      "Content-Length": String(buffer.length),
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/db";
import matter from "gray-matter";
import { validateSkillFrontmatter, validateBodySections } from "@/lib/skill-schema";

function parseSkill(row: Record<string, unknown>) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    type: row.type,
    authorHandle: row.author_handle,
    version: row.version,
    triggers: JSON.parse(row.triggers as string ?? "[]"),
    tools: JSON.parse(row.tools as string ?? "[]"),
    compatibility: JSON.parse(row.compatibility as string ?? '["claude"]'),
    configRequirements: JSON.parse(row.config_requirements as string ?? "[]"),
    status: row.status,
    installCount: row.install_count,
    createdAt: row.created_at,
    publishedAt: row.published_at,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "";
  const sort = searchParams.get("sort") ?? "popular";

  let sql = `SELECT * FROM skills WHERE status = 'published'`;
  const args: (string | number)[] = [];

  if (q) {
    sql += ` AND (name LIKE ? OR description LIKE ? OR triggers LIKE ?)`;
    args.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (type) {
    sql += ` AND type = ?`;
    args.push(type);
  }

  const orderMap: Record<string, string> = {
    popular: "install_count DESC",
    recent: "created_at DESC",
    az: "name ASC",
  };
  sql += ` ORDER BY ${orderMap[sort] ?? "install_count DESC"}`;

  const result = await client.execute({ sql, args });
  const skills = result.rows.map((r) => parseSkill(r as Record<string, unknown>));

  return NextResponse.json({ skills, total: skills.length });
}

export async function POST(req: NextRequest) {
  try {
    const { rawContent } = await req.json();
    if (!rawContent || typeof rawContent !== "string") {
      return NextResponse.json({ error: "rawContent requerido" }, { status: 400 });
    }

    const parsed = matter(rawContent);
    const fmResult = validateSkillFrontmatter(parsed.data);
    if (!fmResult.valid) {
      return NextResponse.json(
        { error: "Frontmatter inválido", errors: fmResult.errors },
        { status: 422 }
      );
    }

    const fm = fmResult.parsed!;
    const now = Math.floor(Date.now() / 1000);

    // Check for duplicate slug
    const existing = await client.execute({
      sql: "SELECT id FROM skills WHERE slug = ?",
      args: [fm.name],
    });
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: `Ya existe un skill con el nombre "${fm.name}"` },
        { status: 409 }
      );
    }

    await client.execute({
      sql: `INSERT INTO skills
        (slug, name, description, type, author_handle, version, schema_version,
         triggers, tools, compatibility, dependencies, config_requirements, raw_content, status,
         install_count, created_at, updated_at, published_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 0, ?, ?, ?)`,
      args: [
        fm.name,
        fm.name,
        fm.description,
        fm.metadata.type,
        fm.author ?? null,
        fm.version ?? "1.0.0",
        fm.schema_version ?? "1.1",
        JSON.stringify(fm.metadata.triggers),
        JSON.stringify(fm.metadata.tools ?? []),
        JSON.stringify(fm.compatibility ?? ["claude"]),
        JSON.stringify(fm.dependencies ?? []),
        JSON.stringify(fm.config_requirements ?? []),
        rawContent,
        now,
        now,
        now,
      ],
    });

    return NextResponse.json({ slug: fm.name }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

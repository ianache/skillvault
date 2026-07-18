import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/db";
import matter from "gray-matter";
import { validateSkillFrontmatter } from "@/lib/skill-schema";

function yamlList(arr: string[]) {
  return arr.length ? arr.map((v) => `  - "${v}"`).join("\n") : "  []";
}

function buildRawContent(row: Record<string, unknown>): string {
  const triggers = JSON.parse(row.triggers as string ?? "[]") as string[];
  const tools    = JSON.parse(row.tools    as string ?? "[]") as string[];
  const compat   = JSON.parse(row.compatibility as string ?? '["claude"]') as string[];
  const deps     = JSON.parse(row.dependencies  as string ?? "[]") as string[];
  const author   = row.author_handle ? `\nauthor: "${row.author_handle}"` : "";

  return `---
name: "${row.name}"
description: "${(row.description as string).replace(/"/g, '\\"')}"
version: "${row.version ?? "1.0.0"}"
schema_version: "${row.schema_version ?? "1.1"}"${author}
metadata:
  type: ${row.type}
  triggers:
${yamlList(triggers)}
  tools:
${yamlList(tools)}
compatibility:
${yamlList(compat)}
dependencies:
${deps.length ? deps.map((d) => `  - "${d}"`).join("\n") : "  []"}
---

# ${row.name}

${row.description}

## Usage

Invoke this skill to use its capabilities.
`;
}

function parseSkill(row: Record<string, unknown>) {
  const triggers = JSON.parse(row.triggers as string ?? "[]");
  const tools    = JSON.parse(row.tools    as string ?? "[]");
  const compat   = JSON.parse(row.compatibility as string ?? '["claude"]');
  const deps     = JSON.parse(row.dependencies  as string ?? "[]");
  const raw      = (row.raw_content as string) || buildRawContent(row);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    type: row.type,
    authorHandle: row.author_handle,
    version: row.version,
    schemaVersion: row.schema_version,
    triggers,
    tools,
    compatibility: compat,
    dependencies: deps,
    rawContent: raw,
    status: row.status,
    installCount: row.install_count,
    createdAt: row.created_at,
    publishedAt: row.published_at,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const result = await client.execute({
    sql: `SELECT * FROM skills WHERE slug = ? AND status = 'published' LIMIT 1`,
    args: [slug],
  });

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(parseSkill(result.rows[0] as Record<string, unknown>));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const existing = await client.execute({
    sql: "SELECT id FROM skills WHERE slug = ?",
    args: [slug],
  });
  if (existing.rows.length === 0) {
    return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
  }

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

  await client.execute({
    sql: `UPDATE skills SET
      name = ?, description = ?, type = ?, author_handle = ?,
      version = ?, schema_version = ?,
      triggers = ?, tools = ?, compatibility = ?, dependencies = ?,
      raw_content = ?, updated_at = ?
      WHERE slug = ?`,
    args: [
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
      rawContent,
      now,
      slug,
    ],
  });

  // Record version snapshot
  const skillRow = await client.execute({
    sql: "SELECT id FROM skills WHERE slug = ?",
    args: [slug],
  });
  if (skillRow.rows.length > 0) {
    const skillId = skillRow.rows[0].id;
    await client.execute({
      sql: `INSERT INTO skill_versions (skill_id, version, raw_content, created_at)
            VALUES (?, ?, ?, ?)`,
      args: [skillId, fm.version ?? "1.0.0", rawContent, now],
    }).catch(() => {}); // graceful if table schema differs
  }

  return NextResponse.json({ slug, updated: now });
}

import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/db";
import type { ReviewDatabaseClient } from "@/lib/review/types";

type RouteDependencies = { database: ReviewDatabaseClient };

export function createSkillVersionHandlers(dependencies: Partial<RouteDependencies> = {}) {
  const database = dependencies.database ?? client;

  async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
  ) {
    const { slug } = await params;

    const skillRow = await database.execute({
      sql: "SELECT id FROM skills WHERE slug = ? AND status = 'published'",
      args: [slug],
    });
    if (skillRow.rows.length === 0) {
      return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
    }

    const skillId = skillRow.rows[0].id;

    try {
      const versions = await database.execute({
        sql: `SELECT version, created_at FROM skill_versions
            WHERE skill_id = ?
            ORDER BY created_at DESC
            LIMIT 10`,
        args: [skillId],
      });

      return NextResponse.json({
        versions: versions.rows.map((r) => ({
          version: r.version as string,
          createdAt: r.created_at as string,
        })),
      });
    } catch {
      return NextResponse.json({ versions: [] });
    }
  }

  return { GET };
}

export const { GET } = createSkillVersionHandlers();

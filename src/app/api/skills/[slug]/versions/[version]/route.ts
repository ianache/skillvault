import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/db";
import type { ReviewDatabaseClient } from "@/lib/review/types";

type RouteDependencies = { database: ReviewDatabaseClient };

export function createSkillVersionDetailHandlers(dependencies: Partial<RouteDependencies> = {}) {
  const database = dependencies.database ?? client;

  async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ slug: string; version: string }> }
  ) {
    const { slug, version } = await params;

    const versionRow = await database.execute({
      sql: `SELECT sv.id, sv.version, sv.raw_content, sv.created_at
            FROM skill_versions sv
            JOIN skills s ON s.id = sv.skill_id
            WHERE s.slug = ? AND s.status = 'published' AND sv.version = ?
            LIMIT 1`,
      args: [slug, version],
    });
    if (versionRow.rows.length === 0) {
      return NextResponse.json({ error: "Version no encontrada" }, { status: 404 });
    }

    const row = versionRow.rows[0];
    const skillVersionId = row.id as number;

    let files: Array<{ path: string; fileType: string; content: string }> = [];
    try {
      const filesRow = await database.execute({
        sql: "SELECT path, file_type, content FROM skill_version_files WHERE skill_version_id = ? ORDER BY file_type, path",
        args: [skillVersionId],
      });
      files = filesRow.rows.map((f) => ({
        path: f.path as string,
        fileType: f.file_type as string,
        content: f.content as string,
      }));
    } catch {
      files = [];
    }

    return NextResponse.json({
      version: row.version as string,
      createdAt: Number(row.created_at),
      rawContent: row.raw_content as string,
      files,
    });
  }

  return { GET };
}

export const { GET } = createSkillVersionDetailHandlers();

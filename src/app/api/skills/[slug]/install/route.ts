import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/db";
import type { ReviewDatabaseClient } from "@/lib/review/types";

type RouteDependencies = { database: ReviewDatabaseClient };

export function createSkillInstallHandlers(dependencies: Partial<RouteDependencies> = {}) {
  const database = dependencies.database ?? client;

  async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
  ) {
    const { slug } = await params;

    const existing = await database.execute({
      sql: "SELECT id, install_count FROM skills WHERE slug = ? AND status = 'published'",
      args: [slug],
    });

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
    }

    await database.execute({
      sql: "UPDATE skills SET install_count = install_count + 1 WHERE id = ? AND status = 'published'",
      args: [existing.rows[0].id],
    });

    const newCount = Number(existing.rows[0].install_count) + 1;
    return NextResponse.json({ slug, installCount: newCount });
  }

  return { POST };
}

export const { POST } = createSkillInstallHandlers();

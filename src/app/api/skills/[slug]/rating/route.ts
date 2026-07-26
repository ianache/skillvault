import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { client, type DbClient } from "@/lib/db";
import type { Session } from "next-auth";

type RouteDependencies = {
  getSession: () => Promise<Session | null>;
  database: DbClient;
};

function parseRating(body: unknown): number | null {
  if (!body || typeof body !== "object") return null;
  const { rating } = body as Record<string, unknown>;
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  return rating;
}

export function createSkillRatingHandlers(dependencies: Partial<RouteDependencies> = {}) {
  const getSession = dependencies.getSession ?? auth;
  const database = dependencies.database ?? client;

  async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
  ) {
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const rating = parseRating(body);
    if (rating === null) {
      return NextResponse.json({ error: "rating debe ser un entero entre 1 y 5" }, { status: 422 });
    }

    const { slug } = await params;
    const skillResult = await database.execute({
      sql: "SELECT id FROM skills WHERE slug = ? AND status = 'published' LIMIT 1",
      args: [slug],
    });
    if (skillResult.rows.length === 0) {
      return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
    }
    const skillId = Number(skillResult.rows[0].id);
    const now = Math.floor(Date.now() / 1000);

    const result = await database.transaction(async (tx) => {
      const existing = await tx.execute({
        sql: "SELECT id FROM skill_ratings WHERE skill_id = ? AND user_id = ? LIMIT 1",
        args: [skillId, userId],
      });

      if (existing.rows.length > 0) {
        await tx.execute({
          sql: "UPDATE skill_ratings SET rating = ?, updated_at = ? WHERE skill_id = ? AND user_id = ?",
          args: [rating, now, skillId, userId],
        });
      } else {
        await tx.execute({
          sql: "INSERT INTO skill_ratings (skill_id, user_id, rating, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
          args: [skillId, userId, rating, now, now],
        });
      }

      const agg = await tx.execute({
        sql: "SELECT AVG(rating) AS avg_rating, COUNT(*) AS rating_count FROM skill_ratings WHERE skill_id = ?",
        args: [skillId],
      });
      const avgRating = Number(agg.rows[0]?.avg_rating ?? 0);
      const ratingCount = Number(agg.rows[0]?.rating_count ?? 0);

      await tx.execute({
        sql: "UPDATE skills SET avg_rating = ?, rating_count = ? WHERE id = ?",
        args: [avgRating, ratingCount, skillId],
      });

      return { avgRating, ratingCount, userRating: rating };
    });

    return NextResponse.json(result);
  }

  return { POST };
}

export const { POST } = createSkillRatingHandlers();

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { client } from "@/lib/db";
import { createReviewRequest } from "@/lib/review/service";
import type { CreateReviewRequestInput, ReviewActor, ReviewDatabaseClient, ReviewFileInput, ReviewRequest } from "@/lib/review/types";
import { actorFromSession, errorResponse } from "../review-requests/route-utils";
import type { Session } from "next-auth";

type RouteDependencies = {
  getSession: () => Promise<Session | null>;
  database: ReviewDatabaseClient;
  create: (input: CreateReviewRequestInput, actor: ReviewActor, database: ReviewDatabaseClient) => Promise<ReviewRequest>;
};

function parseFiles(value: unknown): ReviewFileInput[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  const files: ReviewFileInput[] = [];
  for (const file of value) {
    if (!file || typeof file !== "object") return null;
    const entry = file as Record<string, unknown>;
    if (
      typeof entry.path !== "string" ||
      (entry.fileType !== "resource" && entry.fileType !== "script") ||
      (entry.content !== undefined && typeof entry.content !== "string") ||
      (entry.changeType !== undefined && !["added", "modified", "deleted", "unchanged"].includes(String(entry.changeType)))
    ) {
      return null;
    }
    files.push({
      path: entry.path,
      fileType: entry.fileType,
      ...(typeof entry.content === "string" ? { content: entry.content } : {}),
      ...(entry.changeType !== undefined ? { changeType: entry.changeType as ReviewFileInput["changeType"] } : {}),
    });
  }
  return files;
}

export async function skillSubmissionBody(request: Request): Promise<CreateReviewRequestInput | null> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return null;
  }
  if (!body || typeof body !== "object") return null;
  const { rawContent, files } = body as Record<string, unknown>;
  const parsedFiles = parseFiles(files);
  if (typeof rawContent !== "string" || !rawContent || parsedFiles === null) return null;
  return { rawContent, files: parsedFiles };
}

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

export function createSkillHandlers(dependencies: Partial<RouteDependencies> = {}) {
  const getSession = dependencies.getSession ?? auth;
  const database = dependencies.database ?? client;
  const create = dependencies.create ?? createReviewRequest;

  async function GET(req: NextRequest) {
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

    const result = await database.execute({ sql, args });
    const skills = result.rows.map((r) => parseSkill(r as Record<string, unknown>));

    return NextResponse.json({ skills, total: skills.length });
  }

  async function POST(req: NextRequest) {
    const session = await getSession();
    const actor = session ? actorFromSession(session) : null;
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const input = await skillSubmissionBody(req);
    if (!input) return NextResponse.json({ error: "rawContent y files[] inválidos" }, { status: 400 });

    try {
      const request = await create(input, actor, database);
      return NextResponse.json(
        { slug: request.slug, reviewRequestId: request.id, status: request.status },
        { status: 201 }
      );
    } catch (error) {
      return errorResponse(error);
    }
  }

  return { GET, POST };
}

export const { GET, POST } = createSkillHandlers();

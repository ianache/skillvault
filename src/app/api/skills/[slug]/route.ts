import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { client } from "@/lib/db";
import { createReviewRequest, updateReviewRequest } from "@/lib/review/service";
import { actorFromSession, errorResponse } from "../../review-requests/route-utils";
import { skillSubmissionBody } from "../route";
import type { Session } from "next-auth";
import type { CreateReviewRequestInput, ReviewActor, ReviewDatabaseClient, ReviewRequest, UpdateReviewRequestInput } from "@/lib/review/types";

type RouteContext = { params: Promise<{ slug: string }> };

type RouteDependencies = {
  getSession: () => Promise<Session | null>;
  database: ReviewDatabaseClient;
  create: (input: CreateReviewRequestInput, actor: ReviewActor, database: ReviewDatabaseClient) => Promise<ReviewRequest>;
  update: (id: number, input: UpdateReviewRequestInput, actor: ReviewActor, database: ReviewDatabaseClient) => Promise<ReviewRequest>;
};

function yamlList(arr: string[]) {
  return arr.length ? arr.map((v) => `  - "${v}"`).join("\n") : "  []";
}

function buildRawContent(row: Record<string, unknown>): string {
  const triggers = JSON.parse(row.triggers as string ?? "[]") as string[];
  const tools = JSON.parse(row.tools as string ?? "[]") as string[];
  const compat = JSON.parse(row.compatibility as string ?? '["claude"]') as string[];
  const deps = JSON.parse(row.dependencies as string ?? "[]") as string[];
  const author = row.author_handle ? `\nauthor: "${row.author_handle}"` : "";

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
  const tools = JSON.parse(row.tools as string ?? "[]");
  const compat = JSON.parse(row.compatibility as string ?? '["claude"]');
  const deps = JSON.parse(row.dependencies as string ?? "[]");
  const raw = (row.raw_content as string) || buildRawContent(row);

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

export function createSkillDetailHandlers(dependencies: Partial<RouteDependencies> = {}) {
  const getSession = dependencies.getSession ?? auth;
  const database = dependencies.database ?? client;
  const create = dependencies.create ?? createReviewRequest;
  const update = dependencies.update ?? updateReviewRequest;

  async function GET(_req: NextRequest, { params }: RouteContext) {
    const { slug } = await params;
    const result = await database.execute({
      sql: `SELECT * FROM skills WHERE slug = ? AND status = 'published' LIMIT 1`,
      args: [slug],
    });

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(parseSkill(result.rows[0] as Record<string, unknown>));
  }

  async function PATCH(req: NextRequest, { params }: RouteContext) {
    const session = await getSession();
    const actor = session ? actorFromSession(session) : null;
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { slug } = await params;
    const skill = await database.execute({
      sql: "SELECT id, raw_content FROM skills WHERE slug = ? AND status = 'published' LIMIT 1",
      args: [slug],
    });
    if (skill.rows.length === 0) {
      return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
    }

    const input = await skillSubmissionBody(req);
    if (!input) return NextResponse.json({ error: "rawContent y files[] inválidos" }, { status: 400 });

    try {
      const skillId = Number(skill.rows[0].id);
      const openRequest = await database.execute({
        sql: `SELECT id FROM skill_review_requests
          WHERE skill_id = ? AND author_id = ? AND status IN ('pending', 'changes_requested')
          ORDER BY id DESC LIMIT 1`,
        args: [skillId, actor.id],
      });
      const request = openRequest.rows.length > 0
        ? await update(Number(openRequest.rows[0].id), input, actor, database)
        : await create({ ...input, skillId }, actor, database);

      return NextResponse.json(
        { slug: request.slug, reviewRequestId: request.id, status: request.status },
        { status: 201 }
      );
    } catch (error) {
      return errorResponse(error);
    }
  }

  return { GET, PATCH };
}

export const { GET, PATCH } = createSkillDetailHandlers();

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { client } from "@/lib/db";
import { createReviewRequest, listReviewRequests } from "@/lib/review/service";
import type { Session } from "next-auth";
import type { CreateReviewRequestInput, ReviewDatabaseClient } from "@/lib/review/types";
import { actorFromSession, errorResponse, parseReviewStatus, requestBody } from "./route-utils";

type RouteDependencies = {
  getSession: () => Promise<Session | null>;
  database: ReviewDatabaseClient;
  create: typeof createReviewRequest;
  list: typeof listReviewRequests;
};

export function createReviewRequestsHandlers(dependencies: Partial<RouteDependencies> = {}) {
  const getSession = dependencies.getSession ?? auth;
  const database = dependencies.database ?? client;
  const create = dependencies.create ?? createReviewRequest;
  const list = dependencies.list ?? listReviewRequests;

  async function requireActor() {
    const session = await getSession();
    return session ? actorFromSession(session) : null;
  }

  async function GET(request: NextRequest) {
    const actor = await requireActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const status = parseReviewStatus(request.nextUrl.searchParams.get("status"));
    if (status === null) return NextResponse.json({ error: "Invalid review request status" }, { status: 422 });
    try {
      const mine = ["1", "true"].includes(request.nextUrl.searchParams.get("mine") ?? "");
      const requests = await list({ mine, status }, actor, database);
      return NextResponse.json({ requests });
    } catch (error) {
      return errorResponse(error);
    }
  }

  async function POST(request: NextRequest) {
    const actor = await requireActor();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    try {
      const input = await requestBody(request) as CreateReviewRequestInput;
      const reviewRequest = await create(input, actor, database);
      return NextResponse.json({ request: reviewRequest }, { status: 201 });
    } catch (error) {
      return errorResponse(error);
    }
  }

  return { GET, POST };
}

export const { GET, POST } = createReviewRequestsHandlers();

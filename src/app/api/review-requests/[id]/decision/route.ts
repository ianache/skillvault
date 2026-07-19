import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { client } from "@/lib/db";
import { decideReviewRequest } from "@/lib/review/service";
import type { DecideReviewRequestInput } from "@/lib/review/types";
import { actorFromSession, errorResponse, parseRequestId, requestBody } from "../../route-utils";

type RouteContext = { params: Promise<{ id: string }> };
type DecisionRouteDeps = {
  getSession?: typeof auth;
  database?: typeof client;
  decide?: typeof decideReviewRequest;
};

function parseDecisionInput(value: unknown): DecideReviewRequestInput {
  if (!value || typeof value !== "object") throw new Error("Invalid review decision");
  const input = value as { decision?: unknown; comment?: unknown };
  if (input.decision !== "approve" && input.decision !== "reject" && input.decision !== "request_changes") {
    throw new Error("Invalid review decision");
  }
  if (input.comment !== undefined && input.comment !== null && typeof input.comment !== "string") {
    throw new Error("Invalid review comment");
  }
  if ((input.decision === "reject" || input.decision === "request_changes") && !input.comment?.trim()) {
    throw new Error("A general comment required for this decision");
  }
  return { decision: input.decision, comment: input.comment ?? null };
}

export function createReviewDecisionHandlers({
  getSession = auth,
  database = client,
  decide = decideReviewRequest,
}: DecisionRouteDeps = {}) {
  async function POST(request: NextRequest, context: RouteContext) {
    const session = await getSession();
    const actor = session ? actorFromSession(session) : null;
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = parseRequestId((await context.params).id);
    if (!id) return NextResponse.json({ error: "Invalid review request id" }, { status: 422 });
    try {
      const input = parseDecisionInput(await requestBody(request));
      const reviewRequest = await decide(id, input, actor, database);
      return NextResponse.json({ request: reviewRequest });
    } catch (error) {
      return errorResponse(error);
    }
  }

  return { POST };
}

export const { POST } = createReviewDecisionHandlers();

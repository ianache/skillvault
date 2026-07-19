import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { client } from "@/lib/db";
import { decideReviewRequest } from "@/lib/review/service";
import type { DecideReviewRequestInput } from "@/lib/review/types";
import { actorFromSession, errorResponse, parseRequestId, requestBody } from "../../route-utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await auth();
  const actor = session ? actorFromSession(session) : null;
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = parseRequestId((await context.params).id);
  if (!id) return NextResponse.json({ error: "Invalid review request id" }, { status: 422 });
  try {
    const input = await requestBody(request) as DecideReviewRequestInput;
    const reviewRequest = await decideReviewRequest(id, input, actor, client);
    return NextResponse.json({ request: reviewRequest });
  } catch (error) {
    return errorResponse(error);
  }
}

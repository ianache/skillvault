import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { client } from "@/lib/db";
import { getReviewRequest, updateReviewRequest } from "@/lib/review/service";
import type { UpdateReviewRequestInput } from "@/lib/review/types";
import { actorFromSession, errorResponse, parseRequestId, requestBody } from "../route-utils";

type RouteContext = { params: Promise<{ id: string }> };

async function requireActor() {
  const session = await auth();
  return session ? actorFromSession(session) : null;
}

async function requestId(context: RouteContext) {
  return parseRequestId((await context.params).id);
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const actor = await requireActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = await requestId(context);
  if (!id) return NextResponse.json({ error: "Invalid review request id" }, { status: 422 });
  try {
    const reviewRequest = await getReviewRequest(id, actor, client);
    return NextResponse.json({ request: reviewRequest });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const actor = await requireActor();
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = await requestId(context);
  if (!id) return NextResponse.json({ error: "Invalid review request id" }, { status: 422 });
  try {
    const input = await requestBody(request) as UpdateReviewRequestInput;
    const reviewRequest = await updateReviewRequest(id, input, actor, client);
    return NextResponse.json({ request: reviewRequest });
  } catch (error) {
    return errorResponse(error);
  }
}

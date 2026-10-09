import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { client } from "@/lib/db";
import { getPackage, retirePackage, updatePackage } from "@/lib/packages/service";
import { actorFromSession, capabilityError, errorResponse } from "../../review-requests/route-utils";

type Context = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const session = await auth();
  const actor = session ? actorFromSession(session) : null;
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const forbidden = capabilityError(actor, "content:manage");
  if (forbidden) return forbidden;
  try { return NextResponse.json({ package: await getPackage((await context.params).slug, client) }); }
  catch (error) { return errorResponse(error); }
}

export async function PATCH(request: NextRequest, context: Context) {
  const session = await auth();
  const actor = session ? actorFromSession(session) : null;
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const forbidden = capabilityError(actor, "content:manage");
  if (forbidden) return forbidden;
  if (!request.headers.get("if-match")) return NextResponse.json({ error: "If-Match is required" }, { status: 428 });
  try { return NextResponse.json({ package: await updatePackage((await context.params).slug, await request.json(), actor, client) }); }
  catch (error) { return errorResponse(error); }
}

export async function DELETE(_request: NextRequest, context: Context) {
  const session = await auth();
  const actor = session ? actorFromSession(session) : null;
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const forbidden = capabilityError(actor, "content:manage");
  if (forbidden) return forbidden;
  try { await retirePackage((await context.params).slug, actor, client); return NextResponse.json({ status: "retired" }); }
  catch (error) { return errorResponse(error); }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { client } from "@/lib/db";
import { duplicatePackage } from "@/lib/packages/service";
import { actorFromSession, capabilityError, errorResponse } from "../../../review-requests/route-utils";

export async function POST(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const actor = session ? actorFromSession(session) : null;
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const forbidden = capabilityError(actor, "content:manage");
  if (forbidden) return forbidden;
  try { return NextResponse.json({ package: await duplicatePackage((await context.params).slug, actor, client) }, { status: 201 }); }
  catch (error) { return errorResponse(error); }
}

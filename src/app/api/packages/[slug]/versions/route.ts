import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { client } from "@/lib/db";
import { createPackageVersion } from "@/lib/packages/service";
import { actorFromSession, capabilityError, errorResponse } from "../../../review-requests/route-utils";
import type { PackageVersionInput } from "@/lib/packages/types";

type Context = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, context: Context) {
  const session = await auth();
  const actor = session ? actorFromSession(session) : null;
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const forbidden = capabilityError(actor, "publish:create");
  if (forbidden) return forbidden;
  try {
    const input = await request.json() as PackageVersionInput;
    return NextResponse.json({ version: await createPackageVersion((await context.params).slug, input, actor, client) }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}

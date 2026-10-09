import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { client } from "@/lib/db";
import { createReviewRequest } from "@/lib/review/service";
import { actorFromSession, capabilityError, errorResponse } from "../../../review-requests/route-utils";
import type { CreateReviewRequestInput } from "@/lib/review/types";

type Context = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, context: Context) {
  const session = await auth();
  const actor = session ? actorFromSession(session) : null;
  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const forbidden = capabilityError(actor, "publish:create");
  if (forbidden) return forbidden;
  try {
    const body = await request.json() as CreateReviewRequestInput & { version?: string };
    const slug = (await context.params).slug;
    const lookup = await client.execute({
      sql: `SELECT p.id AS package_id, pv.id AS package_version_id, pv.version
            FROM packages p JOIN package_versions pv ON pv.package_id = p.id
            WHERE p.slug = ? AND pv.version = ? AND pv.release_status = 'draft'`,
      args: [slug, body.version],
    });
    const snapshot = lookup.rows[0];
    if (!snapshot) return NextResponse.json({ error: "Draft package version not found" }, { status: 404 });
    const result = await createReviewRequest({
      ...body,
      acceptedResponsibility: true,
      resourceType: "package",
      resourceId: Number(snapshot.package_id),
      packageVersionId: Number(snapshot.package_version_id),
      resourceSlug: slug,
      resourceVersion: String(snapshot.version),
    }, actor, client);
    return NextResponse.json({ reviewRequestId: result.id, status: result.status }, { status: 201 });
  } catch (error) { return errorResponse(error); }
}

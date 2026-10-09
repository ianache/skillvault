import { NextRequest, NextResponse } from "next/server";
import { client } from "@/lib/db";
import { getPublishedManifest } from "@/lib/packages/service";
import { errorResponse } from "../../../review-requests/route-utils";

type Context = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const slug = (await context.params).slug;
    const version = request.nextUrl.searchParams.get("version") ?? undefined;
    const manifest = await getPublishedManifest(slug, version, client);
    return NextResponse.json({ package: manifest, warnings: manifest.excludedItems.length ? ["⚠️ Este paquete contiene Skills retirados"] : [] });
  } catch (error) { return errorResponse(error); }
}

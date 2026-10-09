import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { client } from "@/lib/db";
import { getPublishedManifest } from "@/lib/packages/service";
import { serializePackageJson, serializePackageZip } from "@/lib/packages/serializer";
import { enforceDownloadRateLimit, recordDownloadAudit } from "@/lib/packages/download-audit";
import { errorResponse } from "../../../review-requests/route-utils";

type Context = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const { slug } = await context.params;
    const format = request.nextUrl.searchParams.get("format") ?? "json";
    if (format !== "json" && format !== "zip") return NextResponse.json({ error: "format must be json or zip" }, { status: 422 });
    const manifest = await getPublishedManifest(slug, request.nextUrl.searchParams.get("version") ?? undefined, client);
    const actor = (await auth())?.user?.id ?? "anonymous";
    const sourceIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const config = await client.execute({ sql: "SELECT max_downloads, window_seconds FROM package_download_rate_limit_config WHERE id = 1" });
    const maxDownloads = Number(config.rows[0]?.max_downloads ?? 10);
    const windowSeconds = Number(config.rows[0]?.window_seconds ?? 1800);
    const rate = await enforceDownloadRateLimit(client, { routeKey: `package:${slug}`, sourceIp, limit: maxDownloads, windowSeconds });
    if (!rate.allowed) {
      await recordDownloadAudit(client, { actorId: actor, sourceIp, packageSlug: slug, version: manifest.version, format, result: "rate_limited" });
      return NextResponse.json({ error: "DOWNLOAD_RATE_LIMITED" }, { status: 429, headers: { "Retry-After": String(rate.retryAfter ?? windowSeconds) } });
    }
    for (const item of manifest.items) {
      await recordDownloadAudit(client, { actorId: actor, sourceIp, packageSlug: slug, skillSlug: item.slug, version: item.version ?? manifest.version, format, result: "succeeded" });
    }
    if (format === "json") {
      return new NextResponse(serializePackageJson(manifest), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="${slug}-${manifest.version}.json"`, "X-Package-Version": manifest.version } });
    }
    const body = await serializePackageZip(manifest);
    return new NextResponse(body as unknown as BodyInit, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${slug}-${manifest.version}.zip"`, "X-Package-Version": manifest.version } });
  } catch (error) { return errorResponse(error); }
}

import type { PackageDatabaseClient } from "./types";

export type DownloadRateLimitInput = {
  routeKey: string;
  sourceIp: string;
  limit: number;
  windowSeconds: number;
  now?: number;
};

export async function enforceDownloadRateLimit(client: PackageDatabaseClient, input: DownloadRateLimitInput): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = input.now ?? Math.floor(Date.now() / 1000);
  const windowStartedAt = Math.floor(now / input.windowSeconds) * input.windowSeconds;
  const result = await client.execute({
    sql: `SELECT request_count FROM package_download_rate_limits WHERE route_key = ? AND source_ip = ? AND window_started_at = ?`,
    args: [input.routeKey, input.sourceIp, windowStartedAt],
  });
  const count = Number(result.rows[0]?.request_count ?? 0);
  if (count >= input.limit) return { allowed: false, retryAfter: windowStartedAt + input.windowSeconds - now };
  if (result.rows.length === 0) {
    await client.execute({ sql: `INSERT INTO package_download_rate_limits (route_key, source_ip, window_started_at, request_count) VALUES (?, ?, ?, 1)`, args: [input.routeKey, input.sourceIp, windowStartedAt] });
  } else {
    await client.execute({ sql: `UPDATE package_download_rate_limits SET request_count = request_count + 1 WHERE route_key = ? AND source_ip = ? AND window_started_at = ?`, args: [input.routeKey, input.sourceIp, windowStartedAt] });
  }
  return { allowed: true };
}

export async function recordDownloadAudit(client: PackageDatabaseClient, input: { actorId?: string | null; sourceIp: string; packageSlug: string; skillSlug?: string | null; version: string; format: string; result: string }) {
  await client.execute({
    sql: `INSERT INTO package_download_audit (actor_id, source_ip, package_slug, skill_slug, version, format, result) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [input.actorId ?? "anonymous", input.sourceIp, input.packageSlug, input.skillSlug ?? null, input.version, input.format, input.result],
  });
}

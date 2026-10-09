import assert from "node:assert/strict";
import test from "node:test";
import { enforceDownloadRateLimit } from "./download-audit";

test("enforceDownloadRateLimit blocks after the configured window quota", async () => {
  const rows = [{ request_count: 2 }];
  const calls: string[] = [];
  const client = { execute: async (input: string | { sql: string; args?: unknown[] }) => {
    const sql = typeof input === "string" ? input : input.sql;
    calls.push(sql);
    if (sql.includes("SELECT request_count")) return { rows };
    return { rows: [] };
  } };
  const result = await enforceDownloadRateLimit(client, { routeKey: "package:p", sourceIp: "127.0.0.1", limit: 2, windowSeconds: 1800, now: 1000 });
  assert.equal(result.allowed, false);
  assert.equal(result.retryAfter, 800);
  assert.ok(calls.some((sql) => sql.includes("package_download_rate_limits")));
});

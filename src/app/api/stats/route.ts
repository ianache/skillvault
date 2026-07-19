import { NextResponse } from "next/server";
import { client } from "@/lib/db";

export async function GET() {
  const [skills, installs, authors, recent, categories] = await Promise.all([
    client.execute({ sql: "SELECT COUNT(*) as n FROM skills WHERE status = 'published'" }),
    client.execute({ sql: "SELECT COALESCE(SUM(install_count), 0) as n FROM skills WHERE status = 'published'" }),
    client.execute({ sql: "SELECT COUNT(DISTINCT author_handle) as n FROM skills WHERE author_handle IS NOT NULL" }),
    client.execute({ sql: "SELECT COUNT(*) as n FROM skills WHERE status = 'published' AND created_at >= ?", args: [Math.floor(Date.now() / 1000) - 7 * 86400] }),
    client.execute({ sql: "SELECT COUNT(*) as n FROM categories" }),
  ]);

  const row = (r: { rows: Record<string, unknown>[] }) => Number(r.rows[0]?.n ?? 0);

  return NextResponse.json({
    published:    row(skills),
    installs:     row(installs),
    contributors: row(authors),
    recentWeek:   row(recent),
    categories:   row(categories),
    harnesses:    5, // claude, codex, opencode, agy, cursor — valor fijo
  });
}

import { client } from "./index";

async function migrate() {
  const result = await client.execute(
    `SELECT id, published_at, created_at, updated_at FROM skills`
  );

  let fixed = 0;
  for (const row of result.rows) {
    const updates: { col: string; val: number }[] = [];

    for (const col of ["published_at", "created_at", "updated_at"] as const) {
      const raw = String(row[col] ?? "");
      if (!raw || raw === "null") continue;
      const asNum = Number(raw);
      if (!isNaN(asNum) && asNum > 1_000_000_000) continue; // already a Unix ts
      // Try parsing as ISO date string
      const ts = Math.floor(new Date(raw).getTime() / 1000);
      if (!isNaN(ts) && ts > 0) updates.push({ col, val: ts });
    }

    if (updates.length > 0) {
      const setClauses = updates.map((u) => `${u.col} = ${u.val}`).join(", ");
      await client.execute(`UPDATE skills SET ${setClauses} WHERE id = ${row.id}`);
      fixed++;
    }
  }

  console.log(`✓ Converted ${fixed} skill(s) with ISO string timestamps to Unix seconds.`);
  await client.close();
}

migrate().catch(console.error);

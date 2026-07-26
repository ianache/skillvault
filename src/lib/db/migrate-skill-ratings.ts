import { client } from "./index";

async function migrate() {
  await client.execute(`CREATE TABLE IF NOT EXISTS skill_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`);

  await client.execute("CREATE INDEX IF NOT EXISTS idx_skill_ratings_skill_id ON skill_ratings(skill_id)");
  await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_ratings_skill_user ON skill_ratings(skill_id, user_id)");

  try {
    await client.execute("ALTER TABLE skills ADD COLUMN avg_rating REAL NOT NULL DEFAULT 0");
    console.log("✓ Added avg_rating column to skills.");
  } catch {
    console.log("✓ avg_rating column already exists. Skipping.");
  }

  try {
    await client.execute("ALTER TABLE skills ADD COLUMN rating_count INTEGER NOT NULL DEFAULT 0");
    console.log("✓ Added rating_count column to skills.");
  } catch {
    console.log("✓ rating_count column already exists. Skipping.");
  }

  const table = await client.execute({
    sql: `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    args: ["skill_ratings"],
  });
  if (table.rows.length !== 1) {
    throw new Error("skill_ratings table missing");
  }

  console.log("Skill ratings SQLite migration complete.");
  await client.close();
}

migrate().catch(async (error) => {
  console.error(error);
  await client.close();
  process.exit(1);
});

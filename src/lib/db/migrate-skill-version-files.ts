import { client } from "./index";

async function migrate() {
  await client.execute(`CREATE TABLE IF NOT EXISTS skill_version_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_version_id INTEGER NOT NULL,
    path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`);

  await client.execute("CREATE INDEX IF NOT EXISTS idx_skill_version_files_skill_version_id ON skill_version_files(skill_version_id)");

  const table = await client.execute({
    sql: `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    args: ["skill_version_files"],
  });
  if (table.rows.length !== 1) {
    throw new Error("skill_version_files table missing");
  }

  console.log("Skill version files SQLite migration complete.");
  await client.close();
}

migrate().catch(async (error) => {
  console.error(error);
  await client.close();
  process.exit(1);
});

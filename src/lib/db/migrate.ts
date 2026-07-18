import { client } from "./index";

async function migrate() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS skill_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_id INTEGER NOT NULL,
      path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT "",
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);
  console.log("skill_files table: OK");

  try {
    await client.execute("ALTER TABLE skills ADD COLUMN resources TEXT NOT NULL DEFAULT '[]'");
    console.log("skills.resources column: added");
  } catch {
    console.log("skills.resources column: already exists");
  }

  try {
    await client.execute("ALTER TABLE skills ADD COLUMN scripts TEXT NOT NULL DEFAULT '[]'");
    console.log("skills.scripts column: added");
  } catch {
    console.log("skills.scripts column: already exists");
  }

  console.log("Migration complete.");
  process.exit(0);
}

migrate().catch((e) => { console.error(e); process.exit(1); });

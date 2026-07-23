import { client } from "./index";

async function migrate() {
  await client.execute(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    roles TEXT NOT NULL DEFAULT '[]',
    last_login_at INTEGER NOT NULL DEFAULT (unixepoch()),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`);

  await client.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)");

  console.log("Users SQLite migration complete.");
  await client.close();
}

migrate().catch(async (error) => {
  console.error(error);
  await client.close();
  process.exit(1);
});

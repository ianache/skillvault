import { client } from "./index";

async function createIndex(sql: string) {
  try {
    await client.execute(sql);
  } catch (error) {
    if ((error as { errno?: number }).errno !== 1061) {
      throw error;
    }
  }
}

async function migrate() {
  await client.execute(`CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(191) PRIMARY KEY,
    username VARCHAR(191) NOT NULL,
    full_name VARCHAR(255) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL DEFAULT '',
    active INT NOT NULL DEFAULT 1,
    roles TEXT NOT NULL,
    last_login_at BIGINT NOT NULL DEFAULT 0,
    created_at BIGINT NOT NULL DEFAULT 0,
    updated_at BIGINT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await createIndex("CREATE INDEX idx_users_username ON users(username)");

  console.log("Users MySQL migration complete.");
  await client.close();
}

migrate().catch(async (error) => {
  console.error(error);
  await client.close();
  process.exit(1);
});

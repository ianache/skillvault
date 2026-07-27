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
  await client.execute(`CREATE TABLE IF NOT EXISTS skill_version_files (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    skill_version_id INT NOT NULL,
    path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    content LONGTEXT NOT NULL,
    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP())
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await createIndex("CREATE INDEX idx_skill_version_files_skill_version_id ON skill_version_files(skill_version_id)");

  console.log("Skill version files MySQL migration complete.");
  await client.close();
}

migrate().catch(async (error) => {
  console.error(error);
  await client.close();
  process.exit(1);
});

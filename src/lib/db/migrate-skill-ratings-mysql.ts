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

async function addColumn(sql: string) {
  try {
    await client.execute(sql);
  } catch (error) {
    if ((error as { errno?: number }).errno !== 1060) {
      throw error;
    }
  }
}

async function migrate() {
  await client.execute(`CREATE TABLE IF NOT EXISTS skill_ratings (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    skill_id INT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    rating INT NOT NULL,
    created_at BIGINT NOT NULL DEFAULT 0,
    updated_at BIGINT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await createIndex("CREATE INDEX idx_skill_ratings_skill_id ON skill_ratings(skill_id)");
  await createIndex("CREATE UNIQUE INDEX idx_skill_ratings_skill_user ON skill_ratings(skill_id, user_id)");

  await addColumn("ALTER TABLE skills ADD COLUMN avg_rating DOUBLE NOT NULL DEFAULT 0");
  await addColumn("ALTER TABLE skills ADD COLUMN rating_count INT NOT NULL DEFAULT 0");

  console.log("Skill ratings MySQL migration complete.");
  await client.close();
}

migrate().catch(async (error) => {
  console.error(error);
  await client.close();
  process.exit(1);
});

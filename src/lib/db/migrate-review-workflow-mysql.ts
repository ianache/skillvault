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
  await client.execute(`CREATE TABLE IF NOT EXISTS skill_review_requests (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    skill_id INT,
    slug VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    version VARCHAR(50) NOT NULL,
    schema_version VARCHAR(20) NOT NULL DEFAULT '1.1',
    author_id VARCHAR(255) NOT NULL,
    author_handle VARCHAR(255),
    raw_content LONGTEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reviewer_id VARCHAR(255),
    reviewer_handle VARCHAR(255),
    general_comment TEXT,
    submitted_at BIGINT NOT NULL DEFAULT 0,
    reviewed_at BIGINT,
    updated_at BIGINT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await client.execute(`CREATE TABLE IF NOT EXISTS skill_review_files (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    review_request_id INT NOT NULL,
    path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    content LONGTEXT NOT NULL,
    change_type VARCHAR(20) NOT NULL DEFAULT 'added',
    created_at BIGINT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await client.execute(`CREATE TABLE IF NOT EXISTS skill_review_comments (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    review_request_id INT NOT NULL,
    file_path VARCHAR(500),
    author_id VARCHAR(255) NOT NULL,
    author_handle VARCHAR(255),
    body TEXT NOT NULL,
    created_at BIGINT NOT NULL DEFAULT 0
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  await createIndex("CREATE INDEX idx_skill_review_requests_status ON skill_review_requests(status)");
  await createIndex("CREATE INDEX idx_skill_review_requests_author_id ON skill_review_requests(author_id)");
  await createIndex("CREATE INDEX idx_skill_review_requests_skill_id ON skill_review_requests(skill_id)");
  await createIndex("CREATE INDEX idx_skill_review_requests_slug ON skill_review_requests(slug)");
  await createIndex("CREATE INDEX idx_skill_review_files_review_request_id ON skill_review_files(review_request_id)");
  await createIndex("CREATE INDEX idx_skill_review_comments_review_request_id ON skill_review_comments(review_request_id)");

  console.log("Review workflow MySQL migration complete.");
  await client.close();
}

migrate().catch(async (error) => {
  console.error(error);
  await client.close();
  process.exit(1);
});

import { client } from "./index";

const reviewTables = [
  "skill_review_requests",
  "skill_review_files",
  "skill_review_comments",
];

async function migrate() {
  await client.execute(`CREATE TABLE IF NOT EXISTS skill_review_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    skill_id INTEGER,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    version TEXT NOT NULL,
    schema_version TEXT NOT NULL DEFAULT '1.1',
    author_id TEXT NOT NULL,
    author_handle TEXT,
    raw_content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewer_id TEXT,
    reviewer_handle TEXT,
    general_comment TEXT,
    submitted_at INTEGER NOT NULL DEFAULT (unixepoch()),
    reviewed_at INTEGER,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS skill_review_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_request_id INTEGER NOT NULL,
    path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    change_type TEXT NOT NULL DEFAULT 'added',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`);

  await client.execute(`CREATE TABLE IF NOT EXISTS skill_review_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_request_id INTEGER NOT NULL,
    file_path TEXT,
    author_id TEXT NOT NULL,
    author_handle TEXT,
    body TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`);

  await client.execute("CREATE INDEX IF NOT EXISTS idx_skill_review_requests_status ON skill_review_requests(status)");
  await client.execute("CREATE INDEX IF NOT EXISTS idx_skill_review_requests_author_id ON skill_review_requests(author_id)");
  await client.execute("CREATE INDEX IF NOT EXISTS idx_skill_review_requests_skill_id ON skill_review_requests(skill_id)");
  await client.execute("CREATE INDEX IF NOT EXISTS idx_skill_review_requests_slug ON skill_review_requests(slug)");
  await client.execute("CREATE INDEX IF NOT EXISTS idx_skill_review_files_review_request_id ON skill_review_files(review_request_id)");
  await client.execute("CREATE INDEX IF NOT EXISTS idx_skill_review_comments_review_request_id ON skill_review_comments(review_request_id)");

  const placeholders = reviewTables.map(() => "?").join(", ");
  const tables = await client.execute({
    sql: `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${placeholders})`,
    args: reviewTables,
  });
  if (tables.rows.length !== reviewTables.length) {
    throw new Error("review tables missing");
  }

  console.log("Review workflow SQLite migration complete.");
  await client.close();
}

migrate().catch(async (error) => {
  console.error(error);
  await client.close();
  process.exit(1);
});

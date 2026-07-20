# Task 1 Review Package

## Commits
17d16a3 feat: add review workflow schema

## Stat
 package.json                                |  4 +-
 src/lib/db/migrate-review-workflow-mysql.ts | 70 +++++++++++++++++++++++++++
 src/lib/db/migrate-review-workflow.ts       | 75 +++++++++++++++++++++++++++++
 src/lib/db/schema.mysql.ts                  | 41 ++++++++++++++++
 src/lib/db/schema.ts                        | 41 ++++++++++++++++
 5 files changed, 230 insertions(+), 1 deletion(-)

## Diff
diff --git a/package.json b/package.json
index 69f2503..72041b4 100644
--- a/package.json
+++ b/package.json
@@ -3,21 +3,23 @@
     "version": "0.1.0",
     "private": true,
     "packageManager": "pnpm@9.15.9",
     "scripts": {
         "dev": "next dev",
         "build": "next build",
         "start": "next start",
         "lint": "eslint",
         "migrate:requirements": "tsx src/lib/db/migrate-requirements.ts",
         "migrate:timestamps": "tsx src/lib/db/migrate-timestamps.ts",
-        "migrate:mysql": "tsx src/lib/db/migrate-mysql-init.ts"
+        "migrate:mysql": "tsx src/lib/db/migrate-mysql-init.ts",
+        "migrate:review-workflow": "tsx src/lib/db/migrate-review-workflow.ts",
+        "migrate:review-workflow:mysql": "tsx src/lib/db/migrate-review-workflow-mysql.ts"
     },
     "dependencies": {
         "@codemirror/commands": "^6.10.4",
         "@codemirror/lang-markdown": "^6.5.1",
         "@codemirror/language": "^6.12.4",
         "@codemirror/state": "^6.7.1",
         "@codemirror/theme-one-dark": "^6.1.3",
         "@codemirror/view": "^6.43.6",
         "@libsql/client": "^0.17.4",
         "@types/jszip": "^3.4.1",
diff --git a/src/lib/db/migrate-review-workflow-mysql.ts b/src/lib/db/migrate-review-workflow-mysql.ts
new file mode 100644
index 0000000..953425e
--- /dev/null
+++ b/src/lib/db/migrate-review-workflow-mysql.ts
@@ -0,0 +1,70 @@
+import { client } from "./index";
+
+async function createIndex(sql: string) {
+  try {
+    await client.execute(sql);
+  } catch (error) {
+    if ((error as { errno?: number }).errno !== 1061) {
+      throw error;
+    }
+  }
+}
+
+async function migrate() {
+  await client.execute(`CREATE TABLE IF NOT EXISTS skill_review_requests (
+    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
+    skill_id INT,
+    slug VARCHAR(255) NOT NULL,
+    name VARCHAR(255) NOT NULL,
+    description TEXT NOT NULL,
+    type VARCHAR(50) NOT NULL,
+    version VARCHAR(50) NOT NULL,
+    schema_version VARCHAR(20) NOT NULL DEFAULT '1.1',
+    author_id VARCHAR(255) NOT NULL,
+    author_handle VARCHAR(255),
+    raw_content LONGTEXT NOT NULL,
+    status VARCHAR(20) NOT NULL DEFAULT 'pending',
+    reviewer_id VARCHAR(255),
+    reviewer_handle VARCHAR(255),
+    general_comment TEXT,
+    submitted_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()),
+    reviewed_at BIGINT,
+    updated_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP())
+  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
+
+  await client.execute(`CREATE TABLE IF NOT EXISTS skill_review_files (
+    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
+    review_request_id INT NOT NULL,
+    path VARCHAR(500) NOT NULL,
+    file_type VARCHAR(50) NOT NULL,
+    content LONGTEXT NOT NULL DEFAULT (''),
+    change_type VARCHAR(20) NOT NULL DEFAULT 'added',
+    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP())
+  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
+
+  await client.execute(`CREATE TABLE IF NOT EXISTS skill_review_comments (
+    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
+    review_request_id INT NOT NULL,
+    file_path VARCHAR(500),
+    author_id VARCHAR(255) NOT NULL,
+    author_handle VARCHAR(255),
+    body TEXT NOT NULL,
+    created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP())
+  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
+
+  await createIndex("CREATE INDEX idx_skill_review_requests_status ON skill_review_requests(status)");
+  await createIndex("CREATE INDEX idx_skill_review_requests_author_id ON skill_review_requests(author_id)");
+  await createIndex("CREATE INDEX idx_skill_review_requests_skill_id ON skill_review_requests(skill_id)");
+  await createIndex("CREATE INDEX idx_skill_review_requests_slug ON skill_review_requests(slug)");
+  await createIndex("CREATE INDEX idx_skill_review_files_review_request_id ON skill_review_files(review_request_id)");
+  await createIndex("CREATE INDEX idx_skill_review_comments_review_request_id ON skill_review_comments(review_request_id)");
+
+  console.log("Review workflow MySQL migration complete.");
+  await client.close();
+}
+
+migrate().catch(async (error) => {
+  console.error(error);
+  await client.close();
+  process.exit(1);
+});
diff --git a/src/lib/db/migrate-review-workflow.ts b/src/lib/db/migrate-review-workflow.ts
new file mode 100644
index 0000000..0541b6c
--- /dev/null
+++ b/src/lib/db/migrate-review-workflow.ts
@@ -0,0 +1,75 @@
+import { client } from "./index";
+
+const reviewTables = [
+  "skill_review_requests",
+  "skill_review_files",
+  "skill_review_comments",
+];
+
+async function migrate() {
+  await client.execute(`CREATE TABLE IF NOT EXISTS skill_review_requests (
+    id INTEGER PRIMARY KEY AUTOINCREMENT,
+    skill_id INTEGER,
+    slug TEXT NOT NULL,
+    name TEXT NOT NULL,
+    description TEXT NOT NULL,
+    type TEXT NOT NULL,
+    version TEXT NOT NULL,
+    schema_version TEXT NOT NULL DEFAULT '1.1',
+    author_id TEXT NOT NULL,
+    author_handle TEXT,
+    raw_content TEXT NOT NULL,
+    status TEXT NOT NULL DEFAULT 'pending',
+    reviewer_id TEXT,
+    reviewer_handle TEXT,
+    general_comment TEXT,
+    submitted_at INTEGER NOT NULL DEFAULT (unixepoch()),
+    reviewed_at INTEGER,
+    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
+  )`);
+
+  await client.execute(`CREATE TABLE IF NOT EXISTS skill_review_files (
+    id INTEGER PRIMARY KEY AUTOINCREMENT,
+    review_request_id INTEGER NOT NULL,
+    path TEXT NOT NULL,
+    file_type TEXT NOT NULL,
+    content TEXT NOT NULL DEFAULT '',
+    change_type TEXT NOT NULL DEFAULT 'added',
+    created_at INTEGER NOT NULL DEFAULT (unixepoch())
+  )`);
+
+  await client.execute(`CREATE TABLE IF NOT EXISTS skill_review_comments (
+    id INTEGER PRIMARY KEY AUTOINCREMENT,
+    review_request_id INTEGER NOT NULL,
+    file_path TEXT,
+    author_id TEXT NOT NULL,
+    author_handle TEXT,
+    body TEXT NOT NULL,
+    created_at INTEGER NOT NULL DEFAULT (unixepoch())
+  )`);
+
+  await client.execute("CREATE INDEX IF NOT EXISTS idx_skill_review_requests_status ON skill_review_requests(status)");
+  await client.execute("CREATE INDEX IF NOT EXISTS idx_skill_review_requests_author_id ON skill_review_requests(author_id)");
+  await client.execute("CREATE INDEX IF NOT EXISTS idx_skill_review_requests_skill_id ON skill_review_requests(skill_id)");
+  await client.execute("CREATE INDEX IF NOT EXISTS idx_skill_review_requests_slug ON skill_review_requests(slug)");
+  await client.execute("CREATE INDEX IF NOT EXISTS idx_skill_review_files_review_request_id ON skill_review_files(review_request_id)");
+  await client.execute("CREATE INDEX IF NOT EXISTS idx_skill_review_comments_review_request_id ON skill_review_comments(review_request_id)");
+
+  const placeholders = reviewTables.map(() => "?").join(", ");
+  const tables = await client.execute({
+    sql: `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${placeholders})`,
+    args: reviewTables,
+  });
+  if (tables.rows.length !== reviewTables.length) {
+    throw new Error("review tables missing");
+  }
+
+  console.log("Review workflow SQLite migration complete.");
+  await client.close();
+}
+
+migrate().catch(async (error) => {
+  console.error(error);
+  await client.close();
+  process.exit(1);
+});
diff --git a/src/lib/db/schema.mysql.ts b/src/lib/db/schema.mysql.ts
index 0586a09..215b8ae 100644
--- a/src/lib/db/schema.mysql.ts
+++ b/src/lib/db/schema.mysql.ts
@@ -34,20 +34,61 @@ export const skillVersions = mysqlTable("skill_versions", {

 export const skillFiles = mysqlTable("skill_files", {
   id: int("id").autoincrement().primaryKey(),
   skillId: int("skill_id").notNull(),
   path: varchar("path", { length: 500 }).notNull(),
   fileType: varchar("file_type", { length: 50 }).notNull(),
   content: text("content").notNull().default(""),
   createdAt: bigint("created_at", { mode: "number" }).notNull().default(sql`(UNIX_TIMESTAMP())`),
 });

+export const skillReviewRequests = mysqlTable("skill_review_requests", {
+  id: int("id").autoincrement().primaryKey(),
+  skillId: int("skill_id"),
+  slug: varchar("slug", { length: 255 }).notNull(),
+  name: varchar("name", { length: 255 }).notNull(),
+  description: text("description").notNull(),
+  type: varchar("type", { length: 50 }).notNull(),
+  version: varchar("version", { length: 50 }).notNull(),
+  schemaVersion: varchar("schema_version", { length: 20 }).notNull().default("1.1"),
+  authorId: varchar("author_id", { length: 255 }).notNull(),
+  authorHandle: varchar("author_handle", { length: 255 }),
+  rawContent: text("raw_content").notNull(),
+  status: varchar("status", { length: 20 }).notNull().default("pending"),
+  reviewerId: varchar("reviewer_id", { length: 255 }),
+  reviewerHandle: varchar("reviewer_handle", { length: 255 }),
+  generalComment: text("general_comment"),
+  submittedAt: bigint("submitted_at", { mode: "number" }).notNull().default(sql`(UNIX_TIMESTAMP())`),
+  reviewedAt: bigint("reviewed_at", { mode: "number" }),
+  updatedAt: bigint("updated_at", { mode: "number" }).notNull().default(sql`(UNIX_TIMESTAMP())`),
+});
+
+export const skillReviewFiles = mysqlTable("skill_review_files", {
+  id: int("id").autoincrement().primaryKey(),
+  reviewRequestId: int("review_request_id").notNull(),
+  path: varchar("path", { length: 500 }).notNull(),
+  fileType: varchar("file_type", { length: 50 }).notNull(),
+  content: text("content").notNull().default(""),
+  changeType: varchar("change_type", { length: 20 }).notNull().default("added"),
+  createdAt: bigint("created_at", { mode: "number" }).notNull().default(sql`(UNIX_TIMESTAMP())`),
+});
+
+export const skillReviewComments = mysqlTable("skill_review_comments", {
+  id: int("id").autoincrement().primaryKey(),
+  reviewRequestId: int("review_request_id").notNull(),
+  filePath: varchar("file_path", { length: 500 }),
+  authorId: varchar("author_id", { length: 255 }).notNull(),
+  authorHandle: varchar("author_handle", { length: 255 }),
+  body: text("body").notNull(),
+  createdAt: bigint("created_at", { mode: "number" }).notNull().default(sql`(UNIX_TIMESTAMP())`),
+});
+
 export const categories = mysqlTable("categories", {
   id: int("id").autoincrement().primaryKey(),
   slug: varchar("slug", { length: 100 }).notNull().unique(),
   label: varchar("label", { length: 100 }).notNull(),
   icon: varchar("icon", { length: 20 }).notNull().default("📦"),
   color: varchar("color", { length: 20 }).notNull().default("#8590A8"),
   description: text("description").notNull().default(""),
   sortOrder: int("sort_order").notNull().default(0),
   createdAt: bigint("created_at", { mode: "number" }).notNull().default(sql`(UNIX_TIMESTAMP())`),
 });
diff --git a/src/lib/db/schema.ts b/src/lib/db/schema.ts
index d937406..34145bd 100644
--- a/src/lib/db/schema.ts
+++ b/src/lib/db/schema.ts
@@ -33,20 +33,61 @@ export const skillVersions = sqliteTable("skill_versions", {

 export const skillFiles = sqliteTable("skill_files", {
   id: integer("id").primaryKey({ autoIncrement: true }),
   skillId: integer("skill_id").notNull(),
   path: text("path").notNull(),          // e.g. "resources/reference.md"
   fileType: text("file_type").notNull(), // "resource" | "script"
   content: text("content").notNull().default(""),
   createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
 });

+export const skillReviewRequests = sqliteTable("skill_review_requests", {
+  id: integer("id").primaryKey({ autoIncrement: true }),
+  skillId: integer("skill_id"),
+  slug: text("slug").notNull(),
+  name: text("name").notNull(),
+  description: text("description").notNull(),
+  type: text("type").notNull(),
+  version: text("version").notNull(),
+  schemaVersion: text("schema_version").notNull().default("1.1"),
+  authorId: text("author_id").notNull(),
+  authorHandle: text("author_handle"),
+  rawContent: text("raw_content").notNull(),
+  status: text("status").notNull().default("pending"),
+  reviewerId: text("reviewer_id"),
+  reviewerHandle: text("reviewer_handle"),
+  generalComment: text("general_comment"),
+  submittedAt: integer("submitted_at").notNull().default(sql`(unixepoch())`),
+  reviewedAt: integer("reviewed_at"),
+  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
+});
+
+export const skillReviewFiles = sqliteTable("skill_review_files", {
+  id: integer("id").primaryKey({ autoIncrement: true }),
+  reviewRequestId: integer("review_request_id").notNull(),
+  path: text("path").notNull(),
+  fileType: text("file_type").notNull(),
+  content: text("content").notNull().default(""),
+  changeType: text("change_type").notNull().default("added"),
+  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
+});
+
+export const skillReviewComments = sqliteTable("skill_review_comments", {
+  id: integer("id").primaryKey({ autoIncrement: true }),
+  reviewRequestId: integer("review_request_id").notNull(),
+  filePath: text("file_path"),
+  authorId: text("author_id").notNull(),
+  authorHandle: text("author_handle"),
+  body: text("body").notNull(),
+  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
+});
+
 export const categories = sqliteTable("categories", {
   id: integer("id").primaryKey({ autoIncrement: true }),
   slug: text("slug").notNull().unique(),
   label: text("label").notNull(),
   icon: text("icon").notNull().default("📦"),
   color: text("color").notNull().default("#8590A8"),
   description: text("description").notNull().default(""),
   sortOrder: integer("sort_order").notNull().default(0),
   createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
 });

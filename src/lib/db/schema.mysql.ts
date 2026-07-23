import { mysqlTable, varchar, text, int, bigint } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const skills = mysqlTable("skills", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  authorId: varchar("author_id", { length: 255 }),
  authorHandle: varchar("author_handle", { length: 255 }),
  version: varchar("version", { length: 50 }).notNull().default("1.0.0"),
  schemaVersion: varchar("schema_version", { length: 20 }).notNull().default("1.1"),
  triggers: text("triggers").notNull().default("[]"),
  tools: text("tools").notNull().default("[]"),
  compatibility: text("compatibility").notNull().default('["claude"]'),
  dependencies: text("dependencies").notNull().default("[]"),
  configRequirements: text("config_requirements").notNull().default("[]"),
  rawContent: text("raw_content").notNull().default(""),
  status: varchar("status", { length: 20 }).notNull().default("published"),
  installCount: int("install_count").notNull().default(0),
  createdAt: bigint("created_at", { mode: "number" }).notNull().default(0),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().default(0),
  publishedAt: bigint("published_at", { mode: "number" }),
});

export const skillVersions = mysqlTable("skill_versions", {
  id: int("id").autoincrement().primaryKey(),
  skillId: int("skill_id").notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  rawContent: text("raw_content").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull().default(0),
});

export const skillFiles = mysqlTable("skill_files", {
  id: int("id").autoincrement().primaryKey(),
  skillId: int("skill_id").notNull(),
  path: varchar("path", { length: 500 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  content: text("content").notNull().default(""),
  createdAt: bigint("created_at", { mode: "number" }).notNull().default(0),
});

export const skillReviewRequests = mysqlTable("skill_review_requests", {
  id: int("id").autoincrement().primaryKey(),
  skillId: int("skill_id"),
  slug: varchar("slug", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  schemaVersion: varchar("schema_version", { length: 20 }).notNull().default("1.1"),
  authorId: varchar("author_id", { length: 255 }).notNull(),
  authorHandle: varchar("author_handle", { length: 255 }),
  rawContent: text("raw_content").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  reviewerId: varchar("reviewer_id", { length: 255 }),
  reviewerHandle: varchar("reviewer_handle", { length: 255 }),
  generalComment: text("general_comment"),
  submittedAt: bigint("submitted_at", { mode: "number" }).notNull().default(0),
  reviewedAt: bigint("reviewed_at", { mode: "number" }),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().default(0),
});

export const skillReviewFiles = mysqlTable("skill_review_files", {
  id: int("id").autoincrement().primaryKey(),
  reviewRequestId: int("review_request_id").notNull(),
  path: varchar("path", { length: 500 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  content: text("content").notNull().default(""),
  changeType: varchar("change_type", { length: 20 }).notNull().default("added"),
  createdAt: bigint("created_at", { mode: "number" }).notNull().default(0),
});

export const skillReviewComments = mysqlTable("skill_review_comments", {
  id: int("id").autoincrement().primaryKey(),
  reviewRequestId: int("review_request_id").notNull(),
  filePath: varchar("file_path", { length: 500 }),
  authorId: varchar("author_id", { length: 255 }).notNull(),
  authorHandle: varchar("author_handle", { length: 255 }),
  body: text("body").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull().default(0),
});

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  label: varchar("label", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 20 }).notNull().default("📦"),
  color: varchar("color", { length: 20 }).notNull().default("#8590A8"),
  description: text("description").notNull().default(""),
  sortOrder: int("sort_order").notNull().default(0),
  createdAt: bigint("created_at", { mode: "number" }).notNull().default(0),
});

export const installs = mysqlTable("installs", {
  id: int("id").autoincrement().primaryKey(),
  skillId: int("skill_id").notNull(),
  userId: varchar("user_id", { length: 255 }),
  harness: varchar("harness", { length: 50 }).notNull().default("claude"),
  scope: varchar("scope", { length: 20 }).notNull().default("global"),
  skillVersion: varchar("skill_version", { length: 50 }).notNull(),
  installedAt: bigint("installed_at", { mode: "number" }).notNull().default(0),
});

export const users = mysqlTable("users", {
  id: varchar("id", { length: 255 }).primaryKey(),
  username: varchar("username", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull().default(""),
  email: varchar("email", { length: 255 }).notNull().default(""),
  active: int("active").notNull().default(1),
  roles: text("roles").notNull().default("[]"),
  lastLoginAt: bigint("last_login_at", { mode: "number" }).notNull().default(0),
  createdAt: bigint("created_at", { mode: "number" }).notNull().default(0),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().default(0),
});

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const skills = sqliteTable("skills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // code | docs | data | ui | infra | ai
  authorId: text("author_id"),
  authorHandle: text("author_handle"),
  version: text("version").notNull().default("1.0.0"),
  schemaVersion: text("schema_version").notNull().default("1.1"),
  triggers: text("triggers").notNull().default("[]"),
  tools: text("tools").notNull().default("[]"),
  compatibility: text("compatibility").notNull().default('["claude"]'),
  dependencies: text("dependencies").notNull().default("[]"),
  rawContent: text("raw_content").notNull().default(""),
  status: text("status").notNull().default("published"),
  installCount: integer("install_count").notNull().default(0),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
  publishedAt: integer("published_at"),
});

export const skillVersions = sqliteTable("skill_versions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skillId: integer("skill_id").notNull(),
  version: text("version").notNull(),
  rawContent: text("raw_content").notNull(),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

export const skillFiles = sqliteTable("skill_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skillId: integer("skill_id").notNull(),
  path: text("path").notNull(),          // e.g. "resources/reference.md"
  fileType: text("file_type").notNull(), // "resource" | "script"
  content: text("content").notNull().default(""),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

export const skillReviewRequests = sqliteTable("skill_review_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skillId: integer("skill_id"),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  version: text("version").notNull(),
  schemaVersion: text("schema_version").notNull().default("1.1"),
  authorId: text("author_id").notNull(),
  authorHandle: text("author_handle"),
  rawContent: text("raw_content").notNull(),
  status: text("status").notNull().default("pending"),
  reviewerId: text("reviewer_id"),
  reviewerHandle: text("reviewer_handle"),
  generalComment: text("general_comment"),
  submittedAt: integer("submitted_at").notNull().default(sql`(unixepoch())`),
  reviewedAt: integer("reviewed_at"),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

export const skillReviewFiles = sqliteTable("skill_review_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reviewRequestId: integer("review_request_id").notNull(),
  path: text("path").notNull(),
  fileType: text("file_type").notNull(),
  content: text("content").notNull().default(""),
  changeType: text("change_type").notNull().default("added"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

export const skillReviewComments = sqliteTable("skill_review_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reviewRequestId: integer("review_request_id").notNull(),
  filePath: text("file_path"),
  authorId: text("author_id").notNull(),
  authorHandle: text("author_handle"),
  body: text("body").notNull(),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

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

export const installs = sqliteTable("installs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skillId: integer("skill_id").notNull(),
  userId: text("user_id"),
  harness: text("harness").notNull().default("claude"),
  scope: text("scope").notNull().default("global"),
  skillVersion: text("skill_version").notNull(),
  installedAt: integer("installed_at").notNull().default(sql`(unixepoch())`),
});

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;

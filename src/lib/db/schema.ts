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

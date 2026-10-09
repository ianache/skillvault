import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
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
  avgRating: real("avg_rating").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
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

export const skillVersionFiles = sqliteTable("skill_version_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skillVersionId: integer("skill_version_id").notNull(),
  path: text("path").notNull(),
  fileType: text("file_type").notNull(), // "resource" | "script"
  content: text("content").notNull().default(""),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

export const skillReviewRequests = sqliteTable("skill_review_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skillId: integer("skill_id"),
  resourceType: text("resource_type").notNull().default("skill"),
  resourceId: integer("resource_id"),
  packageVersionId: integer("package_version_id"),
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

export const skillRatings = sqliteTable("skill_ratings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skillId: integer("skill_id").notNull(),
  userId: text("user_id").notNull(),
  rating: integer("rating").notNull(),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // Keycloak subject (sub)
  username: text("username").notNull(),
  fullName: text("full_name").notNull().default(""),
  email: text("email").notNull().default(""),
  active: integer("active").notNull().default(1),
  roles: text("roles").notNull().default("[]"), // JSON array of app roles (admin | author | reviewer)
  lastLoginAt: integer("last_login_at").notNull().default(sql`(unixepoch())`),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

export const packages = sqliteTable("packages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull().default("draft"),
  currentVersion: text("current_version"),
  ownerTeamId: text("owner_team_id"),
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

export const packageVersions = sqliteTable("package_versions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  packageId: integer("package_id").notNull(),
  version: text("version").notNull(),
  releaseStatus: text("release_status").notNull().default("draft"),
  manifestJson: text("manifest_json").notNull().default("{}"),
  createdBy: text("created_by").notNull(),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  publishedAt: integer("published_at"),
});

export const packageItems = sqliteTable("package_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  packageVersionId: integer("package_version_id").notNull(),
  skillId: integer("skill_id").notNull(),
  versionPolicy: text("version_policy").notNull(),
  pinnedVersion: text("pinned_version"),
  position: integer("position").notNull(),
  retiredAtPublish: integer("retired_at_publish"),
});

export const packageInstallRuns = sqliteTable("package_install_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  packageVersionId: integer("package_version_id").notNull(),
  harness: text("harness").notNull(),
  scope: text("scope").notNull(),
  requestedBy: text("requested_by"),
  status: text("status").notNull().default("pending"),
  failureCode: text("failure_code"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
  expiresAt: integer("expires_at").notNull(),
});

export const packageInstallItems = sqliteTable("package_install_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  runId: integer("run_id").notNull(),
  skillId: integer("skill_id").notNull(),
  resolvedVersion: text("resolved_version"),
  status: text("status").notNull().default("pending"),
  destination: text("destination"),
  errorCode: text("error_code"),
  position: integer("position").notNull(),
});

export const packageDownloadAudit = sqliteTable("package_download_audit", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actorId: text("actor_id"),
  occurredAt: integer("occurred_at").notNull().default(sql`(unixepoch())`),
  sourceIp: text("source_ip").notNull(),
  packageSlug: text("package_slug").notNull(),
  skillSlug: text("skill_slug"),
  version: text("version").notNull(),
  format: text("format").notNull(),
  result: text("result").notNull(),
});

export const packageDownloadRateLimits = sqliteTable("package_download_rate_limits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  routeKey: text("route_key").notNull(),
  sourceIp: text("source_ip").notNull(),
  windowStartedAt: integer("window_started_at").notNull(),
  requestCount: integer("request_count").notNull().default(0),
});

export const packageDownloadRateLimitConfig = sqliteTable("package_download_rate_limit_config", {
  id: integer("id").primaryKey(),
  maxDownloads: integer("max_downloads").notNull().default(10),
  windowSeconds: integer("window_seconds").notNull().default(1800),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SkillRating = typeof skillRatings.$inferSelect;
export type NewSkillRating = typeof skillRatings.$inferInsert;

import { mysqlTable, varchar, text, int, bigint, double } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const skills = mysqlTable("skills", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 191 }).notNull().unique(),
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
  avgRating: double("avg_rating").notNull().default(0),
  ratingCount: int("rating_count").notNull().default(0),
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

export const skillVersionFiles = mysqlTable("skill_version_files", {
  id: int("id").autoincrement().primaryKey(),
  skillVersionId: int("skill_version_id").notNull(),
  path: varchar("path", { length: 500 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  content: text("content").notNull().default(""),
  createdAt: bigint("created_at", { mode: "number" }).notNull().default(sql`(UNIX_TIMESTAMP())`),
});

export const skillReviewRequests = mysqlTable("skill_review_requests", {
  id: int("id").autoincrement().primaryKey(),
  skillId: int("skill_id"),
  resourceType: varchar("resource_type", { length: 20 }).notNull().default("skill"),
  resourceId: int("resource_id"),
  packageVersionId: int("package_version_id"),
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

export const skillRatings = mysqlTable("skill_ratings", {
  id: int("id").autoincrement().primaryKey(),
  skillId: int("skill_id").notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  rating: int("rating").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull().default(0),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().default(0),
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

export const packages = mysqlTable("packages", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  role: varchar("role", { length: 255 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("draft"),
  currentVersion: varchar("current_version", { length: 50 }),
  ownerTeamId: varchar("owner_team_id", { length: 255 }),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull().default(0),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().default(0),
});

export const packageVersions = mysqlTable("package_versions", {
  id: int("id").autoincrement().primaryKey(),
  packageId: int("package_id").notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  releaseStatus: varchar("release_status", { length: 30 }).notNull().default("draft"),
  manifestJson: text("manifest_json").notNull(),
  createdBy: varchar("created_by", { length: 255 }).notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull().default(0),
  publishedAt: bigint("published_at", { mode: "number" }),
});

export const packageItems = mysqlTable("package_items", {
  id: int("id").autoincrement().primaryKey(),
  packageVersionId: int("package_version_id").notNull(),
  skillId: int("skill_id").notNull(),
  versionPolicy: varchar("version_policy", { length: 20 }).notNull(),
  pinnedVersion: varchar("pinned_version", { length: 50 }),
  position: int("position").notNull(),
  retiredAtPublish: bigint("retired_at_publish", { mode: "number" }),
});

export const packageInstallRuns = mysqlTable("package_install_runs", {
  id: int("id").autoincrement().primaryKey(),
  packageVersionId: int("package_version_id").notNull(),
  harness: varchar("harness", { length: 50 }).notNull(),
  scope: varchar("scope", { length: 20 }).notNull(),
  requestedBy: varchar("requested_by", { length: 255 }),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  failureCode: varchar("failure_code", { length: 100 }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().default(0),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().default(0),
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
});

export const packageInstallItems = mysqlTable("package_install_items", {
  id: int("id").autoincrement().primaryKey(),
  runId: int("run_id").notNull(),
  skillId: int("skill_id").notNull(),
  resolvedVersion: varchar("resolved_version", { length: 50 }),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  destination: varchar("destination", { length: 1000 }),
  errorCode: varchar("error_code", { length: 100 }),
  position: int("position").notNull(),
});

export const packageDownloadAudit = mysqlTable("package_download_audit", {
  id: int("id").autoincrement().primaryKey(),
  actorId: varchar("actor_id", { length: 255 }),
  occurredAt: bigint("occurred_at", { mode: "number" }).notNull().default(0),
  sourceIp: varchar("source_ip", { length: 100 }).notNull(),
  packageSlug: varchar("package_slug", { length: 255 }).notNull(),
  skillSlug: varchar("skill_slug", { length: 255 }),
  version: varchar("version", { length: 50 }).notNull(),
  format: varchar("format", { length: 10 }).notNull(),
  result: varchar("result", { length: 30 }).notNull(),
});

export const packageDownloadRateLimits = mysqlTable("package_download_rate_limits", {
  id: int("id").autoincrement().primaryKey(),
  routeKey: varchar("route_key", { length: 255 }).notNull(),
  sourceIp: varchar("source_ip", { length: 100 }).notNull(),
  windowStartedAt: bigint("window_started_at", { mode: "number" }).notNull(),
  requestCount: int("request_count").notNull().default(0),
});

export const packageDownloadRateLimitConfig = mysqlTable("package_download_rate_limit_config", {
  id: int("id").primaryKey(),
  maxDownloads: int("max_downloads").notNull().default(10),
  windowSeconds: int("window_seconds").notNull().default(1800),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().default(0),
});

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type SkillRating = typeof skillRatings.$inferSelect;
export type NewSkillRating = typeof skillRatings.$inferInsert;

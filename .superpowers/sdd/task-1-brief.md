## Task 1: Review Schema And Migrations

**Files:**

- Modify: `src/lib/db/schema.ts`
- Modify: `src/lib/db/schema.mysql.ts`
- Create: `src/lib/db/migrate-review-workflow.ts`
- Create: `src/lib/db/migrate-review-workflow-mysql.ts`
- Modify: `package.json`

**Interfaces:**

- Produces SQLite/MySQL tables named `skill_review_requests`, `skill_review_files`, and `skill_review_comments`.
- Produces scripts:
  - `pnpm migrate:review-workflow`
  - `pnpm migrate:review-workflow:mysql`

- [ ] **Step 1: Write failing migration/schema verification**

Create a temporary verification script while implementing, or add a permanent test if a root test runner is introduced in Task 2. The check must query SQLite table creation:

```ts
const tables = await client.execute(`
  SELECT name FROM sqlite_master
  WHERE type = 'table'
  AND name IN ('skill_review_requests', 'skill_review_files', 'skill_review_comments')
`);
if (tables.rows.length !== 3) throw new Error("review tables missing");
```

- [ ] **Step 2: Run verification and confirm failure**

Run:

```bash
pnpm tsx src/lib/db/migrate-review-workflow.ts
```

Expected before implementation: failure because the migration file does not exist.

- [ ] **Step 3: Add schema definitions**

In `src/lib/db/schema.ts`, add:

```ts
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
```

In `src/lib/db/schema.mysql.ts`, add the same logical fields with `int`, `varchar`, `text`, and `bigint` types.

Add `skillReviewFiles` and `skillReviewComments` with the fields from the design spec.

- [ ] **Step 4: Add migrations**

Create SQLite migration using `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` for all indexes listed in the spec. Create MySQL migration using `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX` statements guarded by MySQL-compatible checks or idempotent error handling.

- [ ] **Step 5: Add package scripts**

Add:

```json
"migrate:review-workflow": "tsx src/lib/db/migrate-review-workflow.ts",
"migrate:review-workflow:mysql": "tsx src/lib/db/migrate-review-workflow-mysql.ts"
```

- [ ] **Step 6: Run migration verification**

Run:

```bash
pnpm migrate:review-workflow
```

Expected: exit 0 and review tables exist in the configured SQLite database.

- [ ] **Step 7: Commit**

```bash
git add src/lib/db/schema.ts src/lib/db/schema.mysql.ts src/lib/db/migrate-review-workflow.ts src/lib/db/migrate-review-workflow-mysql.ts package.json
git commit -m "feat: add review workflow schema"
```

---

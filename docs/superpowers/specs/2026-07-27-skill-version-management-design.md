# Skill Version Management Design

## Context

The review/approval pipeline (`src/lib/review/service.ts`) already supports republishing over an existing skill: `createReviewRequest()` accepts a `skillId`, and `activateApprovedRequest()` branches on it to `UPDATE skills` instead of `INSERT`. Every approval (first publish or later version) appends a row to `skill_versions (skill_id, version, raw_content, created_at)`, so the `SKILL.md` text of every published version is archived.

Three gaps make this weaker than it looks:

1. **No semver ordering check.** `createReviewRequest()` only rejects a duplicate *open* request for the same slug+version. Nothing compares the submitted version against the currently published `skills.version`. A resubmission of the same version, or a lower one, is accepted.
2. **Attached files are not versioned.** On every approval, `activateApprovedRequest()` does `DELETE FROM skill_files WHERE skill_id = ?` and reinserts the new set. Only the current version's attached files exist anywhere — older versions' `resources/`/`scripts/` content is gone the moment a new version is approved, even though their `SKILL.md` text survives in `skill_versions`.
3. **The version history is write-only from the reader's perspective.** `GET /api/skills/[slug]/versions` returns `version` + `created_at` only (`VersionHistory.tsx` renders a flat list). There is no way to see or retrieve the full content of a historical version.

This design closes those three gaps. It does not change the review/approval process itself (same reviewer requirement, same 4-eyes rule, same pipeline for every version regardless of bump size — confirmed explicitly during brainstorming).

## Goal

- Reject a new-version submission unless its semver is strictly greater than the currently published version.
- Archive attached files per version, symmetric with how `skill_versions` already archives `raw_content`.
- Let a user view or download the full content (SKILL.md + attached files) of any historical version from the UI.
- Let a user roll back by reusing a historical version's content as the starting point for a new submission — through the normal review pipeline, with a new, higher version number.

## Non-Goals

- No diff/changelog view between versions (flat per-version content only).
- No way to install or fetch a specific historical version through the CLI or the public install-facing API (`GET /api/skills/[slug]`, `/install`). Those always resolve to the latest published version. Whether/how a specific version becomes installable is deferred to the separate zip-download spec.
- No auto-approval or lighter review path based on bump size (patch vs. minor vs. major). Every version submission — including rollback — goes through the same reviewer + 4-eyes pipeline as a first-time publish.
- No change to the existing `skill_files` table, `/api/skills/[slug]/files`, `/download`, or `FileTree` — they keep representing "current published state" exactly as today.

## Architecture

### 1. Semver ordering check

Add a small comparison helper next to the existing `semverOrDefault()` in `src/lib/review/service.ts`:

```ts
function compareSemver(a: string, b: string): number {
  const [aMaj, aMin, aPatch] = a.split(".").map(Number);
  const [bMaj, bMin, bPatch] = b.split(".").map(Number);
  if (aMaj !== bMaj) return aMaj - bMaj;
  if (aMin !== bMin) return aMin - bMin;
  return aPatch - bPatch;
}
```

In `createReviewRequest()`, when `input.skillId` is provided, look up the target skill's current `version` (a `skillId` only ever references an already-published row — `skills` has no draft/unpublished state, so no separate status check is needed). If `compareSemver(frontmatter.version, currentVersion) <= 0`, throw:

```
`La version ${frontmatter.version} debe ser mayor a la version publicada actual (${currentVersion})`
```

This runs after `relaxedSubmission()` produces `frontmatter.version` (which is already guaranteed to match `X.Y.Z` via `semverOrDefault`), so the comparison never sees malformed input.

### 2. `skill_version_files` table

New table, mirroring `skill_files` but keyed by version instead of by skill:

```sql
CREATE TABLE IF NOT EXISTS skill_version_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_version_id INTEGER NOT NULL,
  path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
)
```

(MySQL variant: `BIGINT AUTO_INCREMENT`, `UNIX_TIMESTAMP()`, per the project's existing dual-schema pattern.)

Added to both `src/lib/db/schema.ts` and `src/lib/db/schema.mysql.ts`, plus a new idempotent migration pair (`migrate-skill-version-files.ts` / `migrate-skill-version-files-mysql.ts`) following the existing hand-written `CREATE TABLE IF NOT EXISTS` convention — not drizzle-kit.

In `activateApprovedRequest()`, right after the existing `INSERT INTO skill_versions ...`, capture the inserted row's `id` and insert one `skill_version_files` row per file in `reviewFiles` (the same list already used to replace `skill_files`). This is additive: `skill_files` continues to be deleted and reinserted exactly as today, unchanged.

### 3. Viewing a historical version

New endpoint, public/unauthenticated like the rest of `src/app/api/skills/**` reads:

```
GET /api/skills/[slug]/versions/[version]
→ { version, createdAt, rawContent, files: [{ path, fileType, content }] }
```

Looks up `skill_versions` by `skill_id` (resolved from `slug`) + `version`, joins its `skill_version_files`. 404 if the skill or that exact version doesn't exist.

`VersionHistory.tsx` gains an expand action per row that fetches this endpoint and shows the `SKILL.md` content (reusing the existing CodeMirror/markdown preview already used in `Step2Editor`) plus a file list. A "Descargar .zip" action on the expanded view reuses the same JSZip pattern as `src/app/api/skills/[slug]/download/route.ts`, sourced from this endpoint's data instead of the current-skill tables.

### 4. Rollback

"Usar esta version como base" button on an expanded historical version, visible only on `/skills/[slug]/edit`. It calls the endpoint from §3 and feeds `rawContent` into `SkillEditor`'s content state (same prop `SkillEditor` already takes as `initialContent`), replacing whatever the author had open. The author still has to bump the version themselves before submitting — enforced by §1, no special-cased "restore" logic in the service layer. This is literally "prefill the editor from history," not a distinct backend operation.

## Testing

Follows the existing pattern in `src/lib/review/service.test.ts` (`tsx --test`, no separate framework):

- `compareSemver()` unit cases (equal, lower major/minor/patch, higher major/minor/patch).
- `createReviewRequest()` rejects a version submission with `skillId` set when the version is not greater than the currently published one; accepts when it is.
- `activateApprovedRequest()` (via `decideReviewRequest` approve path) populates `skill_version_files` alongside `skill_versions` and leaves `skill_files` behavior unchanged.
- New route handler test for `GET /api/skills/[slug]/versions/[version]`: 404 for unknown skill, 404 for unknown version, 200 with expected shape for a known one.

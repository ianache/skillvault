# Task 4 Report: Archive attached files on every approval

## Result

Implemented archival of every non-deleted attached review file into `skill_version_files` for the `skill_versions` row created during approval.

## RED Evidence

Command:

```text
pnpm exec tsx --test --test-name-pattern="archives attached files" src/lib/review/service.test.ts
```

Result: failed as expected. The new test reached approval but `fakeClient.insertedVersionFiles.length` was `0`, while the expected value was `1` (`0 !== 1`).

## GREEN Evidence

Command:

```text
pnpm exec tsx --test src/lib/review/service.test.ts
```

Result: passed. All 30 service tests passed, including the new archival test.

`git diff --check` also passed.

## Files Changed

- `src/lib/review/service.test.ts`
  - Added `insertedVersionFiles` fake-client state.
  - Added fake responses for the inserted version lookup and version-file insert.
  - Added coverage proving deleted files are excluded and the archived file references the created version id.
- `src/lib/review/service.ts`
  - Looks up the newly inserted `skill_versions.id`.
  - Inserts non-deleted review files into `skill_version_files` using the existing mapped review-file data.

## Self-Review

- The implementation is inside the approval activation transaction path.
- The version lookup fails explicitly when no version row is returned.
- Deleted files are skipped consistently with the existing `skill_files` replacement loop.
- No unrelated files or refactors were changed.

## Concerns

- Test commands emit the existing pnpm warning that the `pnpm` field in `package.json` is ignored. The warning did not cause failures.


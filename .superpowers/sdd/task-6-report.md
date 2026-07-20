# Task 6 Report

Status: DONE_WITH_CONCERNS

## Commit

- `feat: activate approved skill versions`

## Files Changed

- `src/lib/review/service.ts`
- `src/lib/review/service.test.ts`
- `src/lib/review/api-contract.test.ts`
- `src/app/api/skills/[slug]/download/route.ts`
- `src/app/api/skills/[slug]/install/route.ts`
- `src/app/api/skills/[slug]/versions/route.ts`
- `.superpowers/sdd/task-6-report.md`

## Tests Run

- RED observed: `pnpm exec tsx --test src/lib/review/service.test.ts src/lib/review/api-contract.test.ts` failed with missing activation writes and missing public handler factories.
- `pnpm exec tsx --test src/lib/review/*.test.ts` passed: 29 tests.
- Changed-file ESLint passed.
- `next build` passed.
- `pnpm lint` could not start because the local pnpm is `9.0.0` and the repository requires `9.15.9`. Running the installed ESLint binary showed 12 existing errors outside Task 6 files.

## Self-Review

- Approval publishes a new or existing proposal, replaces published attachments while skipping deleted review files, snapshots the version, and only marks the request approved after activation succeeds.
- Activation uses a transaction and rolls back published writes on activation errors.
- Catalog/detail behavior already read published `skills` rows; regression tests cover that behavior. Download, install, and version routes now expose testable handler factories and explicitly remain scoped to published rows.
- `git diff --check` passed.

## Concerns

- Repository-wide lint remains red due to pre-existing errors in unrelated UI and CLI files. Task 6 files lint clean.
- The prescribed `node --test` command cannot resolve this TypeScript/Next.js project's extensionless imports; the repository's `tsx --test` harness was used for behavioral RED/GREEN verification.

## Review Fixes

- Approval now updates `skill_review_requests` to `approved` before `COMMIT`, inside the same transaction as the published skill, files, and version snapshot writes.
- Approval and other decision timestamps are TypeScript Unix timestamp parameters rather than SQLite-only `unixepoch()` SQL, so the updates execute on MySQL.
- Added regression coverage for existing-skill replacement, version insert failure, and approval status update failure. Failure cases assert the request is not approved and the transaction rolls back.

## Fix Verification

- RED observed: the approval status update failure test initially recorded `BEGIN`, `COMMIT`, proving the status update occurred after the activation transaction.
- `src/lib/review/service.test.ts`: 12/12 passed after the fix.
- `src/lib/review/*.test.ts`: 32/32 passed after the fix.
- ESLint passed for `src/lib/review/service.ts` and `src/lib/review/service.test.ts`.
- `next build` passed.
- `git diff --check` passed.

## Residual Risk

- The database abstraction does not expose a transaction-scoped client. Its MySQL implementation uses a singleton connection, so the manual `BEGIN`/`COMMIT` sequence makes these approval writes atomic on that connection, but concurrent operations sharing that client could be interleaved. A future database-layer transaction callback that leases a dedicated connection would remove this risk.
- The requested `pnpm exec` commands were attempted but the installed pnpm `9.0.0` could not resolve local `tsx`, `eslint`, or `next` binaries. Equivalent direct local-binary commands were used for the passing test, lint, and build verification.

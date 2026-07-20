# Final Review Package

## Commits
b5599b6 fix: align review workflow api docs
080f480 docs: document review workflow
bd38933 fix: isolate approval transactions
185cf96 fix: make approval activation atomic
eff7b4b feat: activate approved skill versions
2949aee fix: refresh review attachment edits
ec2a5b0 fix: preserve review detail edits
172decb fix: complete review dashboard workflows
fce0872 feat: add review dashboards
a2c12c0 fix: keep skill files behind review
f164f9b feat: route publishing through review requests
db5249a fix: validate review decisions
662f141 feat: expose review request api
28f4376 fix: enforce review edit and comment boundaries
d856c2f feat: add review workflow service
17d16a3 feat: add review workflow schema

## Stat
 .superpowers/sdd/task-2-report.md                  |  46 +++
 .superpowers/sdd/task-4-report.md                  |  52 +++
 .superpowers/sdd/task-5-report.md                  |  80 ++++
 .superpowers/sdd/task-6-report.md                  |  65 ++++
 .superpowers/sdd/task-7-report.md                  |  42 +++
 README.md                                          |  10 +-
 docs/review-workflow.md                            |  51 +++
 package.json                                       |   5 +-
 src/app/api/review-requests/[id]/comments/route.ts |  23 ++
 src/app/api/review-requests/[id]/decision/route.ts |  53 +++
 src/app/api/review-requests/[id]/route.ts          |  44 +++
 src/app/api/review-requests/route-utils.ts         |  46 +++
 src/app/api/review-requests/route.ts               |  55 +++
 src/app/api/skills/[slug]/download/route.ts        |  70 ++--
 src/app/api/skills/[slug]/files/route.ts           |  44 +--
 src/app/api/skills/[slug]/install/route.ts         |  47 ++-
 src/app/api/skills/[slug]/route.ts                 | 179 +++++----
 src/app/api/skills/[slug]/versions/route.ts        |  65 ++--
 src/app/api/skills/route.ts                        | 179 +++++----
 src/app/dashboard/page.tsx                         |  32 ++
 src/app/dashboard/proposals/[id]/page.tsx          |  16 +
 src/app/dashboard/proposals/page.tsx               |  15 +
 src/app/dashboard/review-api.ts                    |  30 ++
 src/app/dashboard/review/[id]/page.tsx             |  16 +
 src/app/dashboard/review/page.tsx                  |  18 +
 src/app/publish/page.tsx                           |  18 +-
 src/app/publish/success/page.tsx                   |  16 +-
 src/auth.ts                                        |   3 +
 src/components/NavLinks.tsx                        |   2 +
 src/components/dashboard/SkillEditor.tsx           |   4 +-
 src/components/review/ReviewCommentForm.tsx        |  23 ++
 src/components/review/ReviewRequestDetail.tsx      |  52 +++
 src/components/review/ReviewRequestList.tsx        |  33 ++
 src/components/wizard/Step3Review.tsx              |   2 +-
 src/lib/db/index.ts                                |  65 +++-
 src/lib/db/migrate-review-workflow-mysql.ts        |  70 ++++
 src/lib/db/migrate-review-workflow.ts              |  75 ++++
 src/lib/db/schema.mysql.ts                         |  41 +++
 src/lib/db/schema.ts                               |  41 +++
 src/lib/review/api-contract.test.ts                | 348 ++++++++++++++++++
 src/lib/review/auth.ts                             |  21 ++
 src/lib/review/files.test.ts                       |  17 +
 src/lib/review/files.ts                            |  11 +
 src/lib/review/service.test.ts                     | 319 ++++++++++++++++
 src/lib/review/service.ts                          | 408 +++++++++++++++++++++
 src/lib/review/types.ts                            |  98 +++++
 src/lib/review/ui-smoke.test.ts                    |  78 ++++
 src/types/next-auth.d.ts                           |   7 +-
 48 files changed, 2709 insertions(+), 326 deletions(-)

## Diff
diff --git a/.superpowers/sdd/task-2-report.md b/.superpowers/sdd/task-2-report.md
new file mode 100644
index 0000000..7864395
--- /dev/null
+++ b/.superpowers/sdd/task-2-report.md
@@ -0,0 +1,46 @@
+# Task 2 Report
+
+Status: DONE_WITH_CONCERNS
+
+Files changed:
+
+- `src/lib/review/types.ts`
+- `src/lib/review/auth.ts`
+- `src/lib/review/files.ts`
+- `src/lib/review/service.ts`
+- `src/lib/review/files.test.ts`
+- `src/lib/review/service.test.ts`
+- `package.json`
+
+Commit:
+
+- `d856c2f feat: add review workflow service`
+
+Tests and checks:
+
+- `node --test src/lib/review/files.test.ts`: failed as expected before implementation; Node 22 does not resolve extensionless TypeScript imports after implementation.
+- `node --test src/lib/review/service.test.ts`: failed as expected before implementation; same Node 22 resolver limitation applies after implementation.
+- `pnpm --config.package-manager-strict=false run test:review`: passed, 6 tests.
+- `pnpm --config.package-manager-strict=false exec tsc --noEmit`: passed.
+- `git diff --check` and `git diff --cached --check`: passed.
+
+Self-review:
+
+- Review requests validate `SKILL.md` frontmatter/body, ensure attached-file paths are relative and traversal-free, and reject duplicate attachment paths.
+- Edit permissions enforce author ownership for editable states; reviewer decisions reject self-approval and require comments for rejection/change requests.
+- Approval activation is intentionally deferred to Task 6 as defined by the approved plan.
+
+Concern:
+
+- The brief's direct `node --test` commands cannot run these extensionless TypeScript imports under Node 22. Added `test:review` using the existing `tsx` dependency; it passes all review-domain tests.
+
+## Review Fixes
+
+- Removed the admin bypass from `assertCanEditRequest`; only the request author can edit an editable proposal.
+- Per-file comments now accept only `SKILL.md` or a path matching an attached file on the request. General comments continue to use `null` or `undefined`.
+- Added focused tests covering admin edit denial, orphaned comment-path denial, `SKILL.md`/attached-file comment acceptance, and approved status recording without activation. Skill activation remains intentionally deferred to Task 6.
+
+Verification:
+
+- `pnpm --config.package-manager-strict=false run test:review`: passed, 10 tests.
+- `pnpm --config.package-manager-strict=false exec tsc --noEmit`: passed.
diff --git a/.superpowers/sdd/task-4-report.md b/.superpowers/sdd/task-4-report.md
new file mode 100644
index 0000000..29bb5c8
--- /dev/null
+++ b/.superpowers/sdd/task-4-report.md
@@ -0,0 +1,52 @@
+# Task 4 Report
+
+Status: DONE_WITH_CONCERNS
+
+## Commit
+
+- `feat: route publishing through review requests`
+
+## Files Changed
+
+- `src/app/api/skills/route.ts`
+- `src/app/api/skills/[slug]/route.ts`
+- `src/app/publish/page.tsx`
+- `src/app/publish/success/page.tsx`
+- `src/components/dashboard/SkillEditor.tsx`
+- `src/components/wizard/Step3Review.tsx` (adjacent button-copy change)
+- `src/lib/review/api-contract.test.ts`
+- `.superpowers/sdd/task-4-report.md`
+
+## Tests Run
+
+- RED: `node --test src/lib/review/api-contract.test.ts` failed before loading tests because Node 22 could not resolve Next 16's extensionless `next/server` import.
+- RED: `pnpm exec tsx --test src/lib/review/api-contract.test.ts` failed as expected with `createSkillHandlers is not a function` and `createSkillDetailHandlers is not a function`.
+- PASS: `node_modules/.bin/tsx --test src/lib/review/*.test.ts` - 16 passing, 0 failing.
+- PASS: scoped `node_modules/.bin/eslint` on changed API, publish, success, review-button, and contract-test files.
+- PASS: `git diff --check`.
+
+## Self-Review Notes
+
+- `POST /api/skills` creates a pending review request and includes submitted files; it no longer inserts a published skill.
+- `PATCH /api/skills/:slug` updates the author's open request for that published skill, or creates one when absent. It does not update the published row.
+- Public `GET` queries remain restricted to published skills.
+- No approval activation behavior was added; Task 6 remains responsible for activation.
+
+## Concerns
+
+- Required `pnpm lint` could not run: the installed pnpm is 9.0.0 while the project requires 9.15.9. Corepack could not download the pinned version because of a local certificate verification failure.
+- Running the local ESLint binary across the entire repository still fails on existing unrelated lint errors, including existing effect-rule errors in `SkillEditor` and other components.
+- Full TypeScript checking reports existing dependency-injection typing errors in the pre-existing review-route contract tests (`typeof auth` and `DbClient.close` requirements). The Task 4 handler dependencies use structural types and do not add to those errors.
+
+## Review Fixes
+
+- Disabled `POST /api/skills/:slug/files` with `405` so published attachments cannot bypass review requests; public `GET` is unchanged.
+- When `PATCH /api/skills/:slug` omits `files`, it now submits the published `skill_files` as `changeType: "unchanged"`. An explicitly supplied `files` array remains authoritative.
+
+### Tests And Results
+
+- RED: `node_modules/.bin/tsx --test src/lib/review/api-contract.test.ts` failed with the legacy files POST reaching the `skills` query and PATCH submitting `files: []`.
+- PASS: `node_modules/.bin/tsx --test src/lib/review/api-contract.test.ts` - 6 passing, 0 failing.
+- PASS: `node_modules/.bin/tsx --test src/lib/review/*.test.ts` - 17 passing, 0 failing.
+- PASS: scoped `node_modules/.bin/eslint` for the changed API routes and contract test.
+- PASS: `git diff --check`.
diff --git a/.superpowers/sdd/task-5-report.md b/.superpowers/sdd/task-5-report.md
new file mode 100644
index 0000000..48c4d37
--- /dev/null
+++ b/.superpowers/sdd/task-5-report.md
@@ -0,0 +1,80 @@
+# Task 5 Report
+
+Status: DONE
+
+## Commit
+
+- `feat: add review dashboards` (created with this task)
+
+## Files Changed
+
+- `src/components/review/ReviewRequestList.tsx`
+- `src/components/review/ReviewRequestDetail.tsx`
+- `src/components/review/ReviewCommentForm.tsx`
+- `src/app/dashboard/review/page.tsx`
+- `src/app/dashboard/review/[id]/page.tsx`
+- `src/app/dashboard/proposals/page.tsx`
+- `src/app/dashboard/proposals/[id]/page.tsx`
+- `src/components/NavLinks.tsx`
+- `src/app/dashboard/page.tsx`
+- `src/lib/review/ui-smoke.test.ts`
+
+## Tests Run
+
+- RED: `pnpm exec tsx --test src/lib/review/ui-smoke.test.ts` failed because the review and proposal route modules did not exist.
+- GREEN: `pnpm exec tsx --test src/lib/review/ui-smoke.test.ts` passed: 2/2 tests.
+- `pnpm exec eslint src/components/review src/app/dashboard/review src/app/dashboard/proposals src/components/NavLinks.tsx src/app/dashboard/page.tsx src/lib/review/ui-smoke.test.ts` passed.
+- `pnpm exec next build` passed, including TypeScript and all four dashboard routes.
+- `pnpm lint` could not run because the local pnpm is 9.0.0 while `package.json` requires pnpm 9.15.9; the equivalent installed ESLint executable was run directly.
+
+## Self-Review
+
+- Author pages list only the current author's review requests and allow editing/resubmitting `SKILL.md` after changes are requested.
+- Reviewer pages require a reviewer/admin role, list pending work, and expose approve, reject, and request-changes controls.
+- Detail pages include `SKILL.md`, `Adjuntos`, `Comentarios`, and `Metadata` tabs, with API-backed comments.
+- Navigation and dashboard actions include proposal and review entry points.
+
+## Concerns
+
+- Approval activation remains outside this task as required.
+
+## Review Fixes
+
+- Author resubmission now sends every existing attachment's `path`, `fileType`, `content`, and `changeType`, preventing the update endpoint from replacing files with an empty set.
+- Reviewer decision feedback (`generalComment`) is shown prominently on the request detail page.
+- Comments can target the general discussion, `SKILL.md`, or an individual attachment. File-targeted comments are shown with their file path and beside the relevant content.
+- Dashboard pages now use the review request API endpoints: `?mine=1`, `?status=pending`, and `/:id`. The server-side helper forwards the incoming cookie to preserve API authentication.
+
+## Review Fix Verification
+
+- RED: `pnpm exec tsx --test src/lib/review/ui-smoke.test.ts` failed 3 new checks before implementation: attachment preservation/decision feedback, file-specific comments, and API endpoint use.
+- GREEN: `pnpm exec tsx --test src/lib/review/ui-smoke.test.ts` passed: 5/5 tests.
+- `pnpm exec eslint src/components/review src/app/dashboard/review src/app/dashboard/proposals src/lib/review/ui-smoke.test.ts` passed.
+- `pnpm exec next build` passed.
+- `git diff --check` passed.
+
+## Re-review Fixes
+
+- The PATCH and reviewer-decision summary responses now merge into the loaded detail DTO while retaining its `files` and `comments`, so the detail view does not dereference missing collections after a successful update.
+- Authors can add, edit, and remove attachments while a request is `changes_requested`. Resubmission sends the complete current attachment payload with paths, types, content, and change types.
+- Smoke coverage verifies both the detail-preserving merge and the editable attachment payload/controls.
+
+## Re-review Verification
+
+- RED: `pnpm exec tsx --test src/lib/review/ui-smoke.test.ts` failed 2 new checks before implementation: the response merge did not retain full detail collections and author attachment editing was absent.
+- GREEN: `pnpm exec tsx --test src/lib/review/ui-smoke.test.ts` passed: 6/6 tests.
+- `pnpm exec eslint src/components/review/ReviewRequestDetail.tsx src/lib/review/ui-smoke.test.ts` passed.
+- `pnpm exec next build` passed.
+
+## Final Re-review Fix
+
+- After a successful author PATCH, the detail page now refetches `GET /api/review-requests/:id` and replaces local detail state with the authoritative DTO. The refreshed detail includes the submitted attachment collection and existing comments.
+- Editable attachment state is synchronized from the refreshed files, so a later resubmission uses the newly persisted attachment state.
+- Smoke coverage requires the successful resubmission path to refresh full request detail before replacing local state.
+
+## Final Re-review Verification
+
+- RED: `pnpm exec tsx --test src/lib/review/ui-smoke.test.ts` failed because the resubmission path did not fetch and apply the full detail DTO.
+- GREEN: `pnpm exec tsx --test src/lib/review/ui-smoke.test.ts` passed: 6/6 tests.
+- `pnpm exec eslint src/components/review/ReviewRequestDetail.tsx src/lib/review/ui-smoke.test.ts` passed.
+- `pnpm exec next build` passed.
diff --git a/.superpowers/sdd/task-6-report.md b/.superpowers/sdd/task-6-report.md
new file mode 100644
index 0000000..235f77a
--- /dev/null
+++ b/.superpowers/sdd/task-6-report.md
@@ -0,0 +1,65 @@
+# Task 6 Report
+
+Status: DONE_WITH_CONCERNS
+
+## Commit
+
+- `feat: activate approved skill versions`
+
+## Files Changed
+
+- `src/lib/review/service.ts`
+- `src/lib/review/service.test.ts`
+- `src/lib/review/api-contract.test.ts`
+- `src/app/api/skills/[slug]/download/route.ts`
+- `src/app/api/skills/[slug]/install/route.ts`
+- `src/app/api/skills/[slug]/versions/route.ts`
+- `.superpowers/sdd/task-6-report.md`
+
+## Tests Run
+
+- RED observed: `pnpm exec tsx --test src/lib/review/service.test.ts src/lib/review/api-contract.test.ts` failed with missing activation writes and missing public handler factories.
+- `pnpm exec tsx --test src/lib/review/*.test.ts` passed: 29 tests.
+- Changed-file ESLint passed.
+- `next build` passed.
+- `pnpm lint` could not start because the local pnpm is `9.0.0` and the repository requires `9.15.9`. Running the installed ESLint binary showed 12 existing errors outside Task 6 files.
+
+## Self-Review
+
+- Approval publishes a new or existing proposal, replaces published attachments while skipping deleted review files, snapshots the version, and only marks the request approved after activation succeeds.
+- Activation uses a transaction and rolls back published writes on activation errors.
+- Catalog/detail behavior already read published `skills` rows; regression tests cover that behavior. Download, install, and version routes now expose testable handler factories and explicitly remain scoped to published rows.
+- `git diff --check` passed.
+
+## Concerns
+
+- Repository-wide lint remains red due to pre-existing errors in unrelated UI and CLI files. Task 6 files lint clean.
+- The prescribed `node --test` command cannot resolve this TypeScript/Next.js project's extensionless imports; the repository's `tsx --test` harness was used for behavioral RED/GREEN verification.
+
+## Review Fixes
+
+- Approval now updates `skill_review_requests` to `approved` before `COMMIT`, inside the same transaction as the published skill, files, and version snapshot writes.
+- Approval and other decision timestamps are TypeScript Unix timestamp parameters rather than SQLite-only `unixepoch()` SQL, so the updates execute on MySQL.
+- Added regression coverage for existing-skill replacement, version insert failure, and approval status update failure. Failure cases assert the request is not approved and the transaction rolls back.
+
+## Fix Verification
+
+- RED observed: the approval status update failure test initially recorded `BEGIN`, `COMMIT`, proving the status update occurred after the activation transaction.
+- `src/lib/review/service.test.ts`: 12/12 passed after the fix.
+- `src/lib/review/*.test.ts`: 32/32 passed after the fix.
+- ESLint passed for `src/lib/review/service.ts` and `src/lib/review/service.test.ts`.
+- `next build` passed.
+- `git diff --check` passed.
+
+## Residual Risk
+
+- The database abstraction does not expose a transaction-scoped client. Its MySQL implementation uses a singleton connection, so the manual `BEGIN`/`COMMIT` sequence makes these approval writes atomic on that connection, but concurrent operations sharing that client could be interleaved. A future database-layer transaction callback that leases a dedicated connection would remove this risk.
+- The requested `pnpm exec` commands were attempted but the installed pnpm `9.0.0` could not resolve local `tsx`, `eslint`, or `next` binaries. Equivalent direct local-binary commands were used for the passing test, lint, and build verification.
+
+## Transaction Isolation Fix
+
+- Replaced the singleton MySQL connection with a pool. `transaction()` now leases one pooled connection, begins the transaction, runs the callback against its scoped client, commits on success, rolls back on failure, and releases the connection in all cases.
+- Added equivalent scoped LibSQL write-transaction behavior and exported the database transaction callback API.
+- Approval activation now runs its published-skill, file, version, and approved-request writes through the transaction callback client. It retains portable TypeScript Unix timestamp parameters.
+- RED observed: `approval activation uses the transaction-scoped client` failed with `false !== true` before implementation because approval never invoked the callback.
+- GREEN verification: `pnpm exec tsx --test src/lib/review/service.test.ts` passed (13 tests); `pnpm exec tsx --test src/lib/review/*.test.ts` passed (33 tests); changed-file ESLint passed; `pnpm exec next build` passed; `git diff --check` passed.
diff --git a/.superpowers/sdd/task-7-report.md b/.superpowers/sdd/task-7-report.md
new file mode 100644
index 0000000..13e0d3d
--- /dev/null
+++ b/.superpowers/sdd/task-7-report.md
@@ -0,0 +1,42 @@
+# Task 7 Report
+
+## Status
+
+DONE_WITH_CONCERNS
+
+## Files Changed
+
+- `README.md`
+- `docs/review-workflow.md`
+- `.superpowers/sdd/task-7-report.md`
+
+The approved design specification was reviewed and left unchanged because the documented implementation behavior did not factually diverge from it.
+
+## Verification
+
+| Command | Result | Notes |
+| --- | --- | --- |
+| `pnpm migrate:review-workflow` | BLOCKED | The installed pnpm is 9.0.0; the repository requires 9.15.9. |
+| `pnpm exec tsx --test src/lib/review/*.test.ts` | BLOCKED | Blocked by the same pnpm version guard. |
+| `corepack pnpm --version` | BLOCKED | Corepack attempted to fetch pnpm 9.15.9 but failed TLS certificate verification (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`). |
+| `node_modules/.bin/tsx.cmd src/lib/db/migrate-review-workflow.ts` | PASS | SQLite review-workflow migration completed. |
+| `node_modules/.bin/tsx.cmd --test src/lib/review/*.test.ts` | PASS | 33 tests passed; 0 failed. |
+| `pnpm lint` | NOT RUN | Blocked by the pnpm version guard. |
+| `node_modules/.bin/eslint.cmd .` with `next.cmd build` | TIMEOUT | Combined equivalent lint/build invocation timed out after 124 seconds without completion output. Neither check is counted as passing. |
+| Focused `node_modules/.bin/eslint.cmd` review paths | TIMEOUT | Timed out after 64 seconds without diagnostics. |
+| `pnpm exec next build` | NOT RUN | Blocked by the pnpm version guard; direct `next.cmd build` is covered by the timed-out equivalent invocation above. |
+
+## Manual QA
+
+Not completed. The required `pnpm dev` command is blocked by the repository pnpm version guard, and Corepack cannot acquire the required pnpm version because local TLS certificate validation fails. As a result, a local app session with authenticated `author` and `reviewer` roles was not available for the requested end-to-end browser scenarios. No manual browser assertion is claimed.
+
+## Self-Review
+
+- Confirmed the documentation covers roles and permissions, author submission, reviewer decisions, published-version behavior, SQLite/MySQL migration commands, and the stated non-goals.
+- Confirmed `README.md` links to the workflow guide and states that `POST /api/skills` submits for review.
+- Confirmed the specification needs no factual update.
+
+## Concerns
+
+- Full lint and production build remain unverified because the pinned pnpm cannot be activated and direct equivalent commands timed out in this host.
+- End-to-end browser QA remains unverified because the local development server could not be started with the required package manager and authenticated roles.
diff --git a/README.md b/README.md
index 5bde0ab..227fe80 100644
--- a/README.md
+++ b/README.md
@@ -32,20 +32,24 @@ compatibility:
 ---

 ## Features

 - **Catálogo** — búsqueda, filtros por tipo y ordenamiento
 - **Detalle de skill** — árbol de archivos adjuntos, preview inline, descarga `.zip`
 - **Publicar** — wizard de 3 pasos con editor CodeMirror, carga desde carpeta local o `.zip`
 - **Dashboard** — estadísticas, historial de versiones, editor en vivo
 - **CLI** — instalar, buscar, listar y eliminar skills desde la terminal

+## Revision y publicacion
+
+`POST /api/skills` ahora envia una propuesta a revision; no publica el skill inmediatamente. Consulte [el flujo de revision](docs/review-workflow.md) para los permisos, el proceso para authors y reviewers, y las migraciones requeridas.
+
 ---

 ## Stack

 | Capa | Tecnología |
 |---|---|
 | Framework | Next.js 16 (App Router, Turbopack) |
 | Base de datos | SQLite via `@libsql/client` + Drizzle ORM |
 | Editor | CodeMirror 6 (carga dinámica, SSR-safe) |
 | Validación | Zod |
@@ -165,25 +169,25 @@ evita instalar en `~/.codex` cuando el harness está usando otro home efectivo.
 └── skills-vault.db                   # SQLite (no versionado)
 ```

 ---

 ## API

 | Método | Ruta | Descripción |
 |---|---|---|
 | `GET` | `/api/skills` | Listar/buscar skills (`?q=`, `?type=`, `?sort=`) |
-| `POST` | `/api/skills` | Publicar nuevo skill |
+| `POST` | `/api/skills` | Enviar propuesta de nuevo skill a revisión |
 | `GET` | `/api/skills/:slug` | Detalle + rawContent |
-| `PATCH` | `/api/skills/:slug` | Editar skill |
+| `PATCH` | `/api/skills/:slug` | Crear o actualizar propuesta de nueva versión sin cambiar el contenido publicado |
 | `GET` | `/api/skills/:slug/files` | Listar archivos adjuntos |
-| `POST` | `/api/skills/:slug/files` | Subir archivos adjuntos |
+| `POST` | `/api/skills/:slug/files` | No soportado; los adjuntos se envían con la propuesta de revisión |
 | `GET` | `/api/skills/:slug/download` | Descargar skill como `.zip` |
 | `POST` | `/api/skills/:slug/install` | Registrar instalación (contador) |
 | `GET` | `/api/skills/:slug/versions` | Historial de versiones |
 | `POST` | `/api/validate` | Validar frontmatter sin publicar |

 ---

 ## Licencia

 MIT
diff --git a/docs/review-workflow.md b/docs/review-workflow.md
new file mode 100644
index 0000000..d90b53e
--- /dev/null
+++ b/docs/review-workflow.md
@@ -0,0 +1,51 @@
+# Flujo de revision de skills
+
+SkillVault revisa cada skill nuevo y cada nueva version antes de publicarla. Una propuesta pendiente no aparece en el catalogo publico ni puede descargarse o instalarse.
+
+## Roles y permisos
+
+- **Author**: crea propuestas, consulta sus propias propuestas y puede editar o reenviar las que estan `pending` o `changes_requested`.
+- **Reviewer**: consulta la cola de revision, agrega comentarios generales o por archivo y puede aprobar, pedir cambios o rechazar propuestas.
+- **Admin**: tiene los permisos de author y reviewer para atender solicitudes operativas. Las decisiones conservan la identidad de quien las toma.
+
+Solo el author de una propuesta puede editarla. Un author no puede aprobar su propia propuesta. Los reviewers no pueden editar el contenido ni los adjuntos enviados por un author.
+
+## Envio de un author
+
+1. Cree un skill desde **Publicar**, complete el wizard y seleccione **Enviar a revision**. El endpoint `POST /api/skills` crea una propuesta en lugar de publicar directamente.
+2. Consulte **Mis propuestas** para ver el estado, reviewer, comentarios y la fecha de actualizacion.
+3. Si el reviewer pide cambios, abra la propuesta, actualice `SKILL.md` o los adjuntos y reenviela. El reenvio devuelve la propuesta a `pending` y elimina la decision anterior.
+4. Para un skill ya publicado, el editor del dashboard envia una nueva version a revision. No modifica la version publica en ese momento.
+
+No puede haber dos propuestas abiertas para el mismo slug y version. Los archivos adjuntos deben tener rutas relativas, unicas y sin recorridos como `../`.
+
+## Decision de un reviewer
+
+1. Abra **Revision** y seleccione una propuesta pendiente.
+2. Revise `SKILL.md`, los adjuntos y los comentarios. Puede dejar un comentario general o asociarlo a `SKILL.md` o a un archivo adjunto.
+3. Seleccione **Aprobar**, **Pedir cambios** o **Rechazar**. Pedir cambios y rechazar requieren un comentario general.
+4. Una aprobacion activa inmediatamente el contenido propuesto. El sistema actualiza el skill publicado, sus archivos y el historial de versiones en una sola transaccion.
+
+Los estados finales son `approved` y `rejected`. Las propuestas `changes_requested` pueden volver a enviarse para una nueva revision.
+
+## Version publicada mientras hay una propuesta pendiente
+
+Al enviar una nueva version de un skill existente, la version publicada sigue visible en el catalogo y continua disponible para descarga e instalacion. La nueva version la reemplaza solo despues de que un reviewer la apruebe. Para un skill nuevo, no existe contenido publico hasta la aprobacion.
+
+## Migraciones
+
+Ejecute la migracion de acuerdo con la base de datos configurada:
+
+```bash
+# SQLite
+pnpm migrate:review-workflow
+
+# MySQL
+pnpm migrate:review-workflow:mysql
+```
+
+Las migraciones crean las tablas de solicitudes, archivos y comentarios de revision. Los skills publicados existentes permanecen publicados y no se convierten en propuestas.
+
+## No incluido
+
+Esta primera version no incluye notificaciones por email, webhooks, comentarios a nivel de linea ni publicacion programada.
diff --git a/package.json b/package.json
index 69f2503..41888db 100644
--- a/package.json
+++ b/package.json
@@ -3,21 +3,24 @@
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
+        "migrate:review-workflow:mysql": "tsx src/lib/db/migrate-review-workflow-mysql.ts",
+        "test:review": "tsx --test src/lib/review/*.test.ts"
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
diff --git a/src/app/api/review-requests/[id]/comments/route.ts b/src/app/api/review-requests/[id]/comments/route.ts
new file mode 100644
index 0000000..7b98965
--- /dev/null
+++ b/src/app/api/review-requests/[id]/comments/route.ts
@@ -0,0 +1,23 @@
+import { NextRequest, NextResponse } from "next/server";
+import { auth } from "@/auth";
+import { client } from "@/lib/db";
+import { addReviewComment } from "@/lib/review/service";
+import type { AddReviewCommentInput } from "@/lib/review/types";
+import { actorFromSession, errorResponse, parseRequestId, requestBody } from "../../route-utils";
+
+type RouteContext = { params: Promise<{ id: string }> };
+
+export async function POST(request: NextRequest, context: RouteContext) {
+  const session = await auth();
+  const actor = session ? actorFromSession(session) : null;
+  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
+  const id = parseRequestId((await context.params).id);
+  if (!id) return NextResponse.json({ error: "Invalid review request id" }, { status: 422 });
+  try {
+    const input = await requestBody(request) as AddReviewCommentInput;
+    const comment = await addReviewComment(id, input, actor, client);
+    return NextResponse.json({ comment }, { status: 201 });
+  } catch (error) {
+    return errorResponse(error);
+  }
+}
diff --git a/src/app/api/review-requests/[id]/decision/route.ts b/src/app/api/review-requests/[id]/decision/route.ts
new file mode 100644
index 0000000..dc3fe8f
--- /dev/null
+++ b/src/app/api/review-requests/[id]/decision/route.ts
@@ -0,0 +1,53 @@
+import { NextRequest, NextResponse } from "next/server";
+import { auth } from "@/auth";
+import { client } from "@/lib/db";
+import { decideReviewRequest } from "@/lib/review/service";
+import type { DecideReviewRequestInput } from "@/lib/review/types";
+import { actorFromSession, errorResponse, parseRequestId, requestBody } from "../../route-utils";
+
+type RouteContext = { params: Promise<{ id: string }> };
+type DecisionRouteDeps = {
+  getSession?: typeof auth;
+  database?: typeof client;
+  decide?: typeof decideReviewRequest;
+};
+
+function parseDecisionInput(value: unknown): DecideReviewRequestInput {
+  if (!value || typeof value !== "object") throw new Error("Invalid review decision");
+  const input = value as { decision?: unknown; comment?: unknown };
+  if (input.decision !== "approve" && input.decision !== "reject" && input.decision !== "request_changes") {
+    throw new Error("Invalid review decision");
+  }
+  if (input.comment !== undefined && input.comment !== null && typeof input.comment !== "string") {
+    throw new Error("Invalid review comment");
+  }
+  if ((input.decision === "reject" || input.decision === "request_changes") && !input.comment?.trim()) {
+    throw new Error("A general comment required for this decision");
+  }
+  return { decision: input.decision, comment: input.comment ?? null };
+}
+
+export function createReviewDecisionHandlers({
+  getSession = auth,
+  database = client,
+  decide = decideReviewRequest,
+}: DecisionRouteDeps = {}) {
+  async function POST(request: NextRequest, context: RouteContext) {
+    const session = await getSession();
+    const actor = session ? actorFromSession(session) : null;
+    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
+    const id = parseRequestId((await context.params).id);
+    if (!id) return NextResponse.json({ error: "Invalid review request id" }, { status: 422 });
+    try {
+      const input = parseDecisionInput(await requestBody(request));
+      const reviewRequest = await decide(id, input, actor, database);
+      return NextResponse.json({ request: reviewRequest });
+    } catch (error) {
+      return errorResponse(error);
+    }
+  }
+
+  return { POST };
+}
+
+export const { POST } = createReviewDecisionHandlers();
diff --git a/src/app/api/review-requests/[id]/route.ts b/src/app/api/review-requests/[id]/route.ts
new file mode 100644
index 0000000..6d80a79
--- /dev/null
+++ b/src/app/api/review-requests/[id]/route.ts
@@ -0,0 +1,44 @@
+import { NextRequest, NextResponse } from "next/server";
+import { auth } from "@/auth";
+import { client } from "@/lib/db";
+import { getReviewRequest, updateReviewRequest } from "@/lib/review/service";
+import type { UpdateReviewRequestInput } from "@/lib/review/types";
+import { actorFromSession, errorResponse, parseRequestId, requestBody } from "../route-utils";
+
+type RouteContext = { params: Promise<{ id: string }> };
+
+async function requireActor() {
+  const session = await auth();
+  return session ? actorFromSession(session) : null;
+}
+
+async function requestId(context: RouteContext) {
+  return parseRequestId((await context.params).id);
+}
+
+export async function GET(_request: NextRequest, context: RouteContext) {
+  const actor = await requireActor();
+  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
+  const id = await requestId(context);
+  if (!id) return NextResponse.json({ error: "Invalid review request id" }, { status: 422 });
+  try {
+    const reviewRequest = await getReviewRequest(id, actor, client);
+    return NextResponse.json({ request: reviewRequest });
+  } catch (error) {
+    return errorResponse(error);
+  }
+}
+
+export async function PATCH(request: NextRequest, context: RouteContext) {
+  const actor = await requireActor();
+  if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
+  const id = await requestId(context);
+  if (!id) return NextResponse.json({ error: "Invalid review request id" }, { status: 422 });
+  try {
+    const input = await requestBody(request) as UpdateReviewRequestInput;
+    const reviewRequest = await updateReviewRequest(id, input, actor, client);
+    return NextResponse.json({ request: reviewRequest });
+  } catch (error) {
+    return errorResponse(error);
+  }
+}
diff --git a/src/app/api/review-requests/route-utils.ts b/src/app/api/review-requests/route-utils.ts
new file mode 100644
index 0000000..93aedc7
--- /dev/null
+++ b/src/app/api/review-requests/route-utils.ts
@@ -0,0 +1,46 @@
+import { NextResponse } from "next/server";
+import type { Session } from "next-auth";
+import type { ReviewActor, ReviewStatus } from "@/lib/review/types";
+
+const reviewStatuses: ReviewStatus[] = ["pending", "changes_requested", "approved", "rejected"];
+
+export function actorFromSession(session: Session): ReviewActor | null {
+  const { user } = session;
+  if (!user?.id) return null;
+
+  return { id: user.id, handle: user.name ?? user.email ?? null, roles: user.roles ?? [] };
+}
+
+export function parseRequestId(value: string): number | null {
+  const id = Number(value);
+  return Number.isInteger(id) && id > 0 ? id : null;
+}
+
+export function parseReviewStatus(value: string | null): ReviewStatus | undefined | null {
+  if (value === null) return undefined;
+  return reviewStatuses.includes(value as ReviewStatus) ? (value as ReviewStatus) : null;
+}
+
+export function errorResponse(error: unknown) {
+  const message = error instanceof Error ? error.message : "Unexpected review request error";
+  const normalized = message.toLowerCase();
+  if (normalized.includes("not found")) return NextResponse.json({ error: message }, { status: 404 });
+  if (normalized.includes("not allowed") || normalized.includes("only the author") || normalized.includes("author cannot") || normalized.includes("reviewer role")) {
+    return NextResponse.json({ error: message }, { status: 403 });
+  }
+  if (normalized.includes("already exists") || normalized.includes("not active") || normalized.includes("not editable")) {
+    return NextResponse.json({ error: message }, { status: 409 });
+  }
+  if (normalized.includes("required") || normalized.includes("invalid") || normalized.includes("file path") || normalized.includes("attached file") || normalized.includes("unique") || normalized.includes("frontmatter") || normalized.includes("skill.md")) {
+    return NextResponse.json({ error: message }, { status: 422 });
+  }
+  return NextResponse.json({ error: message }, { status: 500 });
+}
+
+export async function requestBody(request: Request): Promise<unknown> {
+  try {
+    return await request.json();
+  } catch {
+    throw new Error("Invalid JSON body");
+  }
+}
diff --git a/src/app/api/review-requests/route.ts b/src/app/api/review-requests/route.ts
new file mode 100644
index 0000000..f56607b
--- /dev/null
+++ b/src/app/api/review-requests/route.ts
@@ -0,0 +1,55 @@
+import { NextRequest, NextResponse } from "next/server";
+import { auth } from "@/auth";
+import { client } from "@/lib/db";
+import { createReviewRequest, listReviewRequests } from "@/lib/review/service";
+import type { CreateReviewRequestInput } from "@/lib/review/types";
+import { actorFromSession, errorResponse, parseReviewStatus, requestBody } from "./route-utils";
+
+type RouteDependencies = {
+  getSession: typeof auth;
+  database: typeof client;
+  create: typeof createReviewRequest;
+  list: typeof listReviewRequests;
+};
+
+export function createReviewRequestsHandlers(dependencies: Partial<RouteDependencies> = {}) {
+  const getSession = dependencies.getSession ?? auth;
+  const database = dependencies.database ?? client;
+  const create = dependencies.create ?? createReviewRequest;
+  const list = dependencies.list ?? listReviewRequests;
+
+  async function requireActor() {
+    const session = await getSession();
+    return session ? actorFromSession(session) : null;
+  }
+
+  async function GET(request: NextRequest) {
+    const actor = await requireActor();
+    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
+    const status = parseReviewStatus(request.nextUrl.searchParams.get("status"));
+    if (status === null) return NextResponse.json({ error: "Invalid review request status" }, { status: 422 });
+    try {
+      const mine = ["1", "true"].includes(request.nextUrl.searchParams.get("mine") ?? "");
+      const requests = await list({ mine, status }, actor, database);
+      return NextResponse.json({ requests });
+    } catch (error) {
+      return errorResponse(error);
+    }
+  }
+
+  async function POST(request: NextRequest) {
+    const actor = await requireActor();
+    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
+    try {
+      const input = await requestBody(request) as CreateReviewRequestInput;
+      const reviewRequest = await create(input, actor, database);
+      return NextResponse.json({ request: reviewRequest }, { status: 201 });
+    } catch (error) {
+      return errorResponse(error);
+    }
+  }
+
+  return { GET, POST };
+}
+
+export const { GET, POST } = createReviewRequestsHandlers();
diff --git a/src/app/api/skills/[slug]/download/route.ts b/src/app/api/skills/[slug]/download/route.ts
index c594e59..948eeed 100644
--- a/src/app/api/skills/[slug]/download/route.ts
+++ b/src/app/api/skills/[slug]/download/route.ts
@@ -1,46 +1,56 @@
 import { NextRequest, NextResponse } from "next/server";
 import { client } from "@/lib/db";
+import type { ReviewDatabaseClient } from "@/lib/review/types";

-export async function GET(
-  _req: NextRequest,
-  { params }: { params: Promise<{ slug: string }> }
-) {
-  const { slug } = await params;
+type RouteDependencies = { database: ReviewDatabaseClient };

-  const skillRow = await client.execute({
+export function createSkillDownloadHandlers(dependencies: Partial<RouteDependencies> = {}) {
+  const database = dependencies.database ?? client;
+
+  async function GET(
+    _req: NextRequest,
+    { params }: { params: Promise<{ slug: string }> }
+  ) {
+    const { slug } = await params;
+
+    const skillRow = await database.execute({
     sql: "SELECT id, raw_content FROM skills WHERE slug = ? AND status = 'published'",
     args: [slug],
   });
-  if (skillRow.rows.length === 0) {
-    return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
-  }
+    if (skillRow.rows.length === 0) {
+      return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
+    }

-  const skillId = skillRow.rows[0].id as number;
-  const rawContent = (skillRow.rows[0].raw_content as string) || "";
+    const skillId = skillRow.rows[0].id as number;
+    const rawContent = (skillRow.rows[0].raw_content as string) || "";

-  const filesRow = await client.execute({
+    const filesRow = await database.execute({
     sql: "SELECT path, file_type, content FROM skill_files WHERE skill_id = ?",
     args: [skillId],
   });

-  // Build ZIP in-memory with JSZip
-  const JSZip = (await import("jszip")).default;
-  const zip = new JSZip();
-  const folder = zip.folder(slug)!;
-
-  folder.file("SKILL.md", rawContent);
-  for (const f of filesRow.rows) {
-    folder.file(f.path as string, f.content as string);
+    const JSZip = (await import("jszip")).default;
+    const zip = new JSZip();
+    const folder = zip.folder(slug)!;
+
+    folder.file("SKILL.md", rawContent);
+    for (const f of filesRow.rows) {
+      folder.file(f.path as string, f.content as string);
+    }
+
+    const buffer = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });
+
+    return new NextResponse(buffer, {
+      status: 200,
+      headers: {
+        "Content-Type": "application/zip",
+        "Content-Disposition": `attachment; filename="${slug}.zip"`,
+        "Content-Length": String(buffer.byteLength),
+      },
+    });
   }

-  const buffer = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });
-
-  return new NextResponse(buffer, {
-    status: 200,
-    headers: {
-      "Content-Type": "application/zip",
-      "Content-Disposition": `attachment; filename="${slug}.zip"`,
-      "Content-Length": String(buffer.byteLength),
-    },
-  });
+  return { GET };
 }
+
+export const { GET } = createSkillDownloadHandlers();
diff --git a/src/app/api/skills/[slug]/files/route.ts b/src/app/api/skills/[slug]/files/route.ts
index 983c30a..f1a624e 100644
--- a/src/app/api/skills/[slug]/files/route.ts
+++ b/src/app/api/skills/[slug]/files/route.ts
@@ -1,19 +1,13 @@
 import { NextRequest, NextResponse } from "next/server";
 import { client } from "@/lib/db";

-interface FileEntry {
-  path: string;
-  fileType: "resource" | "script";
-  content: string;
-}
-
 export async function GET(
   _req: NextRequest,
   { params }: { params: Promise<{ slug: string }> }
 ) {
   const { slug } = await params;

   const skill = await client.execute({
     sql: "SELECT id FROM skills WHERE slug = ?",
     args: [slug],
   });
@@ -30,44 +24,16 @@ export async function GET(
   return NextResponse.json({
     files: files.rows.map((r) => ({
       id: r.id,
       path: r.path as string,
       fileType: r.file_type as string,
       content: r.content as string,
     })),
   });
 }

-export async function POST(
-  req: NextRequest,
-  { params }: { params: Promise<{ slug: string }> }
-) {
-  const { slug } = await params;
-
-  const skill = await client.execute({
-    sql: "SELECT id FROM skills WHERE slug = ?",
-    args: [slug],
-  });
-  if (skill.rows.length === 0) {
-    return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
-  }
-
-  const skillId = skill.rows[0].id as number;
-  const { files } = (await req.json()) as { files: FileEntry[] };
-
-  if (!Array.isArray(files) || files.length === 0) {
-    return NextResponse.json({ error: "files[] requerido" }, { status: 400 });
-  }
-
-  // Delete existing files for this skill and re-insert
-  await client.execute({ sql: "DELETE FROM skill_files WHERE skill_id = ?", args: [skillId] });
-
-  for (const f of files) {
-    const fileType = f.fileType === "script" ? "script" : "resource";
-    await client.execute({
-      sql: "INSERT INTO skill_files (skill_id, path, file_type, content) VALUES (?, ?, ?, ?)",
-      args: [skillId, f.path, fileType, f.content ?? ""],
-    });
-  }
-
-  return NextResponse.json({ saved: files.length });
+export async function POST() {
+  return NextResponse.json(
+    { error: "Skill file updates must be submitted through a review request" },
+    { status: 405 }
+  );
 }
diff --git a/src/app/api/skills/[slug]/install/route.ts b/src/app/api/skills/[slug]/install/route.ts
index d98ccd8..a0b73ad 100644
--- a/src/app/api/skills/[slug]/install/route.ts
+++ b/src/app/api/skills/[slug]/install/route.ts
@@ -1,26 +1,37 @@
 import { NextRequest, NextResponse } from "next/server";
 import { client } from "@/lib/db";
+import type { ReviewDatabaseClient } from "@/lib/review/types";

-export async function POST(
-  _req: NextRequest,
-  { params }: { params: Promise<{ slug: string }> }
-) {
-  const { slug } = await params;
+type RouteDependencies = { database: ReviewDatabaseClient };

-  const existing = await client.execute({
-    sql: "SELECT install_count FROM skills WHERE slug = ? AND status = 'published'",
-    args: [slug],
-  });
+export function createSkillInstallHandlers(dependencies: Partial<RouteDependencies> = {}) {
+  const database = dependencies.database ?? client;

-  if (existing.rows.length === 0) {
-    return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
-  }
+  async function POST(
+    _req: NextRequest,
+    { params }: { params: Promise<{ slug: string }> }
+  ) {
+    const { slug } = await params;
+
+    const existing = await database.execute({
+      sql: "SELECT id, install_count FROM skills WHERE slug = ? AND status = 'published'",
+      args: [slug],
+    });
+
+    if (existing.rows.length === 0) {
+      return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
+    }

-  await client.execute({
-    sql: "UPDATE skills SET install_count = install_count + 1 WHERE slug = ?",
-    args: [slug],
-  });
+    await database.execute({
+      sql: "UPDATE skills SET install_count = install_count + 1 WHERE id = ? AND status = 'published'",
+      args: [existing.rows[0].id],
+    });

-  const newCount = Number(existing.rows[0].install_count) + 1;
-  return NextResponse.json({ slug, installCount: newCount });
+    const newCount = Number(existing.rows[0].install_count) + 1;
+    return NextResponse.json({ slug, installCount: newCount });
+  }
+
+  return { POST };
 }
+
+export const { POST } = createSkillInstallHandlers();
diff --git a/src/app/api/skills/[slug]/route.ts b/src/app/api/skills/[slug]/route.ts
index f130d23..bebbcea 100644
--- a/src/app/api/skills/[slug]/route.ts
+++ b/src/app/api/skills/[slug]/route.ts
@@ -1,25 +1,38 @@
 import { NextRequest, NextResponse } from "next/server";
+import { auth } from "@/auth";
 import { client } from "@/lib/db";
-import matter from "gray-matter";
-import { validateSkillFrontmatter } from "@/lib/skill-schema";
+import { createReviewRequest, updateReviewRequest } from "@/lib/review/service";
+import { actorFromSession, errorResponse } from "../../review-requests/route-utils";
+import { skillSubmissionBody } from "../route";
+import type { Session } from "next-auth";
+import type { CreateReviewRequestInput, ReviewActor, ReviewDatabaseClient, ReviewRequest, UpdateReviewRequestInput } from "@/lib/review/types";
+
+type RouteContext = { params: Promise<{ slug: string }> };
+
+type RouteDependencies = {
+  getSession: () => Promise<Session | null>;
+  database: ReviewDatabaseClient;
+  create: (input: CreateReviewRequestInput, actor: ReviewActor, database: ReviewDatabaseClient) => Promise<ReviewRequest>;
+  update: (id: number, input: UpdateReviewRequestInput, actor: ReviewActor, database: ReviewDatabaseClient) => Promise<ReviewRequest>;
+};

 function yamlList(arr: string[]) {
   return arr.length ? arr.map((v) => `  - "${v}"`).join("\n") : "  []";
 }

 function buildRawContent(row: Record<string, unknown>): string {
   const triggers = JSON.parse(row.triggers as string ?? "[]") as string[];
-  const tools    = JSON.parse(row.tools    as string ?? "[]") as string[];
-  const compat   = JSON.parse(row.compatibility as string ?? '["claude"]') as string[];
-  const deps     = JSON.parse(row.dependencies  as string ?? "[]") as string[];
-  const author   = row.author_handle ? `\nauthor: "${row.author_handle}"` : "";
+  const tools = JSON.parse(row.tools as string ?? "[]") as string[];
+  const compat = JSON.parse(row.compatibility as string ?? '["claude"]') as string[];
+  const deps = JSON.parse(row.dependencies as string ?? "[]") as string[];
+  const author = row.author_handle ? `\nauthor: "${row.author_handle}"` : "";

   return `---
 name: "${row.name}"
 description: "${(row.description as string).replace(/"/g, '\\"')}"
 version: "${row.version ?? "1.0.0"}"
 schema_version: "${row.schema_version ?? "1.1"}"${author}
 metadata:
   type: ${row.type}
   triggers:
 ${yamlList(triggers)}
@@ -36,24 +49,24 @@ ${deps.length ? deps.map((d) => `  - "${d}"`).join("\n") : "  []"}
 ${row.description}

 ## Usage

 Invoke this skill to use its capabilities.
 `;
 }

 function parseSkill(row: Record<string, unknown>) {
   const triggers = JSON.parse(row.triggers as string ?? "[]");
-  const tools    = JSON.parse(row.tools    as string ?? "[]");
-  const compat   = JSON.parse(row.compatibility as string ?? '["claude"]');
-  const deps     = JSON.parse(row.dependencies  as string ?? "[]");
-  const raw      = (row.raw_content as string) || buildRawContent(row);
+  const tools = JSON.parse(row.tools as string ?? "[]");
+  const compat = JSON.parse(row.compatibility as string ?? '["claude"]');
+  const deps = JSON.parse(row.dependencies as string ?? "[]");
+  const raw = (row.raw_content as string) || buildRawContent(row);

   return {
     id: row.id,
     slug: row.slug,
     name: row.name,
     description: row.description,
     type: row.type,
     authorHandle: row.author_handle,
     version: row.version,
     schemaVersion: row.schema_version,
@@ -62,98 +75,84 @@ function parseSkill(row: Record<string, unknown>) {
     compatibility: compat,
     dependencies: deps,
     rawContent: raw,
     status: row.status,
     installCount: row.install_count,
     createdAt: row.created_at,
     publishedAt: row.published_at,
   };
 }

-export async function GET(
-  _req: NextRequest,
-  { params }: { params: Promise<{ slug: string }> }
-) {
-  const { slug } = await params;
-  const result = await client.execute({
-    sql: `SELECT * FROM skills WHERE slug = ? AND status = 'published' LIMIT 1`,
-    args: [slug],
-  });
-
-  if (result.rows.length === 0) {
-    return NextResponse.json({ error: "Not found" }, { status: 404 });
-  }
-
-  return NextResponse.json(parseSkill(result.rows[0] as Record<string, unknown>));
-}
+export function createSkillDetailHandlers(dependencies: Partial<RouteDependencies> = {}) {
+  const getSession = dependencies.getSession ?? auth;
+  const database = dependencies.database ?? client;
+  const create = dependencies.create ?? createReviewRequest;
+  const update = dependencies.update ?? updateReviewRequest;

-export async function PATCH(
-  req: NextRequest,
-  { params }: { params: Promise<{ slug: string }> }
-) {
-  const { slug } = await params;
-
-  const existing = await client.execute({
-    sql: "SELECT id FROM skills WHERE slug = ?",
-    args: [slug],
-  });
-  if (existing.rows.length === 0) {
-    return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
-  }
+  async function GET(_req: NextRequest, { params }: RouteContext) {
+    const { slug } = await params;
+    const result = await database.execute({
+      sql: `SELECT * FROM skills WHERE slug = ? AND status = 'published' LIMIT 1`,
+      args: [slug],
+    });

-  const { rawContent } = await req.json();
-  if (!rawContent || typeof rawContent !== "string") {
-    return NextResponse.json({ error: "rawContent requerido" }, { status: 400 });
-  }
+    if (result.rows.length === 0) {
+      return NextResponse.json({ error: "Not found" }, { status: 404 });
+    }

-  const parsed = matter(rawContent);
-  const fmResult = validateSkillFrontmatter(parsed.data);
-  if (!fmResult.valid) {
-    return NextResponse.json(
-      { error: "Frontmatter inválido", errors: fmResult.errors },
-      { status: 422 }
-    );
+    return NextResponse.json(parseSkill(result.rows[0] as Record<string, unknown>));
   }

-  const fm = fmResult.parsed!;
-  const now = Math.floor(Date.now() / 1000);
-
-  await client.execute({
-    sql: `UPDATE skills SET
-      name = ?, description = ?, type = ?, author_handle = ?,
-      version = ?, schema_version = ?,
-      triggers = ?, tools = ?, compatibility = ?, dependencies = ?,
-      raw_content = ?, updated_at = ?
-      WHERE slug = ?`,
-    args: [
-      fm.name,
-      fm.description,
-      fm.metadata.type,
-      fm.author ?? null,
-      fm.version ?? "1.0.0",
-      fm.schema_version ?? "1.1",
-      JSON.stringify(fm.metadata.triggers),
-      JSON.stringify(fm.metadata.tools ?? []),
-      JSON.stringify(fm.compatibility ?? ["claude"]),
-      JSON.stringify(fm.dependencies ?? []),
-      rawContent,
-      now,
-      slug,
-    ],
-  });
-
-  // Record version snapshot
-  const skillRow = await client.execute({
-    sql: "SELECT id FROM skills WHERE slug = ?",
-    args: [slug],
-  });
-  if (skillRow.rows.length > 0) {
-    const skillId = skillRow.rows[0].id;
-    await client.execute({
-      sql: `INSERT INTO skill_versions (skill_id, version, raw_content, created_at)
-            VALUES (?, ?, ?, ?)`,
-      args: [skillId, fm.version ?? "1.0.0", rawContent, now],
-    }).catch(() => {}); // graceful if table schema differs
+  async function PATCH(req: NextRequest, { params }: RouteContext) {
+    const session = await getSession();
+    const actor = session ? actorFromSession(session) : null;
+    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
+
+    const { slug } = await params;
+    const skill = await database.execute({
+      sql: "SELECT id, raw_content FROM skills WHERE slug = ? AND status = 'published' LIMIT 1",
+      args: [slug],
+    });
+    if (skill.rows.length === 0) {
+      return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
+    }
+
+    const input = await skillSubmissionBody(req);
+    if (!input) return NextResponse.json({ error: "rawContent y files[] inválidos" }, { status: 400 });
+
+    try {
+      const skillId = Number(skill.rows[0].id);
+      const files = input.files === undefined
+        ? (await database.execute({
+          sql: "SELECT path, file_type, content FROM skill_files WHERE skill_id = ? ORDER BY file_type, path",
+          args: [skillId],
+        })).rows.map((file) => ({
+          path: String(file.path),
+          fileType: file.file_type as "resource" | "script",
+          content: String(file.content),
+          changeType: "unchanged" as const,
+        }))
+        : input.files;
+      const reviewInput = { ...input, files };
+      const openRequest = await database.execute({
+        sql: `SELECT id FROM skill_review_requests
+          WHERE skill_id = ? AND author_id = ? AND status IN ('pending', 'changes_requested')
+          ORDER BY id DESC LIMIT 1`,
+        args: [skillId, actor.id],
+      });
+      const request = openRequest.rows.length > 0
+        ? await update(Number(openRequest.rows[0].id), reviewInput, actor, database)
+        : await create({ ...reviewInput, skillId }, actor, database);
+
+      return NextResponse.json(
+        { slug: request.slug, reviewRequestId: request.id, status: request.status },
+        { status: 201 }
+      );
+    } catch (error) {
+      return errorResponse(error);
+    }
   }

-  return NextResponse.json({ slug, updated: now });
+  return { GET, PATCH };
 }
+
+export const { GET, PATCH } = createSkillDetailHandlers();
diff --git a/src/app/api/skills/[slug]/versions/route.ts b/src/app/api/skills/[slug]/versions/route.ts
index d4b0333..b6f371f 100644
--- a/src/app/api/skills/[slug]/versions/route.ts
+++ b/src/app/api/skills/[slug]/versions/route.ts
@@ -1,38 +1,49 @@
 import { NextRequest, NextResponse } from "next/server";
 import { client } from "@/lib/db";
+import type { ReviewDatabaseClient } from "@/lib/review/types";

-export async function GET(
-  _req: NextRequest,
-  { params }: { params: Promise<{ slug: string }> }
-) {
-  const { slug } = await params;
-
-  const skillRow = await client.execute({
-    sql: "SELECT id FROM skills WHERE slug = ?",
-    args: [slug],
-  });
-  if (skillRow.rows.length === 0) {
-    return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
-  }
+type RouteDependencies = { database: ReviewDatabaseClient };
+
+export function createSkillVersionHandlers(dependencies: Partial<RouteDependencies> = {}) {
+  const database = dependencies.database ?? client;
+
+  async function GET(
+    _req: NextRequest,
+    { params }: { params: Promise<{ slug: string }> }
+  ) {
+    const { slug } = await params;
+
+    const skillRow = await database.execute({
+      sql: "SELECT id FROM skills WHERE slug = ? AND status = 'published'",
+      args: [slug],
+    });
+    if (skillRow.rows.length === 0) {
+      return NextResponse.json({ error: "Skill no encontrado" }, { status: 404 });
+    }

-  const skillId = skillRow.rows[0].id;
+    const skillId = skillRow.rows[0].id;

-  try {
-    const versions = await client.execute({
-      sql: `SELECT version, created_at FROM skill_versions
+    try {
+      const versions = await database.execute({
+        sql: `SELECT version, created_at FROM skill_versions
             WHERE skill_id = ?
             ORDER BY created_at DESC
             LIMIT 10`,
-      args: [skillId],
-    });
+        args: [skillId],
+      });

-    return NextResponse.json({
-      versions: versions.rows.map((r) => ({
-        version: r.version as string,
-        createdAt: r.created_at as string,
-      })),
-    });
-  } catch {
-    return NextResponse.json({ versions: [] });
+      return NextResponse.json({
+        versions: versions.rows.map((r) => ({
+          version: r.version as string,
+          createdAt: r.created_at as string,
+        })),
+      });
+    } catch {
+      return NextResponse.json({ versions: [] });
+    }
   }
+
+  return { GET };
 }
+
+export const { GET } = createSkillVersionHandlers();
diff --git a/src/app/api/skills/route.ts b/src/app/api/skills/route.ts
index a0420ab..4ef8bb5 100644
--- a/src/app/api/skills/route.ts
+++ b/src/app/api/skills/route.ts
@@ -1,14 +1,65 @@
 import { NextRequest, NextResponse } from "next/server";
+import { auth } from "@/auth";
 import { client } from "@/lib/db";
-import matter from "gray-matter";
-import { validateSkillFrontmatter, validateBodySections } from "@/lib/skill-schema";
+import { createReviewRequest } from "@/lib/review/service";
+import type { CreateReviewRequestInput, ReviewActor, ReviewDatabaseClient, ReviewFileInput, ReviewRequest } from "@/lib/review/types";
+import { actorFromSession, errorResponse } from "../review-requests/route-utils";
+import type { Session } from "next-auth";
+
+type RouteDependencies = {
+  getSession: () => Promise<Session | null>;
+  database: ReviewDatabaseClient;
+  create: (input: CreateReviewRequestInput, actor: ReviewActor, database: ReviewDatabaseClient) => Promise<ReviewRequest>;
+};
+
+function parseFiles(value: unknown): ReviewFileInput[] | null | undefined {
+  if (value === undefined) return undefined;
+  if (!Array.isArray(value)) return null;
+  const files: ReviewFileInput[] = [];
+  for (const file of value) {
+    if (!file || typeof file !== "object") return null;
+    const entry = file as Record<string, unknown>;
+    if (
+      typeof entry.path !== "string" ||
+      (entry.fileType !== "resource" && entry.fileType !== "script") ||
+      (entry.content !== undefined && typeof entry.content !== "string") ||
+      (entry.changeType !== undefined && !["added", "modified", "deleted", "unchanged"].includes(String(entry.changeType)))
+    ) {
+      return null;
+    }
+    files.push({
+      path: entry.path,
+      fileType: entry.fileType,
+      ...(typeof entry.content === "string" ? { content: entry.content } : {}),
+      ...(entry.changeType !== undefined ? { changeType: entry.changeType as ReviewFileInput["changeType"] } : {}),
+    });
+  }
+  return files;
+}
+
+export async function skillSubmissionBody(request: Request): Promise<CreateReviewRequestInput | null> {
+  let body: unknown;
+  try {
+    body = await request.json();
+  } catch {
+    return null;
+  }
+  if (!body || typeof body !== "object") return null;
+  const { rawContent, files } = body as Record<string, unknown>;
+  const parsedFiles = parseFiles(files);
+  if (typeof rawContent !== "string" || !rawContent || parsedFiles === null) return null;
+  return {
+    rawContent,
+    ...(parsedFiles === undefined ? {} : { files: parsedFiles }),
+  };
+}

 function parseSkill(row: Record<string, unknown>) {
   return {
     id: row.id,
     slug: row.slug,
     name: row.name,
     description: row.description,
     type: row.type,
     authorHandle: row.author_handle,
     version: row.version,
@@ -16,103 +67,69 @@ function parseSkill(row: Record<string, unknown>) {
     tools: JSON.parse(row.tools as string ?? "[]"),
     compatibility: JSON.parse(row.compatibility as string ?? '["claude"]'),
     configRequirements: JSON.parse(row.config_requirements as string ?? "[]"),
     status: row.status,
     installCount: row.install_count,
     createdAt: row.created_at,
     publishedAt: row.published_at,
   };
 }

-export async function GET(req: NextRequest) {
-  const { searchParams } = req.nextUrl;
-  const q = searchParams.get("q") ?? "";
-  const type = searchParams.get("type") ?? "";
-  const sort = searchParams.get("sort") ?? "popular";
+export function createSkillHandlers(dependencies: Partial<RouteDependencies> = {}) {
+  const getSession = dependencies.getSession ?? auth;
+  const database = dependencies.database ?? client;
+  const create = dependencies.create ?? createReviewRequest;

-  let sql = `SELECT * FROM skills WHERE status = 'published'`;
-  const args: (string | number)[] = [];
+  async function GET(req: NextRequest) {
+    const { searchParams } = req.nextUrl;
+    const q = searchParams.get("q") ?? "";
+    const type = searchParams.get("type") ?? "";
+    const sort = searchParams.get("sort") ?? "popular";

-  if (q) {
-    sql += ` AND (name LIKE ? OR description LIKE ? OR triggers LIKE ?)`;
-    args.push(`%${q}%`, `%${q}%`, `%${q}%`);
-  }
-  if (type) {
-    sql += ` AND type = ?`;
-    args.push(type);
-  }
+    let sql = `SELECT * FROM skills WHERE status = 'published'`;
+    const args: (string | number)[] = [];

-  const orderMap: Record<string, string> = {
-    popular: "install_count DESC",
-    recent: "created_at DESC",
-    az: "name ASC",
-  };
-  sql += ` ORDER BY ${orderMap[sort] ?? "install_count DESC"}`;
+    if (q) {
+      sql += ` AND (name LIKE ? OR description LIKE ? OR triggers LIKE ?)`;
+      args.push(`%${q}%`, `%${q}%`, `%${q}%`);
+    }
+    if (type) {
+      sql += ` AND type = ?`;
+      args.push(type);
+    }

-  const result = await client.execute({ sql, args });
-  const skills = result.rows.map((r) => parseSkill(r as Record<string, unknown>));
+    const orderMap: Record<string, string> = {
+      popular: "install_count DESC",
+      recent: "created_at DESC",
+      az: "name ASC",
+    };
+    sql += ` ORDER BY ${orderMap[sort] ?? "install_count DESC"}`;

-  return NextResponse.json({ skills, total: skills.length });
-}
+    const result = await database.execute({ sql, args });
+    const skills = result.rows.map((r) => parseSkill(r as Record<string, unknown>));

-export async function POST(req: NextRequest) {
-  try {
-    const { rawContent } = await req.json();
-    if (!rawContent || typeof rawContent !== "string") {
-      return NextResponse.json({ error: "rawContent requerido" }, { status: 400 });
-    }
+    return NextResponse.json({ skills, total: skills.length });
+  }

-    const parsed = matter(rawContent);
-    const fmResult = validateSkillFrontmatter(parsed.data);
-    if (!fmResult.valid) {
-      return NextResponse.json(
-        { error: "Frontmatter inválido", errors: fmResult.errors },
-        { status: 422 }
-      );
-    }
+  async function POST(req: NextRequest) {
+    const session = await getSession();
+    const actor = session ? actorFromSession(session) : null;
+    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

-    const fm = fmResult.parsed!;
-    const now = Math.floor(Date.now() / 1000);
+    const input = await skillSubmissionBody(req);
+    if (!input) return NextResponse.json({ error: "rawContent y files[] inválidos" }, { status: 400 });

-    // Check for duplicate slug
-    const existing = await client.execute({
-      sql: "SELECT id FROM skills WHERE slug = ?",
-      args: [fm.name],
-    });
-    if (existing.rows.length > 0) {
+    try {
+      const request = await create(input, actor, database);
       return NextResponse.json(
-        { error: `Ya existe un skill con el nombre "${fm.name}"` },
-        { status: 409 }
+        { slug: request.slug, reviewRequestId: request.id, status: request.status },
+        { status: 201 }
       );
+    } catch (error) {
+      return errorResponse(error);
     }
-
-    await client.execute({
-      sql: `INSERT INTO skills
-        (slug, name, description, type, author_handle, version, schema_version,
-         triggers, tools, compatibility, dependencies, config_requirements, raw_content, status,
-         install_count, created_at, updated_at, published_at)
-        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 0, ?, ?, ?)`,
-      args: [
-        fm.name,
-        fm.name,
-        fm.description,
-        fm.metadata.type,
-        fm.author ?? null,
-        fm.version ?? "1.0.0",
-        fm.schema_version ?? "1.1",
-        JSON.stringify(fm.metadata.triggers),
-        JSON.stringify(fm.metadata.tools ?? []),
-        JSON.stringify(fm.compatibility ?? ["claude"]),
-        JSON.stringify(fm.dependencies ?? []),
-        JSON.stringify(fm.config_requirements ?? []),
-        rawContent,
-        now,
-        now,
-        now,
-      ],
-    });
-
-    return NextResponse.json({ slug: fm.name }, { status: 201 });
-  } catch (e) {
-    return NextResponse.json({ error: String(e) }, { status: 500 });
   }
+
+  return { GET, POST };
 }
+
+export const { GET, POST } = createSkillHandlers();
diff --git a/src/app/dashboard/page.tsx b/src/app/dashboard/page.tsx
index 2fad9a2..2b8b1c4 100644
--- a/src/app/dashboard/page.tsx
+++ b/src/app/dashboard/page.tsx
@@ -78,20 +78,52 @@ export default async function DashboardPage() {
                 padding: "8px 18px",
                 borderRadius: "4px",
                 background: "var(--raised)",
                 color: "var(--text)",
                 textDecoration: "none",
                 border: "1px solid var(--border)",
               }}
             >
               Categorías
             </Link>
+            <Link
+              href="/dashboard/proposals"
+              style={{
+                fontFamily: "var(--font-geist), sans-serif",
+                fontSize: "13px",
+                fontWeight: 600,
+                padding: "8px 18px",
+                borderRadius: "4px",
+                background: "var(--raised)",
+                color: "var(--text)",
+                textDecoration: "none",
+                border: "1px solid var(--border)",
+              }}
+            >
+              Mis propuestas
+            </Link>
+            <Link
+              href="/dashboard/review"
+              style={{
+                fontFamily: "var(--font-geist), sans-serif",
+                fontSize: "13px",
+                fontWeight: 600,
+                padding: "8px 18px",
+                borderRadius: "4px",
+                background: "var(--raised)",
+                color: "var(--text)",
+                textDecoration: "none",
+                border: "1px solid var(--border)",
+              }}
+            >
+              Revision
+            </Link>
             <Link
               href="/publish"
               style={{
                 fontFamily: "var(--font-geist), sans-serif",
                 fontSize: "13px",
                 fontWeight: 600,
                 padding: "8px 18px",
                 borderRadius: "4px",
                 background: "var(--accent)",
                 color: "#fff",
diff --git a/src/app/dashboard/proposals/[id]/page.tsx b/src/app/dashboard/proposals/[id]/page.tsx
new file mode 100644
index 0000000..1d11b13
--- /dev/null
+++ b/src/app/dashboard/proposals/[id]/page.tsx
@@ -0,0 +1,16 @@
+import { AppHeader } from "@/components/AppHeader";
+import { ReviewRequestDetail } from "@/components/review/ReviewRequestDetail";
+import { auth } from "@/auth";
+import { fetchReviewRequest } from "../../review-api";
+import type { ReviewRequestDetailDto } from "@/lib/review/types";
+
+export const dynamic = "force-dynamic";
+
+export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
+  const session = await auth(); const id = Number((await params).id);
+  let request: ReviewRequestDetailDto | null = null; let error: string | null = null;
+  if (session && Number.isInteger(id) && id > 0) { try { request = await fetchReviewRequest(id); } catch (reason) { error = reason instanceof Error ? reason.message : "No se pudo cargar la propuesta."; } }
+  const content = request ? <ReviewRequestDetail request={request} viewerMode="author" /> : <State message={error ?? "Inicia sesion para ver esta propuesta."} />;
+  return <div style={{ minHeight: "100vh", background: "var(--bg)" }}><AppHeader /><main style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 24px" }}>{content}</main></div>;
+}
+function State({ message }: { message: string }) { return <div style={{ padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--muted)", fontSize: "13px" }}>{message}</div>; }
diff --git a/src/app/dashboard/proposals/page.tsx b/src/app/dashboard/proposals/page.tsx
new file mode 100644
index 0000000..689023e
--- /dev/null
+++ b/src/app/dashboard/proposals/page.tsx
@@ -0,0 +1,15 @@
+import { AppHeader } from "@/components/AppHeader";
+import { ReviewRequestList } from "@/components/review/ReviewRequestList";
+import { auth } from "@/auth";
+import { fetchReviewRequests } from "../review-api";
+
+export const dynamic = "force-dynamic";
+
+export default async function ProposalsPage() {
+  const session = await auth();
+  const requests = session ? await fetchReviewRequests("?mine=1") : null;
+  return <div style={{ minHeight: "100vh", background: "var(--bg)" }}><AppHeader /><main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}><h1 style={headingStyle}>Mis propuestas</h1><p style={descriptionStyle}>Estado y comentarios de los skills enviados a revision.</p>{requests ? <ReviewRequestList requests={requests} mode="author" /> : <State message="Inicia sesion para ver tus propuestas." />}</main></div>;
+}
+function State({ message }: { message: string }) { return <div style={{ padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--muted)", fontSize: "13px" }}>{message}</div>; }
+const headingStyle: React.CSSProperties = { fontFamily: "var(--font-geist), sans-serif", fontSize: "24px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px" };
+const descriptionStyle: React.CSSProperties = { fontSize: "13px", color: "var(--muted)", margin: "0 0 24px" };
diff --git a/src/app/dashboard/review-api.ts b/src/app/dashboard/review-api.ts
new file mode 100644
index 0000000..de943cd
--- /dev/null
+++ b/src/app/dashboard/review-api.ts
@@ -0,0 +1,30 @@
+import { headers } from "next/headers";
+import type { ReviewRequestDetailDto, ReviewRequestSummary } from "@/lib/review/types";
+
+type ApiError = { error?: string };
+
+async function reviewApiFetch<T>(path: string): Promise<T> {
+  const requestHeaders = await headers();
+  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
+  if (!host) throw new Error("No se pudo determinar el origen de la solicitud.");
+
+  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
+  const cookie = requestHeaders.get("cookie");
+  const response = await fetch(`${protocol}://${host}/api/review-requests${path}`, {
+    cache: "no-store",
+    headers: cookie ? { cookie } : undefined,
+  });
+  const data = await response.json() as T & ApiError;
+  if (!response.ok) throw new Error(data.error ?? "No se pudo cargar la solicitud de revision.");
+  return data;
+}
+
+export async function fetchReviewRequests(query: string): Promise<ReviewRequestSummary[]> {
+  const data = await reviewApiFetch<{ requests: ReviewRequestSummary[] }>(query);
+  return data.requests;
+}
+
+export async function fetchReviewRequest(id: number): Promise<ReviewRequestDetailDto> {
+  const data = await reviewApiFetch<{ request: ReviewRequestDetailDto }>(`/${id}`);
+  return data.request;
+}
diff --git a/src/app/dashboard/review/[id]/page.tsx b/src/app/dashboard/review/[id]/page.tsx
new file mode 100644
index 0000000..eaa847f
--- /dev/null
+++ b/src/app/dashboard/review/[id]/page.tsx
@@ -0,0 +1,16 @@
+import { AppHeader } from "@/components/AppHeader";
+import { ReviewRequestDetail } from "@/components/review/ReviewRequestDetail";
+import { auth } from "@/auth";
+import { fetchReviewRequest } from "../../review-api";
+import type { ReviewRequestDetailDto } from "@/lib/review/types";
+
+export const dynamic = "force-dynamic";
+
+export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
+  const session = await auth(); const id = Number((await params).id); const roles = session?.user?.roles ?? []; const canReview = roles.includes("reviewer") || roles.includes("admin");
+  let request: ReviewRequestDetailDto | null = null; let error: string | null = null;
+  if (canReview && Number.isInteger(id) && id > 0) { try { request = await fetchReviewRequest(id); } catch (reason) { error = reason instanceof Error ? reason.message : "No se pudo cargar la solicitud."; } }
+  const content = request ? <ReviewRequestDetail request={request} viewerMode="reviewer" /> : <State message={error ?? "No tienes permiso para revisar solicitudes."} />;
+  return <div style={{ minHeight: "100vh", background: "var(--bg)" }}><AppHeader /><main style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 24px" }}>{content}</main></div>;
+}
+function State({ message }: { message: string }) { return <div style={{ padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--muted)", fontSize: "13px" }}>{message}</div>; }
diff --git a/src/app/dashboard/review/page.tsx b/src/app/dashboard/review/page.tsx
new file mode 100644
index 0000000..7f28e12
--- /dev/null
+++ b/src/app/dashboard/review/page.tsx
@@ -0,0 +1,18 @@
+import { AppHeader } from "@/components/AppHeader";
+import { ReviewRequestList } from "@/components/review/ReviewRequestList";
+import { auth } from "@/auth";
+import { fetchReviewRequests } from "../review-api";
+
+export const dynamic = "force-dynamic";
+
+export default async function ReviewQueuePage() {
+  const session = await auth();
+  const roles = session?.user?.roles ?? [];
+  const canReview = roles.includes("reviewer") || roles.includes("admin");
+  const requests = canReview ? await fetchReviewRequests("?status=pending") : null;
+  return <PageShell title="Cola de revision" description="Solicitudes pendientes asignadas al equipo revisor.">{requests ? <ReviewRequestList requests={requests} mode="reviewer" /> : <State message="No tienes permiso para revisar solicitudes." />}</PageShell>;
+}
+function PageShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <div style={{ minHeight: "100vh", background: "var(--bg)" }}><AppHeader /><main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}><h1 style={headingStyle}>{title}</h1><p style={descriptionStyle}>{description}</p>{children}</main></div>; }
+function State({ message }: { message: string }) { return <div style={{ padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--muted)", fontSize: "13px" }}>{message}</div>; }
+const headingStyle: React.CSSProperties = { fontFamily: "var(--font-geist), sans-serif", fontSize: "24px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px" };
+const descriptionStyle: React.CSSProperties = { fontSize: "13px", color: "var(--muted)", margin: "0 0 24px" };
diff --git a/src/app/publish/page.tsx b/src/app/publish/page.tsx
index 2c501ea..2273b1a 100644
--- a/src/app/publish/page.tsx
+++ b/src/app/publish/page.tsx
@@ -1,13 +1,14 @@
 "use client";

 import { useState } from "react";
+import Link from "next/link";
 import { useRouter } from "next/navigation";
 import { WizardLayout } from "@/components/wizard/WizardLayout";
 import { Step1Metadata, MetadataFields } from "@/components/wizard/Step1Metadata";
 import { Step2Editor } from "@/components/wizard/Step2Editor";
 import { StepRequirements } from "@/components/wizard/StepRequirements";
 import { Step3Review } from "@/components/wizard/Step3Review";
 import { LocalSkillLoader, LoadedFile } from "@/components/wizard/LocalSkillLoader";
 import { getSkillTemplate } from "@/lib/skill-schema";

 const DEFAULT_META: MetadataFields = {
@@ -60,35 +61,26 @@ export default function PublishPage() {
   function handleMetaNext() {
     setContent(buildContent(meta));
     setStep(2);
   }

   async function handlePublish() {
     try {
       const res = await fetch("/api/skills", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
-        body: JSON.stringify({ rawContent: content }),
+        body: JSON.stringify({ rawContent: content, files: attachedFiles }),
       });
       const data = await res.json();
       if (!res.ok) return { ok: false, error: data.error ?? "Error del servidor" };

-      // Upload attached files if any
-      if (attachedFiles.length > 0) {
-        await fetch(`/api/skills/${data.slug}/files`, {
-          method: "POST",
-          headers: { "Content-Type": "application/json" },
-          body: JSON.stringify({ files: attachedFiles }),
-        }).catch(() => {}); // non-blocking
-      }
-
-      router.push(`/publish/success?slug=${data.slug}`);
+      router.push(`/publish/success?slug=${data.slug}&reviewRequestId=${data.reviewRequestId}`);
       return { ok: true, slug: data.slug };
     } catch (e) {
       return { ok: false, error: String(e) };
     }
   }

   // Step 0: loader screen (outside WizardLayout)
   if (step === 0) {
     return (
       <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
@@ -96,35 +88,35 @@ export default function PublishPage() {
         <div
           style={{
             height: "56px",
             borderBottom: "1px solid var(--border)",
             display: "flex",
             alignItems: "center",
             padding: "0 24px",
             gap: "12px",
           }}
         >
-          <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
+          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
             <span
               style={{
                 width: "24px", height: "24px", background: "var(--accent)", borderRadius: "4px",
                 display: "inline-flex", alignItems: "center", justifyContent: "center",
                 fontSize: "12px", color: "#fff", fontWeight: 700,
                 fontFamily: "var(--font-jetbrains-mono), monospace",
               }}
             >
               SV
             </span>
             <span style={{ fontFamily: "var(--font-geist), sans-serif", fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>
               SkillVault
             </span>
-          </a>
+          </Link>
           <span style={{ color: "var(--border)" }}>/</span>
           <span style={{ fontSize: "13px", color: "var(--muted)" }}>Publicar Skill</span>
         </div>

         <div style={{ maxWidth: "640px", margin: "48px auto", padding: "0 24px" }}>
           <LocalSkillLoader
             onLoaded={handleLoaded}
             onSkip={() => setStep(1)}
           />
         </div>
diff --git a/src/app/publish/success/page.tsx b/src/app/publish/success/page.tsx
index 9f8da23..1ed0492 100644
--- a/src/app/publish/success/page.tsx
+++ b/src/app/publish/success/page.tsx
@@ -1,18 +1,18 @@
 import Link from "next/link";

 interface Props {
-  searchParams: Promise<{ slug?: string }>;
+  searchParams: Promise<{ slug?: string; reviewRequestId?: string }>;
 }

 export default async function PublishSuccessPage({ searchParams }: Props) {
-  const { slug } = await searchParams;
+  const { slug, reviewRequestId } = await searchParams;

   return (
     <div
       style={{
         minHeight: "100vh",
         background: "var(--bg)",
         display: "flex",
         alignItems: "center",
         justifyContent: "center",
         padding: "40px 24px",
@@ -45,21 +45,21 @@ export default async function PublishSuccessPage({ searchParams }: Props) {

         <h1
           style={{
             fontFamily: "var(--font-geist), sans-serif",
             fontSize: "28px",
             fontWeight: 700,
             color: "var(--text)",
             marginBottom: "12px",
           }}
         >
-          ¡Skill publicado!
+          Pendiente de revision
         </h1>

         {slug && (
           <div
             style={{
               fontFamily: "var(--font-jetbrains-mono), monospace",
               fontSize: "14px",
               color: "var(--accent)",
               background: "var(--surface)",
               border: "1px solid var(--border)",
@@ -74,40 +74,40 @@ export default async function PublishSuccessPage({ searchParams }: Props) {
         )}

         <p
           style={{
             fontSize: "14px",
             color: "var(--muted)",
             lineHeight: 1.6,
             marginBottom: "32px",
           }}
         >
-          Tu skill ya está disponible en el catálogo. Otros desarrolladores pueden
-          descubrirlo, instalarlo y contribuir mejoras.
+          Tu propuesta fue enviada para revision. Estara disponible en el catálogo
+          cuando sea aprobada.
         </p>

         <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
-          {slug && (
+          {reviewRequestId && (
             <Link
-              href={`/skills/${slug}`}
+              href={`/dashboard/proposals/${reviewRequestId}`}
               style={{
                 fontFamily: "var(--font-geist), sans-serif",
                 fontSize: "13px",
                 fontWeight: 600,
                 padding: "10px 22px",
                 borderRadius: "4px",
                 background: "var(--accent)",
                 color: "#fff",
                 textDecoration: "none",
               }}
             >
-              Ver skill →
+              Ver propuesta →
             </Link>
           )}
           <Link
             href="/"
             style={{
               fontFamily: "var(--font-geist), sans-serif",
               fontSize: "13px",
               padding: "10px 22px",
               borderRadius: "4px",
               border: "1px solid var(--border)",
diff --git a/src/auth.ts b/src/auth.ts
index 45a336a..b499a3a 100644
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -16,15 +16,18 @@ export const { handlers, auth, signIn, signOut } = NextAuth({
     jwt({ token, account, profile }) {
       if (account && profile) {
         // Extract client roles from the Keycloak token claim "roles"
         const p = profile as Record<string, unknown>;
         const roles = Array.isArray(p.roles) ? (p.roles as string[]) : [];
         token.roles = roles;
       }
       return token;
     },
     session({ session, token }) {
+      session.user.id = token.sub ?? "";
+      session.user.name = token.name ?? session.user.name;
+      session.user.email = token.email ?? session.user.email;
       session.user.roles = (token.roles as string[]) ?? [];
       return session;
     },
   },
 });
diff --git a/src/components/NavLinks.tsx b/src/components/NavLinks.tsx
index c930944..ec48fdf 100644
--- a/src/components/NavLinks.tsx
+++ b/src/components/NavLinks.tsx
@@ -1,20 +1,22 @@
 "use client";
 import { usePathname } from "next/navigation";

 export function NavLinks() {
   const pathname = usePathname();
   return (
     <nav style={{ display: "flex", alignItems: "center", gap: "4px" }}>
       <NavLink href="/" active={pathname === "/"}>Catálogo</NavLink>
       <NavLink href="/dashboard" active={pathname === "/dashboard"}>Mis Skills</NavLink>
       <NavLink href="/dashboard/categories" active={pathname.startsWith("/dashboard/categories")}>Categorías</NavLink>
+      <NavLink href="/dashboard/proposals" active={pathname.startsWith("/dashboard/proposals")}>Mis propuestas</NavLink>
+      <NavLink href="/dashboard/review" active={pathname.startsWith("/dashboard/review")}>Revision</NavLink>
       <NavLink href="/publish" active={pathname.startsWith("/publish")}>Publicar</NavLink>
     </nav>
   );
 }

 function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
   return (
     <a
       href={href}
       style={{
diff --git a/src/components/dashboard/SkillEditor.tsx b/src/components/dashboard/SkillEditor.tsx
index c4114a2..4cef8fd 100644
--- a/src/components/dashboard/SkillEditor.tsx
+++ b/src/components/dashboard/SkillEditor.tsx
@@ -216,41 +216,41 @@ export function SkillEditor({ slug, initialContent }: Props) {
             display: "flex",
             alignItems: "center",
             gap: "12px",
             justifyContent: "flex-end",
           }}
         >
           {saveError && (
             <span style={{ fontSize: "12px", color: "var(--red)", flex: 1 }}>{saveError}</span>
           )}
           {saveOk && (
-            <span style={{ fontSize: "12px", color: "var(--green)", flex: 1 }}>✓ Guardado correctamente</span>
+            <span style={{ fontSize: "12px", color: "var(--green)", flex: 1 }}>✓ Enviado a revision</span>
           )}
           <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", color: "var(--faint)" }}>
             {content.split("\n").length} líneas
           </span>
           <button
             onClick={handleSave}
             disabled={saving || !valid || !dirty}
             style={{
               fontFamily: "var(--font-geist), sans-serif",
               fontSize: "13px",
               fontWeight: 600,
               padding: "9px 22px",
               borderRadius: "4px",
               border: "none",
               background: valid && dirty && !saving ? "var(--accent)" : "var(--faint)",
               color: valid && dirty && !saving ? "#fff" : "var(--muted)",
               cursor: valid && dirty && !saving ? "pointer" : "not-allowed",
             }}
           >
-            {saving ? "Guardando…" : "Guardar cambios"}
+            {saving ? "Enviando…" : "Enviar a revision"}
           </button>
         </div>
       </div>

       {/* Validation sidebar */}
       <div style={{ position: "sticky", top: "72px" }}>
         <div
           style={{
             background: "var(--surface)",
             border: `1px solid ${errors.length > 0 ? "var(--red)" : warnings.length > 0 ? "var(--amber)" : "var(--green)"}`,
diff --git a/src/components/review/ReviewCommentForm.tsx b/src/components/review/ReviewCommentForm.tsx
new file mode 100644
index 0000000..02a39e0
--- /dev/null
+++ b/src/components/review/ReviewCommentForm.tsx
@@ -0,0 +1,23 @@
+"use client";
+
+import { useState } from "react";
+import type { ReviewComment } from "@/lib/review/types";
+
+type Props = {
+  requestId: number;
+  filePath?: string | null;
+  placeholder?: string;
+  onComment: (comment: ReviewComment) => void;
+};
+
+export function ReviewCommentForm({ requestId, filePath = null, placeholder = "Agregar un comentario...", onComment }: Props) {
+  const [body, setBody] = useState(""); const [error, setError] = useState<string | null>(null); const [submitting, setSubmitting] = useState(false);
+  async function submit(event: React.FormEvent<HTMLFormElement>) {
+    event.preventDefault(); if (!body.trim()) return; setSubmitting(true); setError(null);
+    try { const response = await fetch(`/api/review-requests/${requestId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: body.trim(), filePath }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "No se pudo agregar el comentario"); onComment(data.comment); setBody(""); }
+    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo agregar el comentario"); } finally { setSubmitting(false); }
+  }
+  return <form onSubmit={submit} style={{ marginTop: "14px" }}><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder={placeholder} rows={3} style={inputStyle} /><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px", gap: "12px" }}>{error ? <span style={{ fontSize: "12px", color: "var(--red)" }}>{error}</span> : <span />}<button type="submit" disabled={submitting || !body.trim()} style={buttonStyle}>{submitting ? "Enviando..." : "Comentar"}</button></div></form>;
+}
+const inputStyle: React.CSSProperties = { boxSizing: "border-box", width: "100%", resize: "vertical", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "4px", padding: "9px 10px", fontFamily: "inherit", fontSize: "13px", outline: "none" };
+const buttonStyle: React.CSSProperties = { fontSize: "12px", fontWeight: 600, color: "#fff", background: "var(--accent)", border: "none", borderRadius: "4px", padding: "7px 12px", cursor: "pointer" };
diff --git a/src/components/review/ReviewRequestDetail.tsx b/src/components/review/ReviewRequestDetail.tsx
new file mode 100644
index 0000000..0e6911e
--- /dev/null
+++ b/src/components/review/ReviewRequestDetail.tsx
@@ -0,0 +1,52 @@
+"use client";
+
+import Link from "next/link";
+import { useState } from "react";
+import type { ReviewComment, ReviewDecision, ReviewFileInput, ReviewRequest, ReviewRequestDetailDto } from "@/lib/review/types";
+import { ReviewCommentForm } from "./ReviewCommentForm";
+
+type Props = { request: ReviewRequestDetailDto; viewerMode: "author" | "reviewer" };
+type Tab = "skill" | "attachments" | "comments" | "metadata";
+
+export function ReviewRequestDetail({ request: initialRequest, viewerMode }: Props) {
+  const [request, setRequest] = useState(initialRequest); const [tab, setTab] = useState<Tab>("skill"); const [decisionComment, setDecisionComment] = useState(""); const [content, setContent] = useState(initialRequest.rawContent); const [files, setFiles] = useState<ReviewFileInput[]>(() => initialRequest.files.map(({ path, fileType, content: fileContent, changeType }) => ({ path, fileType, content: fileContent, changeType }))); const [message, setMessage] = useState<string | null>(null); const [busy, setBusy] = useState(false);
+  const canResubmit = viewerMode === "author" && request.status === "changes_requested";
+  async function decide(decision: ReviewDecision) { setBusy(true); setMessage(null); try { const response = await fetch(`/api/review-requests/${request.id}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, comment: decisionComment || null }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "No se pudo registrar la decision"); setRequest((current) => mergeRequestDetail(current, data.request)); setMessage("Decision registrada."); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "No se pudo registrar la decision"); } finally { setBusy(false); } }
+  async function resubmit() { setBusy(true); setMessage(null); try { const response = await fetch(`/api/review-requests/${request.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rawContent: content, files: files.map((file) => ({ ...file, path: file.path.trim() })) }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "No se pudo reenviar la propuesta"); const detailResponse = await fetch(`/api/review-requests/${request.id}`); const detailData = await detailResponse.json(); if (!detailResponse.ok) throw new Error(detailData.error ?? "No se pudo actualizar la propuesta"); setRequest(detailData.request); setFiles(detailData.request.files.map(({ path, fileType, content: fileContent, changeType }: ReviewFileInput) => ({ path, fileType, content: fileContent, changeType }))); setMessage("Propuesta reenviada para revision."); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "No se pudo reenviar la propuesta"); } finally { setBusy(false); } }
+  function updateFile(index: number, update: Partial<ReviewFileInput>) { setFiles((current) => current.map((file, fileIndex) => fileIndex === index ? { ...file, ...update } : file)); }
+  function addFile() { setFiles((current) => [...current, { path: "resources/new-file.txt", fileType: "resource", content: "", changeType: "added" }]); }
+  const comments = [...request.comments].sort((a, b) => a.createdAt - b.createdAt);
+  return <div>
+    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}><div><Link href={viewerMode === "author" ? "/dashboard/proposals" : "/dashboard/review"} style={{ fontSize: "12px", color: "var(--muted)", textDecoration: "none" }}>Volver a solicitudes</Link><h1 style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: "22px", margin: "8px 0 4px", color: "var(--text)" }}>{request.name}</h1><p style={{ margin: 0, fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", color: "var(--muted)" }}>{request.slug} · v{request.version}</p></div><span style={{ fontSize: "12px", color: "var(--amber)", border: "1px solid var(--amber)", borderRadius: "3px", padding: "4px 7px" }}>{request.status.replaceAll("_", " ")}</span></div>
+    {request.generalComment && <aside style={feedbackStyle}><strong>Comentario general del revisor</strong><p>{request.generalComment}</p></aside>}
+    {viewerMode === "reviewer" && request.status === "pending" && <div style={actionPanelStyle}><textarea value={decisionComment} onChange={(event) => setDecisionComment(event.target.value)} rows={2} placeholder="Comentario general (requerido para rechazar o pedir cambios)" style={textareaStyle} /><div style={{ display: "flex", gap: "8px", marginTop: "8px" }}><button disabled={busy} onClick={() => decide("approve")} style={approveStyle}>Aprobar</button><button disabled={busy} onClick={() => decide("request_changes")} style={neutralStyle}>Pedir cambios</button><button disabled={busy} onClick={() => decide("reject")} style={rejectStyle}>Rechazar</button></div></div>}
+    {canResubmit && <div style={actionPanelStyle}><div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "8px" }}>Actualiza SKILL.md y los adjuntos antes de reenviar la propuesta.</div><button disabled={busy} onClick={resubmit} style={approveStyle}>Reenviar a revision</button></div>}
+    {message && <p style={{ fontSize: "12px", color: message.includes(".") ? "var(--green)" : "var(--red)" }}>{message}</p>}
+    <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--border)", marginTop: "20px" }}>{([['skill', 'SKILL.md'], ['attachments', 'Adjuntos'], ['comments', `Comentarios (${comments.length})`], ['metadata', 'Metadata']] as [Tab, string][]).map(([id, label]) => <button key={id} onClick={() => setTab(id)} style={{ ...tabStyle, color: tab === id ? "var(--text)" : "var(--muted)", borderBottomColor: tab === id ? "var(--accent)" : "transparent" }}>{label}</button>)}</div>
+    <section style={contentStyle}>
+      {tab === "skill" && <><>{canResubmit ? <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={24} style={{ ...textareaStyle, fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px" }} /> : <pre style={preStyle}>{request.rawContent}</pre>}</><CommentThread comments={comments} filePath="SKILL.md" /><ReviewCommentForm requestId={request.id} filePath="SKILL.md" placeholder="Comentar SKILL.md..." onComment={(comment) => setRequest((current) => ({ ...current, comments: [...current.comments, comment] }))} /></>}
+      {tab === "attachments" && <div style={{ display: "grid", gap: "8px" }}>{canResubmit && <button type="button" onClick={addFile} style={{ ...neutralStyle, justifySelf: "start" }}>Agregar adjunto</button>}{files.length ? files.map((file, index) => <div key={`${file.path}-${index}`} style={fileStyle}>{canResubmit ? <><div style={attachmentFieldsStyle}><input value={file.path} onChange={(event) => updateFile(index, { path: event.target.value, changeType: file.changeType === "added" ? "added" : "modified" })} aria-label={`Ruta del adjunto ${index + 1}`} style={inputStyle} /><select value={file.fileType} onChange={(event) => updateFile(index, { fileType: event.target.value as ReviewFileInput["fileType"], changeType: file.changeType === "added" ? "added" : "modified" })} aria-label={`Tipo del adjunto ${index + 1}`} style={inputStyle}><option value="resource">Recurso</option><option value="script">Script</option></select><button type="button" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} style={rejectStyle}>Eliminar adjunto</button></div><textarea value={file.content ?? ""} onChange={(event) => updateFile(index, { content: event.target.value, changeType: file.changeType === "added" ? "added" : "modified" })} rows={8} aria-label={`Contenido del adjunto ${file.path || index + 1}`} style={{ ...textareaStyle, marginTop: "8px", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px" }} /></> : <><strong>{file.path}</strong><span>{file.fileType} · {file.changeType}</span><pre style={{ ...preStyle, marginTop: "10px" }}>{file.content}</pre></>}<CommentThread comments={comments} filePath={file.path} /><ReviewCommentForm requestId={request.id} filePath={file.path} placeholder={`Comentar ${file.path}...`} onComment={(comment) => setRequest((current) => ({ ...current, comments: [...current.comments, comment] }))} /></div>) : <p style={emptyCopyStyle}>Esta propuesta no tiene archivos adjuntos.</p>}</div>}
+      {tab === "comments" && <div><h2 style={sectionHeadingStyle}>Comentarios generales</h2><CommentThread comments={comments} filePath={null} emptyMessage="No hay comentarios generales todavia." /><ReviewCommentForm requestId={request.id} onComment={(comment) => setRequest((current) => ({ ...current, comments: [...current.comments, comment] }))} /><h2 style={sectionHeadingStyle}>Comentarios por archivo</h2>{comments.filter((comment) => comment.filePath).length === 0 ? <p style={emptyCopyStyle}>No hay comentarios por archivo todavia.</p> : comments.filter((comment) => comment.filePath).map((comment) => <Comment key={comment.id} comment={comment} />)}</div>}
+      {tab === "metadata" && <dl style={metadataStyle}>{[["Autor", request.authorHandle ?? "Sin nombre"], ["Revisor", request.reviewerHandle ?? "Sin asignar"], ["Tipo", request.type], ["Version de esquema", request.schemaVersion], ["Enviada", formatDate(request.submittedAt)], ["Actualizada", formatDate(request.updatedAt)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
+    </section>
+  </div>;
+}
+function mergeRequestDetail(current: ReviewRequestDetailDto, update: ReviewRequest): ReviewRequestDetailDto { return { ...current, ...update, files: current.files, comments: current.comments }; }
+function CommentThread({ comments, filePath, emptyMessage = "No hay comentarios para este archivo todavia." }: { comments: ReviewComment[]; filePath: string | null; emptyMessage?: string }) { const thread = comments.filter((comment) => comment.filePath === filePath); return thread.length ? <div>{thread.map((comment) => <Comment key={comment.id} comment={comment} />)}</div> : <p style={{ ...emptyCopyStyle, padding: "10px 0" }}>{emptyMessage}</p>; }
+function Comment({ comment }: { comment: ReviewComment }) { return <article style={{ borderBottom: "1px solid var(--border)", padding: "12px 0" }}><div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "12px" }}><strong style={{ color: "var(--text)" }}>{comment.authorHandle ?? "Usuario"}</strong><span style={{ color: "var(--faint)" }}>{formatDate(comment.createdAt)}</span></div>{comment.filePath && <div style={{ color: "var(--accent)", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", marginTop: "4px" }}>{comment.filePath}</div>}<p style={{ color: "var(--muted)", fontSize: "13px", whiteSpace: "pre-wrap", marginBottom: 0 }}>{comment.body}</p></article>; }
+function formatDate(value: number) { return new Date(value).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" }); }
+const actionPanelStyle: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", padding: "12px", marginBottom: "12px" };
+const feedbackStyle: React.CSSProperties = { ...actionPanelStyle, borderColor: "var(--amber)", color: "var(--text)" };
+const textareaStyle: React.CSSProperties = { boxSizing: "border-box", width: "100%", resize: "vertical", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "4px", padding: "9px 10px", fontFamily: "inherit", outline: "none" };
+const inputStyle: React.CSSProperties = { boxSizing: "border-box", minWidth: 0, background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "4px", padding: "7px 8px", fontFamily: "inherit", fontSize: "12px" };
+const attachmentFieldsStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "minmax(0, 1fr) 110px auto", gap: "8px", alignItems: "center" };
+const approveStyle: React.CSSProperties = { fontSize: "12px", fontWeight: 600, color: "#fff", background: "var(--green)", border: "none", borderRadius: "4px", padding: "7px 11px", cursor: "pointer" };
+const neutralStyle: React.CSSProperties = { fontSize: "12px", fontWeight: 600, color: "var(--text)", background: "var(--raised)", border: "1px solid var(--border)", borderRadius: "4px", padding: "7px 11px", cursor: "pointer" };
+const rejectStyle: React.CSSProperties = { ...approveStyle, background: "var(--red)" };
+const tabStyle: React.CSSProperties = { fontSize: "12px", fontWeight: 600, background: "none", border: "none", borderBottom: "2px solid", padding: "9px 10px", cursor: "pointer" };
+const contentStyle: React.CSSProperties = { marginTop: "14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", padding: "16px" };
+const preStyle: React.CSSProperties = { margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", lineHeight: 1.6, color: "var(--text)" };
+const fileStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: "4px", padding: "10px", fontSize: "12px", color: "var(--muted)" };
+const emptyCopyStyle: React.CSSProperties = { color: "var(--faint)", fontSize: "13px", textAlign: "center", padding: "20px 0" };
+const sectionHeadingStyle: React.CSSProperties = { color: "var(--text)", fontSize: "14px", margin: "20px 0 0" };
+const metadataStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", margin: 0 };
diff --git a/src/components/review/ReviewRequestList.tsx b/src/components/review/ReviewRequestList.tsx
new file mode 100644
index 0000000..458b8f6
--- /dev/null
+++ b/src/components/review/ReviewRequestList.tsx
@@ -0,0 +1,33 @@
+"use client";
+
+import Link from "next/link";
+import type { ReviewRequestSummary, ReviewStatus } from "@/lib/review/types";
+
+type Props = { requests: ReviewRequestSummary[]; mode: "author" | "reviewer" };
+
+const colors: Record<ReviewStatus, string> = { pending: "var(--amber)", changes_requested: "var(--accent)", approved: "var(--green)", rejected: "var(--red)" };
+const labels: Record<ReviewStatus, string> = { pending: "Pendiente", changes_requested: "Cambios solicitados", approved: "Aprobada", rejected: "Rechazada" };
+
+export function ReviewRequestList({ requests, mode }: Props) {
+  const basePath = mode === "author" ? "/dashboard/proposals" : "/dashboard/review";
+  if (!requests.length) return <div style={emptyStyle}>{mode === "author" ? "Aun no tienes propuestas para revisar." : "No hay solicitudes pendientes de revision."}</div>;
+  return <div style={tableStyle}>
+    <div style={headerStyle}>{["Solicitud", "Estado", "Autor", "Revisor", "Actualizada", ""].map((label) => <span key={label} style={labelStyle}>{label}</span>)}</div>
+    {requests.map((request, index) => <div key={request.id} style={{ ...rowStyle, borderBottom: index === requests.length - 1 ? "none" : "1px solid var(--border)" }}>
+      <div><div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>{request.slug}</div><div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px" }}>v{request.version} · {request.name}</div></div>
+      <span style={{ ...statusStyle, color: colors[request.status], borderColor: colors[request.status] }}>{labels[request.status]}</span>
+      <span style={cellStyle}>{request.authorHandle ?? "Sin nombre"}</span><span style={cellStyle}>{request.reviewerHandle ?? "Sin asignar"}</span><span style={cellStyle}>{formatDate(request.updatedAt)}</span>
+      <Link href={`${basePath}/${request.id}`} style={linkStyle}>Ver</Link>
+    </div>)}
+  </div>;
+}
+
+function formatDate(value: number) { return new Date(value).toLocaleDateString("es", { day: "2-digit", month: "short", year: "2-digit" }); }
+const tableStyle: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", overflow: "hidden" };
+const headerStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "2fr 140px 120px 120px 110px 48px", gap: "12px", padding: "10px 16px", background: "var(--raised)", borderBottom: "1px solid var(--border)" };
+const rowStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "2fr 140px 120px 120px 110px 48px", gap: "12px", padding: "13px 16px", alignItems: "center" };
+const labelStyle: React.CSSProperties = { fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted)" };
+const cellStyle: React.CSSProperties = { fontSize: "12px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
+const statusStyle: React.CSSProperties = { fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", letterSpacing: "0.4px", border: "1px solid", borderRadius: "3px", padding: "3px 6px", justifySelf: "start" };
+const linkStyle: React.CSSProperties = { fontSize: "12px", color: "var(--accent)", textDecoration: "none", fontWeight: 600 };
+const emptyStyle: React.CSSProperties = { padding: "40px 16px", textAlign: "center", fontSize: "13px", color: "var(--faint)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px" };
diff --git a/src/components/wizard/Step3Review.tsx b/src/components/wizard/Step3Review.tsx
index 1a9d8b2..2166075 100644
--- a/src/components/wizard/Step3Review.tsx
+++ b/src/components/wizard/Step3Review.tsx
@@ -315,21 +315,21 @@ export function Step3Review({ content, attachedFiles = [], onBack, onPublish }:
             borderRadius: "4px",
             border: "none",
             background: publishing ? "var(--faint)" : "var(--accent)",
             color: "#fff",
             cursor: publishing ? "not-allowed" : "pointer",
             display: "flex",
             alignItems: "center",
             gap: "8px",
           }}
         >
-          {publishing ? "Publicando…" : "Publicar skill →"}
+          {publishing ? "Enviando…" : "Enviar a revision"}
         </button>
       </div>
     </div>
   );
 }

 function SectionLabel({ children }: { children: React.ReactNode }) {
   return (
     <div
       style={{
diff --git a/src/lib/db/index.ts b/src/lib/db/index.ts
index 03f0054..ff47d21 100644
--- a/src/lib/db/index.ts
+++ b/src/lib/db/index.ts
@@ -1,35 +1,65 @@
 import path from "path";

 const dbUrl = process.env.DATABASE_URL ?? "";
 const isMysql = dbUrl.startsWith("mysql://") || dbUrl.startsWith("mysql2://");

 type ExecuteArg = string | { sql: string; args?: unknown[] };

+export type DbTransactionClient = {
+  execute: (input: ExecuteArg) => Promise<{ rows: Record<string, unknown>[] }>;
+};
+
+export type DbClient = DbTransactionClient & {
+  close: () => Promise<void>;
+  transaction: <T>(fn: (txClient: DbTransactionClient) => Promise<T>) => Promise<T>;
+};
+
 // ── MySQL (mysql2 + drizzle/mysql2) ──────────────────────────────────────────
 async function createMysqlDb() {
   const mysql = await import("mysql2/promise");
   const { drizzle } = await import("drizzle-orm/mysql2");
   const schema = await import("./schema.mysql");

-  const connection = await mysql.createConnection(dbUrl);
-  const db = drizzle(connection, { schema, mode: "default" });
+  const pool = mysql.createPool(dbUrl);
+  const db = drizzle(pool, { schema, mode: "default" });

   const client = {
     execute: async (input: ExecuteArg) => {
       const sql = typeof input === "string" ? input : input.sql;
       const args = typeof input === "string" ? [] : (input.args ?? []);
       // mysql2 expects OkPacket or RowDataPacket[], cast appropriately
-      const [rows] = await connection.execute(sql, args as (string | number | null)[]);
+      const [rows] = await pool.execute(sql, args as (string | number | null)[]);
       return { rows: (Array.isArray(rows) ? rows : []) as Record<string, unknown>[] };
     },
-    close: async () => { await connection.end(); },
+    transaction: async <T>(fn: (txClient: DbTransactionClient) => Promise<T>) => {
+      const connection = await pool.getConnection();
+      try {
+        await connection.beginTransaction();
+        const result = await fn({
+          execute: async (input) => {
+            const sql = typeof input === "string" ? input : input.sql;
+            const args = typeof input === "string" ? [] : (input.args ?? []);
+            const [rows] = await connection.execute(sql, args as (string | number | null)[]);
+            return { rows: (Array.isArray(rows) ? rows : []) as Record<string, unknown>[] };
+          },
+        });
+        await connection.commit();
+        return result;
+      } catch (error) {
+        await connection.rollback().catch(() => undefined);
+        throw error;
+      } finally {
+        connection.release();
+      }
+    },
+    close: async () => { await pool.end(); },
   };
   return { db, client };
 }

 // ── SQLite / LibSQL (default) ─────────────────────────────────────────────────
 async function createSqliteDb() {
   const { createClient } = await import("@libsql/client");
   const { drizzle } = await import("drizzle-orm/libsql");
   const schema = await import("./schema");

@@ -39,47 +69,64 @@ async function createSqliteDb() {

   // Wrap libsql client to normalize execute signature
   const client = {
     execute: async (input: ExecuteArg) => {
       if (typeof input === "string") {
         return libsqlClient.execute(input);
       }
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       return libsqlClient.execute(input as any);
     },
+    transaction: async <T>(fn: (txClient: DbTransactionClient) => Promise<T>) => {
+      const transaction = await libsqlClient.transaction("write");
+      try {
+        const result = await fn({
+          // eslint-disable-next-line @typescript-eslint/no-explicit-any
+          execute: async (input) => transaction.execute(input as any),
+        });
+        await transaction.commit();
+        return result;
+      } catch (error) {
+        await transaction.rollback().catch(() => undefined);
+        throw error;
+      }
+    },
     close: async () => { await libsqlClient.close(); },
   };
   return { db, client };
 }

 // ── Singleton ─────────────────────────────────────────────────────────────────
-type DbClient = {
-  execute: (input: ExecuteArg) => Promise<{ rows: Record<string, unknown>[] }>;
-  close: () => Promise<void>;
-};
-
 let _instance: { db: unknown; client: DbClient } | null = null;

 async function init() {
   if (_instance) return _instance;
   const result = isMysql ? await createMysqlDb() : await createSqliteDb();
   _instance = result as { db: unknown; client: DbClient };
   return _instance;
 }

 export const client: DbClient = {
   execute: async (input) => {
     const { client: c } = await init();
     return c.execute(input);
   },
   close: async () => {
     if (_instance) {
       await _instance.client.close();
       _instance = null;
     }
   },
+  transaction: async (fn) => {
+    const { client: c } = await init();
+    return c.transaction(fn);
+  },
 };

+export async function transaction<T>(fn: (txClient: DbTransactionClient) => Promise<T>): Promise<T> {
+  return client.transaction(fn);
+}
+
 export async function getDb() {
   const { db } = await init();
   return db;
 }
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
diff --git a/src/lib/review/api-contract.test.ts b/src/lib/review/api-contract.test.ts
new file mode 100644
index 0000000..cca214f
--- /dev/null
+++ b/src/lib/review/api-contract.test.ts
@@ -0,0 +1,348 @@
+import assert from "node:assert/strict";
+import test from "node:test";
+import { NextRequest } from "next/server";
+import { createReviewRequestsHandlers } from "../../app/api/review-requests/route";
+import { createReviewDecisionHandlers } from "../../app/api/review-requests/[id]/decision/route";
+import { createSkillHandlers } from "../../app/api/skills/route";
+import { createSkillDetailHandlers } from "../../app/api/skills/[slug]/route";
+import { createSkillDownloadHandlers } from "../../app/api/skills/[slug]/download/route";
+import { createSkillInstallHandlers } from "../../app/api/skills/[slug]/install/route";
+import { createSkillVersionHandlers } from "../../app/api/skills/[slug]/versions/route";
+import { POST as postSkillFiles } from "../../app/api/skills/[slug]/files/route";
+import type { ReviewDatabaseClient, ReviewRequest } from "./types";
+
+const reviewerSession = {
+  user: {
+    id: "reviewer-1",
+    name: "Reviewer",
+    email: "reviewer@example.test",
+    roles: ["reviewer"],
+  },
+};
+
+const database: ReviewDatabaseClient = {
+  async execute() {
+    return { rows: [] };
+  },
+};
+
+const context = { params: Promise.resolve({ id: "1" }) };
+
+const authorSession = {
+  user: {
+    id: "author-1",
+    name: "Author",
+    email: "author@example.test",
+    roles: ["author"],
+  },
+};
+
+const validRawContent = `---
+name: demo-skill
+description: A complete enough description for the demo review skill.
+version: 1.0.0
+schema_version: "1.1"
+metadata:
+  type: code
+  triggers:
+    - demo
+compatibility:
+  - claude
+---
+# Demo Skill
+
+## Descripcion
+
+Demo description.
+
+## Cuando usar
+
+Use this demo.
+
+## Instrucciones
+
+Follow these instructions.`;
+
+const updatedRawContent = validRawContent.replace("Follow these instructions.", "Follow the updated instructions.");
+
+function reviewRequest(overrides: Partial<ReviewRequest> = {}): ReviewRequest {
+  return {
+    id: 9,
+    skillId: null,
+    slug: "demo-skill",
+    name: "demo-skill",
+    description: "A complete enough description for the demo review skill.",
+    type: "code",
+    version: "1.0.0",
+    schemaVersion: "1.1",
+    authorId: "author-1",
+    authorHandle: "Author",
+    rawContent: validRawContent,
+    status: "pending",
+    reviewerId: null,
+    reviewerHandle: null,
+    generalComment: null,
+    submittedAt: 1,
+    reviewedAt: null,
+    updatedAt: 1,
+    ...overrides,
+  };
+}
+
+test("POST /api/skills creates a review request instead of a published skill", async () => {
+  const executedSql: string[] = [];
+  let createInput: unknown;
+  const { POST } = createSkillHandlers({
+    getSession: async () => authorSession as never,
+    database: {
+      async execute(input) {
+        executedSql.push(typeof input === "string" ? input : input.sql);
+        return { rows: [] };
+      },
+    },
+    create: async (input) => {
+      createInput = input;
+      return reviewRequest();
+    },
+  });
+
+  const response = await POST(new NextRequest("http://test/api/skills", {
+    method: "POST",
+    body: JSON.stringify({
+      rawContent: validRawContent,
+      files: [{ path: "resources/reference.md", fileType: "resource", content: "Reference" }],
+    }),
+  }));
+
+  assert.equal(response.status, 201);
+  assert.deepEqual(await response.json(), { slug: "demo-skill", reviewRequestId: 9, status: "pending" });
+  assert.deepEqual(createInput, {
+    rawContent: validRawContent,
+    files: [{ path: "resources/reference.md", fileType: "resource", content: "Reference" }],
+  });
+  assert.equal(executedSql.some((sql) => sql.includes("INSERT INTO skills")), false);
+});
+
+test("POST /api/skills/:slug/files is disabled while files are reviewed", async () => {
+  const response = await postSkillFiles(
+    new NextRequest("http://test/api/skills/demo-skill/files", {
+      method: "POST",
+      body: JSON.stringify({
+        files: [{ path: "resources/replaced.md", fileType: "resource", content: "Replacement" }],
+      }),
+    }),
+    { params: Promise.resolve({ slug: "demo-skill" }) }
+  );
+
+  assert.equal(response.status, 405);
+});
+
+test("PATCH /api/skills/:slug preserves published files when files are omitted", async () => {
+  const originalRawContent = validRawContent;
+  const publishedRawContent = originalRawContent;
+  const publishedFiles = [{ path: "resources/reference.md", fileType: "resource", content: "Reference" }];
+  let updateInput: unknown;
+  const { PATCH } = createSkillDetailHandlers({
+    getSession: async () => authorSession as never,
+    database: {
+      async execute(input) {
+        const sql = typeof input === "string" ? input : input.sql;
+        if (sql.includes("SELECT id, raw_content FROM skills")) {
+          return { rows: [{ id: 4, raw_content: publishedRawContent }] };
+        }
+        if (sql.includes("SELECT path, file_type, content FROM skill_files")) {
+          return { rows: [{ path: "resources/reference.md", file_type: "resource", content: "Reference" }] };
+        }
+        if (sql.includes("SELECT id FROM skill_review_requests")) {
+          return { rows: [{ id: 9 }] };
+        }
+        throw new Error(`Unexpected query: ${sql}`);
+      },
+    },
+    update: async (_id, input) => {
+      updateInput = input;
+      return reviewRequest({ skillId: 4, rawContent: updatedRawContent });
+    },
+  });
+
+  const response = await PATCH(
+    new NextRequest("http://test/api/skills/demo-skill", {
+      method: "PATCH",
+      body: JSON.stringify({ rawContent: updatedRawContent }),
+    }),
+    { params: Promise.resolve({ slug: "demo-skill" }) }
+  );
+
+  assert.equal(response.status, 201);
+  assert.deepEqual(await response.json(), { slug: "demo-skill", reviewRequestId: 9, status: "pending" });
+  assert.deepEqual(updateInput, {
+    rawContent: updatedRawContent,
+    files: [{ ...publishedFiles[0], changeType: "unchanged" }],
+  });
+  assert.equal(publishedRawContent, originalRawContent);
+});
+
+test("catalog excludes pending review requests", async () => {
+  let catalogSql = "";
+  const { GET } = createSkillHandlers({
+    database: {
+      async execute(input) {
+        catalogSql = typeof input === "string" ? input : input.sql;
+        return { rows: [] };
+      },
+    },
+  });
+
+  const response = await GET(new NextRequest("http://test/api/skills"));
+
+  assert.equal(response.status, 200);
+  assert.match(catalogSql, /FROM skills WHERE status = 'published'/);
+});
+
+test("detail returns published raw content while a pending version exists", async () => {
+  const publishedRawContent = "published skill content";
+  const { GET } = createSkillDetailHandlers({
+    database: {
+      async execute(input) {
+        const sql = typeof input === "string" ? input : input.sql;
+        assert.match(sql, /FROM skills WHERE slug = \? AND status = 'published'/);
+        return {
+          rows: [{
+            id: 4,
+            slug: "demo-skill",
+            name: "demo-skill",
+            description: "Published skill",
+            type: "code",
+            version: "1.0.0",
+            schema_version: "1.1",
+            triggers: "[]",
+            tools: "[]",
+            compatibility: "[\"claude\"]",
+            dependencies: "[]",
+            raw_content: publishedRawContent,
+            status: "published",
+            install_count: 0,
+          }],
+        };
+      },
+    },
+  });
+
+  const response = await GET(new NextRequest("http://test/api/skills/demo-skill"), { params: Promise.resolve({ slug: "demo-skill" }) });
+
+  assert.equal((await response.json()).rawContent, publishedRawContent);
+});
+
+test("download packages only published skill content and files", async () => {
+  const queries: string[] = [];
+  const { GET } = createSkillDownloadHandlers({
+    database: {
+      async execute(input) {
+        const sql = typeof input === "string" ? input : input.sql;
+        queries.push(sql);
+        if (sql.includes("FROM skills")) return { rows: [{ id: 4, raw_content: "published skill content" }] };
+        return { rows: [{ path: "resources/published.md", file_type: "resource", content: "published file" }] };
+      },
+    },
+  });
+
+  const response = await GET(new NextRequest("http://test/api/skills/demo-skill/download"), { params: Promise.resolve({ slug: "demo-skill" }) });
+
+  assert.equal(response.status, 200);
+  assert.match(queries[0], /status = 'published'/);
+  assert.match(queries[1], /FROM skill_files WHERE skill_id = \?/);
+});
+
+test("install increments only the published skill", async () => {
+  const queries: string[] = [];
+  const { POST } = createSkillInstallHandlers({
+    database: {
+      async execute(input) {
+        const sql = typeof input === "string" ? input : input.sql;
+        queries.push(sql);
+        if (sql.startsWith("SELECT")) return { rows: [{ id: 4, install_count: 2 }] };
+        return { rows: [] };
+      },
+    },
+  });
+
+  const response = await POST(new NextRequest("http://test/api/skills/demo-skill/install", { method: "POST" }), { params: Promise.resolve({ slug: "demo-skill" }) });
+
+  assert.deepEqual(await response.json(), { slug: "demo-skill", installCount: 3 });
+  assert.match(queries[0], /status = 'published'/);
+  assert.match(queries[1], /WHERE id = \? AND status = 'published'/);
+});
+
+test("versions belong to the published skill only", async () => {
+  const queries: string[] = [];
+  const { GET } = createSkillVersionHandlers({
+    database: {
+      async execute(input) {
+        const sql = typeof input === "string" ? input : input.sql;
+        queries.push(sql);
+        if (sql.includes("FROM skills")) return { rows: [{ id: 4 }] };
+        return { rows: [{ version: "1.0.0", created_at: 1 }] };
+      },
+    },
+  });
+
+  const response = await GET(new NextRequest("http://test/api/skills/demo-skill/versions"), { params: Promise.resolve({ slug: "demo-skill" }) });
+
+  assert.deepEqual(await response.json(), { versions: [{ version: "1.0.0", createdAt: 1 }] });
+  assert.match(queries[0], /status = 'published'/);
+});
+
+test("unauthenticated create returns 401", async () => {
+  const { POST } = createReviewRequestsHandlers({ getSession: async () => null as never });
+  const response = await POST(
+    new NextRequest("http://test/api/review-requests", { method: "POST" })
+  );
+
+  assert.equal(response.status, 401);
+});
+
+test("invalid decision returns 422 without mutating review state", async () => {
+  let called = false;
+  const { POST } = createReviewDecisionHandlers({
+    getSession: async () => reviewerSession as never,
+    database,
+    decide: async () => {
+      called = true;
+      return {} as ReviewRequest;
+    },
+  });
+
+  const response = await POST(
+    new NextRequest("http://test/api/review-requests/1/decision", {
+      method: "POST",
+      body: JSON.stringify({ decision: "anything" }),
+    }),
+    context
+  );
+
+  assert.equal(response.status, 422);
+  assert.equal(called, false);
+});
+
+test("request changes decision requires a general comment", async () => {
+  let called = false;
+  const { POST } = createReviewDecisionHandlers({
+    getSession: async () => reviewerSession as never,
+    database,
+    decide: async () => {
+      called = true;
+      return {} as ReviewRequest;
+    },
+  });
+
+  const response = await POST(
+    new NextRequest("http://test/api/review-requests/1/decision", {
+      method: "POST",
+      body: JSON.stringify({ decision: "request_changes" }),
+    }),
+    context
+  );
+
+  assert.equal(response.status, 422);
+  assert.equal(called, false);
+});
diff --git a/src/lib/review/auth.ts b/src/lib/review/auth.ts
new file mode 100644
index 0000000..402a571
--- /dev/null
+++ b/src/lib/review/auth.ts
@@ -0,0 +1,21 @@
+import type { ReviewActor, ReviewStatus } from "./types";
+
+export function hasRole(actor: ReviewActor, role: string): boolean {
+  return actor.roles.includes(role);
+}
+
+export function canReview(actor: ReviewActor): boolean {
+  return hasRole(actor, "reviewer") || hasRole(actor, "admin");
+}
+
+export function assertCanEditRequest(
+  actor: ReviewActor,
+  request: { authorId: string; status: ReviewStatus }
+) {
+  if (request.status !== "pending" && request.status !== "changes_requested") {
+    throw new Error("Request is not editable");
+  }
+  if (request.authorId !== actor.id) {
+    throw new Error("Only the author can edit this request");
+  }
+}
diff --git a/src/lib/review/files.test.ts b/src/lib/review/files.test.ts
new file mode 100644
index 0000000..1221519
--- /dev/null
+++ b/src/lib/review/files.test.ts
@@ -0,0 +1,17 @@
+import test from "node:test";
+import assert from "node:assert/strict";
+import { validateReviewFilePath } from "./files";
+
+test("rejects absolute paths", () => {
+  assert.throws(() => validateReviewFilePath("C:\\\\temp\\\\x.md"), /relative/);
+  assert.throws(() => validateReviewFilePath("/tmp/x.md"), /relative/);
+});
+
+test("rejects traversal paths", () => {
+  assert.throws(() => validateReviewFilePath("../secret.md"), /traversal/);
+  assert.throws(() => validateReviewFilePath("docs/../../secret.md"), /traversal/);
+});
+
+test("accepts nested relative paths", () => {
+  assert.equal(validateReviewFilePath("resources/reference.md"), "resources/reference.md");
+});
diff --git a/src/lib/review/files.ts b/src/lib/review/files.ts
new file mode 100644
index 0000000..a38eb9b
--- /dev/null
+++ b/src/lib/review/files.ts
@@ -0,0 +1,11 @@
+export function validateReviewFilePath(path: string): string {
+  const normalized = path.replace(/\\/g, "/").trim();
+  if (!normalized) throw new Error("File path is required");
+  if (normalized.startsWith("/") || /^[a-zA-Z]:\//.test(normalized)) {
+    throw new Error("File path must be relative");
+  }
+  if (normalized.split("/").includes("..")) {
+    throw new Error("File path must not contain traversal");
+  }
+  return normalized;
+}
diff --git a/src/lib/review/service.test.ts b/src/lib/review/service.test.ts
new file mode 100644
index 0000000..a2219da
--- /dev/null
+++ b/src/lib/review/service.test.ts
@@ -0,0 +1,319 @@
+import test from "node:test";
+import assert from "node:assert/strict";
+import {
+  addReviewComment,
+  createReviewRequest,
+  decideReviewRequest,
+  updateReviewRequest,
+} from "./service";
+import type { ReviewActor, ReviewDatabaseClient } from "./types";
+
+const validRawContent = `---
+name: demo-skill
+description: A complete enough description for the demo review skill.
+version: 1.0.0
+schema_version: "1.1"
+metadata:
+  type: code
+  triggers:
+    - demo
+compatibility:
+  - claude
+---
+# Demo Skill
+
+## Descripcion
+
+Demo description.
+
+## Cuando usar
+
+Use this demo.
+
+## Instrucciones
+
+Follow these instructions.`;
+
+const authorActor: ReviewActor = { id: "author-1", handle: "author", roles: ["author"] };
+const reviewerActor: ReviewActor = { id: "reviewer-1", handle: "reviewer", roles: ["reviewer"] };
+const adminActor: ReviewActor = { id: "admin-1", handle: "admin", roles: ["admin"] };
+
+type FakeClient = ReviewDatabaseClient & {
+  transaction: <T>(fn: (txClient: ReviewDatabaseClient) => Promise<T>) => Promise<T>;
+  insertedSkill?: Record<string, unknown>;
+  insertedFiles: Array<Record<string, unknown>>;
+  insertedVersion?: Record<string, unknown>;
+  updatedRequest?: Record<string, unknown>;
+  failOnSkillInsert: boolean;
+  failOnVersionInsert: boolean;
+  failOnApprovalUpdate: boolean;
+  commands: string[];
+};
+
+function createFakeClient(
+  files: Array<Record<string, unknown>> = [],
+  requestOverrides: Partial<Record<string, unknown>> = {}
+): FakeClient {
+  const comments: Array<Record<string, unknown>> = [];
+  const request = {
+    id: 1,
+    skill_id: null,
+    slug: "demo-skill",
+    name: "demo-skill",
+    description: "A complete enough description for the demo review skill.",
+    type: "code",
+    version: "1.0.0",
+    schema_version: "1.1",
+    author_id: "author-1",
+    author_handle: "author",
+    raw_content: validRawContent,
+    status: "pending",
+    reviewer_id: null,
+    reviewer_handle: null,
+    general_comment: null,
+    submitted_at: 1,
+    reviewed_at: null,
+    updated_at: 1,
+    ...requestOverrides,
+  };
+
+  const fakeClient: FakeClient = {
+    insertedFiles: [],
+    failOnSkillInsert: false,
+    failOnVersionInsert: false,
+    failOnApprovalUpdate: false,
+    commands: [],
+    transaction: async (fn) => fn(fakeClient),
+    async execute(input) {
+      const sql = typeof input === "string" ? input : input.sql;
+      const args = typeof input === "string" ? [] : input.args ?? [];
+      fakeClient.commands.push(sql);
+      if (sql.includes("SELECT * FROM skill_review_requests WHERE id = ?")) {
+        return { rows: [request] };
+      }
+      if (sql.includes("SELECT * FROM skill_review_requests") && sql.includes("ORDER BY id DESC")) {
+        return { rows: [request] };
+      }
+      if (sql.includes("SELECT * FROM skill_review_files WHERE review_request_id = ?")) {
+        return { rows: files };
+      }
+      if (sql.includes("INSERT INTO skills")) {
+        if (fakeClient.failOnSkillInsert) throw new Error("activation failed");
+        fakeClient.insertedSkill = {
+          id: 7,
+          slug: args[0],
+          name: args[1],
+        };
+        return { rows: [] };
+      }
+      if (sql.includes("SELECT id FROM skills WHERE slug = ?")) {
+        return { rows: [{ id: 7 }] };
+      }
+      if (sql.includes("DELETE FROM skill_files")) {
+        return { rows: [] };
+      }
+      if (sql.includes("INSERT INTO skill_files")) {
+        fakeClient.insertedFiles.push({ skillId: args[0], path: args[1], fileType: args[2], content: args[3] });
+        return { rows: [] };
+      }
+      if (sql.includes("INSERT INTO skill_versions")) {
+        if (fakeClient.failOnVersionInsert) throw new Error("version insert failed");
+        fakeClient.insertedVersion = { skillId: args[0], version: args[1], rawContent: args[2] };
+        return { rows: [] };
+      }
+      if (sql.includes("UPDATE skill_review_requests")) {
+        if (fakeClient.failOnApprovalUpdate && args[0] === "approved") throw new Error("approval update failed");
+        fakeClient.updatedRequest = { status: args[0] };
+        return { rows: [] };
+      }
+      if (sql.includes("INSERT INTO skill_review_comments")) {
+        comments.unshift({
+          id: comments.length + 1,
+          review_request_id: args[0],
+          file_path: args[1],
+          author_id: args[2],
+          author_handle: args[3],
+          body: args[4],
+          created_at: 1,
+        });
+        return { rows: [] };
+      }
+      if (sql.includes("SELECT * FROM skill_review_comments WHERE review_request_id = ? ORDER BY id DESC LIMIT 1")) {
+        return { rows: comments.slice(0, 1) };
+      }
+      if (sql.includes("SELECT * FROM skill_review_comments WHERE review_request_id = ?")) {
+        return { rows: comments };
+      }
+      return { rows: [] };
+    },
+  };
+  return fakeClient;
+}
+
+test("author creates pending request for a new skill", async () => {
+  const request = await createReviewRequest({ rawContent: validRawContent, files: [] }, authorActor, createFakeClient());
+  assert.equal(request.status, "pending");
+  assert.equal(request.slug, "demo-skill");
+});
+
+test("author cannot approve own request", async () => {
+  await assert.rejects(
+    () => decideReviewRequest(1, { decision: "approve" }, authorActor, createFakeClient()),
+    /cannot approve own request/
+  );
+});
+
+test("request_changes requires comment", async () => {
+  await assert.rejects(
+    () => decideReviewRequest(1, { decision: "request_changes" }, reviewerActor, createFakeClient()),
+    /comment required/
+  );
+});
+
+test("invalid review decision is rejected", async () => {
+  await assert.rejects(
+    () => decideReviewRequest(1, { decision: "anything" as never }, reviewerActor, createFakeClient()),
+    /Invalid review decision/
+  );
+});
+
+test("admin cannot edit another author's request", async () => {
+  await assert.rejects(
+    () => updateReviewRequest(1, { rawContent: validRawContent, files: [] }, adminActor, createFakeClient()),
+    /Only the author can edit this request/
+  );
+});
+
+test("per-file comment rejects a path that is not attached", async () => {
+  await assert.rejects(
+    () => addReviewComment(1, { body: "Missing attachment", filePath: "resources/missing.md" }, reviewerActor, createFakeClient()),
+    /attached file/
+  );
+});
+
+test("per-file comment accepts SKILL.md and an attached file", async () => {
+  const file = {
+    id: 1,
+    review_request_id: 1,
+    path: "resources/reference.md",
+    file_type: "resource",
+    content: "Reference content",
+    change_type: "added",
+    created_at: 1,
+  };
+
+  const skillComment = await addReviewComment(1, { body: "Skill note", filePath: "SKILL.md" }, reviewerActor, createFakeClient([file]));
+  const attachedFileComment = await addReviewComment(1, { body: "File note", filePath: "resources/reference.md" }, reviewerActor, createFakeClient([file]));
+
+  assert.equal(skillComment.filePath, "SKILL.md");
+  assert.equal(attachedFileComment.filePath, "resources/reference.md");
+});
+
+test("approving new skill creates published skill, files, and version snapshot", async () => {
+  const files = [
+    {
+      id: 1,
+      review_request_id: 1,
+      path: "resources/reference.md",
+      file_type: "resource",
+      content: "Published reference",
+      change_type: "added",
+      created_at: 1,
+    },
+    {
+      id: 2,
+      review_request_id: 1,
+      path: "resources/removed.md",
+      file_type: "resource",
+      content: "Deleted reference",
+      change_type: "deleted",
+      created_at: 1,
+    },
+  ];
+  const fakeClient = createFakeClient(files);
+
+  const request = await decideReviewRequest(1, { decision: "approve" }, reviewerActor, fakeClient);
+
+  assert.equal(request.status, "approved");
+  assert.equal(fakeClient.insertedSkill?.slug, "demo-skill");
+  assert.deepEqual(fakeClient.insertedFiles, [{ skillId: 7, path: "resources/reference.md", fileType: "resource", content: "Published reference" }]);
+  assert.deepEqual(fakeClient.insertedVersion, { skillId: 7, version: "1.0.0", rawContent: validRawContent });
+  assert.equal(fakeClient.updatedRequest?.status, "approved");
+});
+
+test("approval activation uses the transaction-scoped client", async () => {
+  const outerClient = createFakeClient();
+  const transactionClient = createFakeClient();
+  let transactionCalled = false;
+  outerClient.transaction = async (fn) => {
+    transactionCalled = true;
+    return fn(transactionClient);
+  };
+
+  await decideReviewRequest(1, { decision: "approve" }, reviewerActor, outerClient);
+
+  assert.equal(transactionCalled, true);
+  assert.equal(outerClient.insertedSkill, undefined);
+  assert.equal(outerClient.updatedRequest, undefined);
+  assert.equal(transactionClient.insertedSkill?.slug, "demo-skill");
+  assert.equal(transactionClient.updatedRequest?.status, "approved");
+});
+
+test("approval failure leaves request pending", async () => {
+  const fakeClient = createFakeClient();
+  fakeClient.failOnSkillInsert = true;
+
+  await assert.rejects(
+    () => decideReviewRequest(1, { decision: "approve" }, reviewerActor, fakeClient),
+    /activation failed/
+  );
+
+  assert.notEqual(fakeClient.updatedRequest?.status, "approved");
+});
+
+test("approving an existing skill replaces published content and files", async () => {
+  const fakeClient = createFakeClient([
+    {
+      id: 1,
+      review_request_id: 1,
+      path: "resources/replacement.md",
+      file_type: "resource",
+      content: "Replacement content",
+      change_type: "modified",
+      created_at: 1,
+    },
+  ], { skill_id: 7 });
+
+  await decideReviewRequest(1, { decision: "approve" }, reviewerActor, fakeClient);
+
+  assert.equal(fakeClient.insertedSkill, undefined);
+  assert.deepEqual(fakeClient.insertedFiles, [{ skillId: 7, path: "resources/replacement.md", fileType: "resource", content: "Replacement content" }]);
+  assert.ok(fakeClient.commands.some((sql) => sql.includes("UPDATE skills")));
+  assert.ok(fakeClient.commands.some((sql) => sql.includes("DELETE FROM skill_files")));
+});
+
+test("version insert failure rolls back activation without approving the request", async () => {
+  const fakeClient = createFakeClient();
+  fakeClient.failOnVersionInsert = true;
+
+  await assert.rejects(
+    () => decideReviewRequest(1, { decision: "approve" }, reviewerActor, fakeClient),
+    /version insert failed/
+  );
+
+  assert.notEqual(fakeClient.updatedRequest?.status, "approved");
+  assert.equal(fakeClient.updatedRequest, undefined);
+});
+
+test("approval update failure rolls back published writes without approving the request", async () => {
+  const fakeClient = createFakeClient();
+  fakeClient.failOnApprovalUpdate = true;
+
+  await assert.rejects(
+    () => decideReviewRequest(1, { decision: "approve" }, reviewerActor, fakeClient),
+    /approval update failed/
+  );
+
+  assert.notEqual(fakeClient.updatedRequest?.status, "approved");
+  assert.equal(fakeClient.updatedRequest, undefined);
+});
diff --git a/src/lib/review/service.ts b/src/lib/review/service.ts
new file mode 100644
index 0000000..0498ca6
--- /dev/null
+++ b/src/lib/review/service.ts
@@ -0,0 +1,408 @@
+import matter from "gray-matter";
+import { validateBodySections, validateSkillFrontmatter } from "@/lib/skill-schema";
+import { assertCanEditRequest, canReview, hasRole } from "./auth";
+import { validateReviewFilePath } from "./files";
+import type {
+  AddReviewCommentInput,
+  CreateReviewRequestInput,
+  DecideReviewRequestInput,
+  ListReviewRequestsQuery,
+  ReviewActor,
+  ReviewComment,
+  ReviewDatabaseClient,
+  ReviewFile,
+  ReviewFileInput,
+  ReviewRequest,
+  ReviewRequestDetailDto,
+  ReviewRequestSummary,
+  ReviewStatus,
+  UpdateReviewRequestInput,
+} from "./types";
+
+function asNumber(value: unknown): number {
+  return typeof value === "number" ? value : Number(value);
+}
+
+function asNullableNumber(value: unknown): number | null {
+  return value === null || value === undefined ? null : asNumber(value);
+}
+
+function asNullableString(value: unknown): string | null {
+  return typeof value === "string" ? value : null;
+}
+
+function toRequest(row: Record<string, unknown>): ReviewRequest {
+  return {
+    id: asNumber(row.id),
+    skillId: asNullableNumber(row.skill_id),
+    slug: String(row.slug),
+    name: String(row.name),
+    description: String(row.description),
+    type: String(row.type),
+    version: String(row.version),
+    schemaVersion: String(row.schema_version),
+    authorId: String(row.author_id),
+    authorHandle: asNullableString(row.author_handle),
+    rawContent: String(row.raw_content),
+    status: row.status as ReviewStatus,
+    reviewerId: asNullableString(row.reviewer_id),
+    reviewerHandle: asNullableString(row.reviewer_handle),
+    generalComment: asNullableString(row.general_comment),
+    submittedAt: asNumber(row.submitted_at),
+    reviewedAt: asNullableNumber(row.reviewed_at),
+    updatedAt: asNumber(row.updated_at),
+  };
+}
+
+function toFile(row: Record<string, unknown>): ReviewFile {
+  return {
+    id: asNumber(row.id),
+    reviewRequestId: asNumber(row.review_request_id),
+    path: String(row.path),
+    fileType: row.file_type as ReviewFile["fileType"],
+    content: String(row.content),
+    changeType: row.change_type as ReviewFile["changeType"],
+    createdAt: asNumber(row.created_at),
+  };
+}
+
+function toComment(row: Record<string, unknown>): ReviewComment {
+  return {
+    id: asNumber(row.id),
+    reviewRequestId: asNumber(row.review_request_id),
+    filePath: asNullableString(row.file_path),
+    authorId: String(row.author_id),
+    authorHandle: asNullableString(row.author_handle),
+    body: String(row.body),
+    createdAt: asNumber(row.created_at),
+  };
+}
+
+function validateSubmission(rawContent: string, files: ReviewFileInput[] = []) {
+  if (!rawContent.trim()) throw new Error("SKILL.md content is required");
+
+  const parsed = matter(rawContent);
+  const frontmatter = validateSkillFrontmatter(parsed.data);
+  const body = validateBodySections(parsed.content);
+  const errors = [...frontmatter.errors, ...body.errors];
+  if (!frontmatter.valid || errors.length > 0) {
+    throw new Error(errors.map((error) => error.message).join("; "));
+  }
+
+  const paths = new Set<string>();
+  const normalizedFiles = files.map((file) => {
+    const path = validateReviewFilePath(file.path);
+    if (paths.has(path)) throw new Error("Review file paths must be unique");
+    paths.add(path);
+    return { ...file, path, content: file.content ?? "", changeType: file.changeType ?? "added" };
+  });
+
+  return { frontmatter: frontmatter.parsed!, files: normalizedFiles };
+}
+
+function assertValidDecision(input: DecideReviewRequestInput): void {
+  if (!["approve", "reject", "request_changes"].includes(input.decision)) {
+    throw new Error("Invalid review decision");
+  }
+}
+
+async function getRequestRow(id: number, client: ReviewDatabaseClient): Promise<ReviewRequest> {
+  const result = await client.execute({
+    sql: "SELECT * FROM skill_review_requests WHERE id = ?",
+    args: [id],
+  });
+  if (result.rows.length === 0) throw new Error("Review request not found");
+  return toRequest(result.rows[0]);
+}
+
+async function replaceFiles(id: number, files: ReturnType<typeof validateSubmission>["files"], client: ReviewDatabaseClient) {
+  await client.execute({ sql: "DELETE FROM skill_review_files WHERE review_request_id = ?", args: [id] });
+  for (const file of files) {
+    await client.execute({
+      sql: `INSERT INTO skill_review_files
+        (review_request_id, path, file_type, content, change_type)
+        VALUES (?, ?, ?, ?, ?)`,
+      args: [id, file.path, file.fileType, file.content, file.changeType],
+    });
+  }
+}
+
+async function activateApprovedRequest(
+  request: ReviewRequest,
+  actor: ReviewActor,
+  comment: string | null,
+  client: ReviewDatabaseClient
+): Promise<void> {
+  const { frontmatter } = validateSubmission(request.rawContent);
+  const reviewFiles = await client.execute({
+    sql: "SELECT * FROM skill_review_files WHERE review_request_id = ? ORDER BY id",
+    args: [request.id],
+  });
+  const publishedAt = Math.floor(Date.now() / 1000);
+
+  let skillId = request.skillId;
+  if (skillId === null) {
+    await client.execute({
+        sql: `INSERT INTO skills
+          (slug, name, description, type, author_id, author_handle, version, schema_version,
+           triggers, tools, compatibility, dependencies, raw_content, status, published_at)
+          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)`,
+        args: [
+          request.slug,
+          request.name,
+          request.description,
+          request.type,
+          request.authorId,
+          request.authorHandle,
+          request.version,
+          request.schemaVersion,
+          JSON.stringify(frontmatter.metadata.triggers),
+          JSON.stringify(frontmatter.metadata.tools),
+          JSON.stringify(frontmatter.compatibility),
+          JSON.stringify(frontmatter.dependencies),
+          request.rawContent,
+          publishedAt,
+        ],
+    });
+    const inserted = await client.execute({
+        sql: "SELECT id FROM skills WHERE slug = ? AND status = 'published' LIMIT 1",
+        args: [request.slug],
+    });
+    if (inserted.rows.length === 0) throw new Error("activation failed: published skill was not created");
+    skillId = asNumber(inserted.rows[0].id);
+  } else {
+    await client.execute({
+        sql: `UPDATE skills
+          SET slug = ?, name = ?, description = ?, type = ?, author_id = ?, author_handle = ?,
+              version = ?, schema_version = ?, triggers = ?, tools = ?, compatibility = ?,
+              dependencies = ?, raw_content = ?, status = 'published', published_at = ?, updated_at = ?
+          WHERE id = ? AND status = 'published'`,
+        args: [
+          request.slug,
+          request.name,
+          request.description,
+          request.type,
+          request.authorId,
+          request.authorHandle,
+          request.version,
+          request.schemaVersion,
+          JSON.stringify(frontmatter.metadata.triggers),
+          JSON.stringify(frontmatter.metadata.tools),
+          JSON.stringify(frontmatter.compatibility),
+          JSON.stringify(frontmatter.dependencies),
+          request.rawContent,
+          publishedAt,
+          publishedAt,
+          skillId,
+        ],
+    });
+  }
+
+  await client.execute({ sql: "DELETE FROM skill_files WHERE skill_id = ?", args: [skillId] });
+  for (const file of reviewFiles.rows.map(toFile)) {
+    if (file.changeType === "deleted") continue;
+    await client.execute({
+        sql: "INSERT INTO skill_files (skill_id, path, file_type, content) VALUES (?, ?, ?, ?)",
+        args: [skillId, file.path, file.fileType, file.content],
+    });
+  }
+  await client.execute({
+      sql: "INSERT INTO skill_versions (skill_id, version, raw_content) VALUES (?, ?, ?)",
+      args: [skillId, request.version, request.rawContent],
+  });
+  await client.execute({
+      sql: `UPDATE skill_review_requests
+        SET status = ?, reviewer_id = ?, reviewer_handle = ?, general_comment = ?,
+            reviewed_at = ?, updated_at = ?
+        WHERE id = ?`,
+      args: ["approved", actor.id, actor.handle ?? null, comment, publishedAt, publishedAt, request.id],
+  });
+}
+
+export async function createReviewRequest(
+  input: CreateReviewRequestInput,
+  actor: ReviewActor,
+  client: ReviewDatabaseClient
+): Promise<ReviewRequest> {
+  const { frontmatter, files } = validateSubmission(input.rawContent, input.files);
+  const duplicate = await client.execute({
+    sql: `SELECT id FROM skill_review_requests
+      WHERE slug = ? AND version = ? AND status IN ('pending', 'changes_requested')`,
+    args: [frontmatter.name, frontmatter.version],
+  });
+  if (duplicate.rows.length > 0) throw new Error("An open review request already exists");
+
+  await client.execute({
+    sql: `INSERT INTO skill_review_requests
+      (skill_id, slug, name, description, type, version, schema_version, author_id, author_handle, raw_content, status)
+      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
+    args: [
+      input.skillId ?? null,
+      frontmatter.name,
+      frontmatter.name,
+      frontmatter.description,
+      frontmatter.metadata.type,
+      frontmatter.version,
+      frontmatter.schema_version,
+      actor.id,
+      actor.handle ?? null,
+      input.rawContent,
+    ],
+  });
+
+  const created = await client.execute({
+    sql: `SELECT * FROM skill_review_requests
+      WHERE author_id = ? AND slug = ? AND version = ?
+      ORDER BY id DESC LIMIT 1`,
+    args: [actor.id, frontmatter.name, frontmatter.version],
+  });
+  if (created.rows.length === 0) throw new Error("Review request was not created");
+
+  const request = toRequest(created.rows[0]);
+  await replaceFiles(request.id, files, client);
+  return request;
+}
+
+export async function updateReviewRequest(
+  id: number,
+  input: UpdateReviewRequestInput,
+  actor: ReviewActor,
+  client: ReviewDatabaseClient
+): Promise<ReviewRequest> {
+  const request = await getRequestRow(id, client);
+  assertCanEditRequest(actor, request);
+  const { frontmatter, files } = validateSubmission(input.rawContent, input.files);
+
+  await client.execute({
+    sql: `UPDATE skill_review_requests
+      SET slug = ?, name = ?, description = ?, type = ?, version = ?, schema_version = ?, raw_content = ?,
+          status = 'pending', reviewer_id = NULL, reviewer_handle = NULL, general_comment = NULL,
+          reviewed_at = NULL, updated_at = ?
+      WHERE id = ?`,
+    args: [
+      frontmatter.name,
+      frontmatter.name,
+      frontmatter.description,
+      frontmatter.metadata.type,
+      frontmatter.version,
+      frontmatter.schema_version,
+      input.rawContent,
+      Math.floor(Date.now() / 1000),
+      id,
+    ],
+  });
+  await replaceFiles(id, files, client);
+  return getRequestRow(id, client);
+}
+
+export async function listReviewRequests(
+  query: ListReviewRequestsQuery,
+  actor: ReviewActor,
+  client: ReviewDatabaseClient
+): Promise<ReviewRequestSummary[]> {
+  const clauses: string[] = [];
+  const args: unknown[] = [];
+  if (query.mine || !canReview(actor)) {
+    clauses.push("author_id = ?");
+    args.push(actor.id);
+  }
+  if (query.status) {
+    clauses.push("status = ?");
+    args.push(query.status);
+  }
+  const where = clauses.length > 0 ? ` WHERE ${clauses.join(" AND ")}` : "";
+  const result = await client.execute({
+    sql: `SELECT * FROM skill_review_requests${where} ORDER BY updated_at DESC, id DESC`,
+    args,
+  });
+  return result.rows.map(toRequest).map((request) => {
+    const { rawContent, ...summary } = request;
+    void rawContent;
+    return summary;
+  });
+}
+
+export async function getReviewRequest(
+  id: number,
+  actor: ReviewActor,
+  client: ReviewDatabaseClient
+): Promise<ReviewRequestDetailDto> {
+  const request = await getRequestRow(id, client);
+  if (request.authorId !== actor.id && !canReview(actor) && !hasRole(actor, "admin")) {
+    throw new Error("Not allowed to view this request");
+  }
+  const [files, comments] = await Promise.all([
+    client.execute({ sql: "SELECT * FROM skill_review_files WHERE review_request_id = ? ORDER BY id", args: [id] }),
+    client.execute({ sql: "SELECT * FROM skill_review_comments WHERE review_request_id = ? ORDER BY id", args: [id] }),
+  ]);
+  return { ...request, files: files.rows.map(toFile), comments: comments.rows.map(toComment) };
+}
+
+export async function addReviewComment(
+  id: number,
+  input: AddReviewCommentInput,
+  actor: ReviewActor,
+  client: ReviewDatabaseClient
+): Promise<ReviewComment> {
+  const request = await getReviewRequest(id, actor, client);
+  const body = input.body.trim();
+  if (!body) throw new Error("Comment is required");
+  const filePath = input.filePath === null || input.filePath === undefined
+    ? null
+    : validateReviewFilePath(input.filePath);
+  if (filePath && filePath !== "SKILL.md" && !request.files.some((file) => file.path === filePath)) {
+    throw new Error("Comment file path must match an attached file");
+  }
+  await client.execute({
+    sql: `INSERT INTO skill_review_comments
+      (review_request_id, file_path, author_id, author_handle, body)
+      VALUES (?, ?, ?, ?, ?)`,
+    args: [id, filePath, actor.id, actor.handle ?? null, body],
+  });
+  const result = await client.execute({
+    sql: "SELECT * FROM skill_review_comments WHERE review_request_id = ? ORDER BY id DESC LIMIT 1",
+    args: [id],
+  });
+  if (result.rows.length === 0) throw new Error("Comment was not created");
+  return toComment(result.rows[0]);
+}
+
+export async function decideReviewRequest(
+  id: number,
+  input: DecideReviewRequestInput,
+  actor: ReviewActor,
+  client: ReviewDatabaseClient
+): Promise<ReviewRequest> {
+  assertValidDecision(input);
+  const request = await getRequestRow(id, client);
+  if (request.authorId === actor.id) throw new Error("Author cannot approve own request");
+  if (!canReview(actor)) throw new Error("Reviewer role is required");
+  if (request.status !== "pending" && request.status !== "changes_requested") {
+    throw new Error("Review request is not active");
+  }
+  if ((input.decision === "reject" || input.decision === "request_changes") && !input.comment?.trim()) {
+    throw new Error("A general comment required for this decision");
+  }
+
+  const status: ReviewStatus = input.decision === "approve"
+    ? "approved"
+    : input.decision === "reject"
+      ? "rejected"
+      : "changes_requested";
+  if (input.decision === "approve") {
+    if (!client.transaction) throw new Error("Database transactions are required for approval");
+    await client.transaction((transactionClient) =>
+      activateApprovedRequest(request, actor, input.comment?.trim() ?? null, transactionClient)
+    );
+  } else {
+    const decidedAt = Math.floor(Date.now() / 1000);
+    await client.execute({
+      sql: `UPDATE skill_review_requests
+        SET status = ?, reviewer_id = ?, reviewer_handle = ?, general_comment = ?,
+            reviewed_at = ?, updated_at = ?
+        WHERE id = ?`,
+      args: [status, actor.id, actor.handle ?? null, input.comment?.trim() ?? null, decidedAt, decidedAt, id],
+    });
+  }
+  return { ...request, status, reviewerId: actor.id, reviewerHandle: actor.handle ?? null, generalComment: input.comment?.trim() ?? null };
+}
diff --git a/src/lib/review/types.ts b/src/lib/review/types.ts
new file mode 100644
index 0000000..a64a5e1
--- /dev/null
+++ b/src/lib/review/types.ts
@@ -0,0 +1,98 @@
+export type ReviewStatus = "pending" | "changes_requested" | "approved" | "rejected";
+export type ReviewDecision = "approve" | "reject" | "request_changes";
+export type ReviewFileType = "resource" | "script";
+export type ReviewFileChangeType = "added" | "modified" | "deleted" | "unchanged";
+
+export type ReviewActor = {
+  id: string;
+  handle?: string | null;
+  roles: string[];
+};
+
+export type ReviewFileInput = {
+  path: string;
+  fileType: ReviewFileType;
+  content?: string;
+  changeType?: ReviewFileChangeType;
+};
+
+export type CreateReviewRequestInput = {
+  rawContent: string;
+  files?: ReviewFileInput[];
+  skillId?: number | null;
+};
+
+export type UpdateReviewRequestInput = {
+  rawContent: string;
+  files?: ReviewFileInput[];
+};
+
+export type ListReviewRequestsQuery = {
+  mine?: boolean;
+  status?: ReviewStatus;
+};
+
+export type AddReviewCommentInput = {
+  body: string;
+  filePath?: string | null;
+};
+
+export type DecideReviewRequestInput = {
+  decision: ReviewDecision;
+  comment?: string | null;
+};
+
+export type ReviewRequest = {
+  id: number;
+  skillId: number | null;
+  slug: string;
+  name: string;
+  description: string;
+  type: string;
+  version: string;
+  schemaVersion: string;
+  authorId: string;
+  authorHandle: string | null;
+  rawContent: string;
+  status: ReviewStatus;
+  reviewerId: string | null;
+  reviewerHandle: string | null;
+  generalComment: string | null;
+  submittedAt: number;
+  reviewedAt: number | null;
+  updatedAt: number;
+};
+
+export type ReviewFile = {
+  id: number;
+  reviewRequestId: number;
+  path: string;
+  fileType: ReviewFileType;
+  content: string;
+  changeType: ReviewFileChangeType;
+  createdAt: number;
+};
+
+export type ReviewComment = {
+  id: number;
+  reviewRequestId: number;
+  filePath: string | null;
+  authorId: string;
+  authorHandle: string | null;
+  body: string;
+  createdAt: number;
+};
+
+export type ReviewRequestSummary = Omit<ReviewRequest, "rawContent">;
+
+export type ReviewRequestDetailDto = ReviewRequest & {
+  files: ReviewFile[];
+  comments: ReviewComment[];
+};
+
+export type ReviewDatabaseClient = {
+  execute: (input: string | { sql: string; args?: unknown[] }) => Promise<{
+    rows: Record<string, unknown>[];
+  }>;
+  transaction?: <T>(fn: (txClient: ReviewDatabaseClient) => Promise<T>) => Promise<T>;
+};
diff --git a/src/lib/review/ui-smoke.test.ts b/src/lib/review/ui-smoke.test.ts
new file mode 100644
index 0000000..a3d57ef
--- /dev/null
+++ b/src/lib/review/ui-smoke.test.ts
@@ -0,0 +1,78 @@
+import assert from "node:assert/strict";
+import { readFile } from "node:fs/promises";
+import test from "node:test";
+
+const source = (path: string) => readFile(new URL(path, import.meta.url), "utf8");
+
+test("review dashboard routes export page components", async () => {
+  const [queue, detail] = await Promise.all([
+    import("@/app/dashboard/review/page"),
+    import("@/app/dashboard/review/[id]/page"),
+  ]);
+
+  assert.equal(typeof queue.default, "function");
+  assert.equal(typeof detail.default, "function");
+});
+
+test("proposal dashboard routes export page components", async () => {
+  const [list, detail] = await Promise.all([
+    import("@/app/dashboard/proposals/page"),
+    import("@/app/dashboard/proposals/[id]/page"),
+  ]);
+
+  assert.equal(typeof list.default, "function");
+  assert.equal(typeof detail.default, "function");
+});
+
+test("review detail replaces attachments from a successful resubmission while preserving comments", async () => {
+  const detail = await source("../../components/review/ReviewRequestDetail.tsx");
+
+  assert.match(detail, /initialRequest\.files\.map/);
+  assert.match(detail, /const detailResponse = await fetch\(`\/api\/review-requests\/\$\{request\.id\}`\)/);
+  assert.match(detail, /setRequest\(detailData\.request\)/);
+  assert.match(detail, /generalComment/);
+  assert.match(detail, /Comentario general del revisor/);
+});
+
+test("author resubmission supports editable attachments and sends their current state", async () => {
+  const detail = await source("../../components/review/ReviewRequestDetail.tsx");
+
+  assert.match(detail, /const \[files, setFiles\] = useState/);
+  assert.match(detail, /files: files\.map/);
+  assert.match(detail, /Agregar adjunto/);
+  assert.match(detail, /Eliminar adjunto/);
+  assert.match(detail, /setFiles\(\(current\) => current\.filter/);
+});
+
+test("review detail supports general and file-specific comments", async () => {
+  const [detail, commentForm] = await Promise.all([
+    source("../../components/review/ReviewRequestDetail.tsx"),
+    source("../../components/review/ReviewCommentForm.tsx"),
+  ]);
+
+  assert.match(detail, /filePath="SKILL\.md"/);
+  assert.match(detail, /filePath=\{file\.path\}/);
+  assert.match(detail, /comment\.filePath/);
+  assert.match(commentForm, /filePath\?: string \| null/);
+  assert.match(commentForm, /JSON\.stringify\(\{ body: body\.trim\(\), filePath \}\)/);
+});
+
+test("dashboard pages fetch review request API endpoints", async () => {
+  const [queue, reviewDetail, proposals, proposalDetail, helper] = await Promise.all([
+    source("../../app/dashboard/review/page.tsx"),
+    source("../../app/dashboard/review/[id]/page.tsx"),
+    source("../../app/dashboard/proposals/page.tsx"),
+    source("../../app/dashboard/proposals/[id]/page.tsx"),
+    source("../../app/dashboard/review-api.ts"),
+  ]);
+
+  for (const page of [queue, reviewDetail, proposals, proposalDetail]) {
+    assert.doesNotMatch(page, /@\/lib\/db|@\/lib\/review\/service/);
+  }
+  assert.match(proposals, /fetchReviewRequests\("\?mine=1"\)/);
+  assert.match(queue, /fetchReviewRequests\("\?status=pending"\)/);
+  assert.match(reviewDetail, /fetchReviewRequest\(id\)/);
+  assert.match(proposalDetail, /fetchReviewRequest\(id\)/);
+  assert.match(helper, /\/api\/review-requests/);
+  assert.match(helper, /cookie/);
+});
diff --git a/src/types/next-auth.d.ts b/src/types/next-auth.d.ts
index a24d163..1822e84 100644
--- a/src/types/next-auth.d.ts
+++ b/src/types/next-auth.d.ts
@@ -1,18 +1,17 @@
+import type { DefaultSession } from "next-auth";
 import "next-auth";

 declare module "next-auth" {
   interface Session {
-    user: {
-      name?: string | null;
-      email?: string | null;
-      image?: string | null;
+    user: DefaultSession["user"] & {
+      id: string;
       roles: string[];
     };
   }
 }

 declare module "next-auth/jwt" {
   interface JWT {
     roles?: string[];
   }
 }

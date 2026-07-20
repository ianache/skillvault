# Task 7 Review Package

## Commits
080f480 docs: document review workflow

## Stat
 .superpowers/sdd/task-7-report.md | 42 ++++++++++++++++++++++++++++++++
 README.md                         |  4 +++
 docs/review-workflow.md           | 51 +++++++++++++++++++++++++++++++++++++++
 3 files changed, 97 insertions(+)

## Diff
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
index 5bde0ab..dd868ee 100644
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

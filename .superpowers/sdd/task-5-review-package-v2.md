# Task 5 Review Package v2

## Commits
172decb fix: complete review dashboard workflows
fce0872 feat: add review dashboards

## Stat
 .superpowers/sdd/task-5-report.md             | 54 ++++++++++++++++++++++
 src/app/dashboard/page.tsx                    | 32 +++++++++++++
 src/app/dashboard/proposals/[id]/page.tsx     | 16 +++++++
 src/app/dashboard/proposals/page.tsx          | 15 ++++++
 src/app/dashboard/review-api.ts               | 30 ++++++++++++
 src/app/dashboard/review/[id]/page.tsx        | 16 +++++++
 src/app/dashboard/review/page.tsx             | 18 ++++++++
 src/components/NavLinks.tsx                   |  2 +
 src/components/review/ReviewCommentForm.tsx   | 23 ++++++++++
 src/components/review/ReviewRequestDetail.tsx | 47 +++++++++++++++++++
 src/components/review/ReviewRequestList.tsx   | 33 ++++++++++++++
 src/lib/review/ui-smoke.test.ts               | 66 +++++++++++++++++++++++++++
 12 files changed, 352 insertions(+)

## Diff
diff --git a/.superpowers/sdd/task-5-report.md b/.superpowers/sdd/task-5-report.md
new file mode 100644
index 0000000..a405c38
--- /dev/null
+++ b/.superpowers/sdd/task-5-report.md
@@ -0,0 +1,54 @@
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
index 0000000..9233542
--- /dev/null
+++ b/src/components/review/ReviewRequestDetail.tsx
@@ -0,0 +1,47 @@
+"use client";
+
+import Link from "next/link";
+import { useState } from "react";
+import type { ReviewComment, ReviewDecision, ReviewRequestDetailDto } from "@/lib/review/types";
+import { ReviewCommentForm } from "./ReviewCommentForm";
+
+type Props = { request: ReviewRequestDetailDto; viewerMode: "author" | "reviewer" };
+type Tab = "skill" | "attachments" | "comments" | "metadata";
+
+export function ReviewRequestDetail({ request: initialRequest, viewerMode }: Props) {
+  const [request, setRequest] = useState(initialRequest); const [tab, setTab] = useState<Tab>("skill"); const [decisionComment, setDecisionComment] = useState(""); const [content, setContent] = useState(initialRequest.rawContent); const [message, setMessage] = useState<string | null>(null); const [busy, setBusy] = useState(false);
+  const canResubmit = viewerMode === "author" && request.status === "changes_requested";
+  async function decide(decision: ReviewDecision) { setBusy(true); setMessage(null); try { const response = await fetch(`/api/review-requests/${request.id}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, comment: decisionComment || null }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "No se pudo registrar la decision"); setRequest((current) => ({ ...current, ...data.request })); setMessage("Decision registrada."); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "No se pudo registrar la decision"); } finally { setBusy(false); } }
+  async function resubmit() { setBusy(true); setMessage(null); try { const response = await fetch(`/api/review-requests/${request.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rawContent: content, files: request.files.map(({ path, fileType, content: fileContent, changeType }) => ({ path, fileType, content: fileContent, changeType })) }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "No se pudo reenviar la propuesta"); setRequest((current) => ({ ...current, ...data.request })); setMessage("Propuesta reenviada para revision."); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "No se pudo reenviar la propuesta"); } finally { setBusy(false); } }
+  const comments = [...request.comments].sort((a, b) => a.createdAt - b.createdAt);
+  return <div>
+    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}><div><Link href={viewerMode === "author" ? "/dashboard/proposals" : "/dashboard/review"} style={{ fontSize: "12px", color: "var(--muted)", textDecoration: "none" }}>Volver a solicitudes</Link><h1 style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: "22px", margin: "8px 0 4px", color: "var(--text)" }}>{request.name}</h1><p style={{ margin: 0, fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", color: "var(--muted)" }}>{request.slug} · v{request.version}</p></div><span style={{ fontSize: "12px", color: "var(--amber)", border: "1px solid var(--amber)", borderRadius: "3px", padding: "4px 7px" }}>{request.status.replaceAll("_", " ")}</span></div>
+    {request.generalComment && <aside style={feedbackStyle}><strong>Comentario general del revisor</strong><p>{request.generalComment}</p></aside>}
+    {viewerMode === "reviewer" && request.status === "pending" && <div style={actionPanelStyle}><textarea value={decisionComment} onChange={(event) => setDecisionComment(event.target.value)} rows={2} placeholder="Comentario general (requerido para rechazar o pedir cambios)" style={textareaStyle} /><div style={{ display: "flex", gap: "8px", marginTop: "8px" }}><button disabled={busy} onClick={() => decide("approve")} style={approveStyle}>Aprobar</button><button disabled={busy} onClick={() => decide("request_changes")} style={neutralStyle}>Pedir cambios</button><button disabled={busy} onClick={() => decide("reject")} style={rejectStyle}>Rechazar</button></div></div>}
+    {canResubmit && <div style={actionPanelStyle}><div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "8px" }}>Actualiza SKILL.md y reenvia la propuesta.</div><button disabled={busy} onClick={resubmit} style={approveStyle}>Reenviar a revision</button></div>}
+    {message && <p style={{ fontSize: "12px", color: message.includes(".") ? "var(--green)" : "var(--red)" }}>{message}</p>}
+    <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--border)", marginTop: "20px" }}>{([['skill', 'SKILL.md'], ['attachments', 'Adjuntos'], ['comments', `Comentarios (${comments.length})`], ['metadata', 'Metadata']] as [Tab, string][]).map(([id, label]) => <button key={id} onClick={() => setTab(id)} style={{ ...tabStyle, color: tab === id ? "var(--text)" : "var(--muted)", borderBottomColor: tab === id ? "var(--accent)" : "transparent" }}>{label}</button>)}</div>
+    <section style={contentStyle}>
+      {tab === "skill" && <><>{canResubmit ? <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={24} style={{ ...textareaStyle, fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px" }} /> : <pre style={preStyle}>{request.rawContent}</pre>}</><CommentThread comments={comments} filePath="SKILL.md" /><ReviewCommentForm requestId={request.id} filePath="SKILL.md" placeholder="Comentar SKILL.md..." onComment={(comment) => setRequest((current) => ({ ...current, comments: [...current.comments, comment] }))} /></>}
+      {tab === "attachments" && (request.files.length ? <div style={{ display: "grid", gap: "8px" }}>{request.files.map((file) => <div key={file.id} style={fileStyle}><strong>{file.path}</strong><span>{file.fileType} · {file.changeType}</span><pre style={{ ...preStyle, marginTop: "10px" }}>{file.content}</pre><CommentThread comments={comments} filePath={file.path} /><ReviewCommentForm requestId={request.id} filePath={file.path} placeholder={`Comentar ${file.path}...`} onComment={(comment) => setRequest((current) => ({ ...current, comments: [...current.comments, comment] }))} /></div>)}</div> : <p style={emptyCopyStyle}>Esta propuesta no tiene archivos adjuntos.</p>)}
+      {tab === "comments" && <div><h2 style={sectionHeadingStyle}>Comentarios generales</h2><CommentThread comments={comments} filePath={null} emptyMessage="No hay comentarios generales todavia." /><ReviewCommentForm requestId={request.id} onComment={(comment) => setRequest((current) => ({ ...current, comments: [...current.comments, comment] }))} /><h2 style={sectionHeadingStyle}>Comentarios por archivo</h2>{comments.filter((comment) => comment.filePath).length === 0 ? <p style={emptyCopyStyle}>No hay comentarios por archivo todavia.</p> : comments.filter((comment) => comment.filePath).map((comment) => <Comment key={comment.id} comment={comment} />)}</div>}
+      {tab === "metadata" && <dl style={metadataStyle}>{[["Autor", request.authorHandle ?? "Sin nombre"], ["Revisor", request.reviewerHandle ?? "Sin asignar"], ["Tipo", request.type], ["Version de esquema", request.schemaVersion], ["Enviada", formatDate(request.submittedAt)], ["Actualizada", formatDate(request.updatedAt)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
+    </section>
+  </div>;
+}
+function CommentThread({ comments, filePath, emptyMessage = "No hay comentarios para este archivo todavia." }: { comments: ReviewComment[]; filePath: string | null; emptyMessage?: string }) { const thread = comments.filter((comment) => comment.filePath === filePath); return thread.length ? <div>{thread.map((comment) => <Comment key={comment.id} comment={comment} />)}</div> : <p style={{ ...emptyCopyStyle, padding: "10px 0" }}>{emptyMessage}</p>; }
+function Comment({ comment }: { comment: ReviewComment }) { return <article style={{ borderBottom: "1px solid var(--border)", padding: "12px 0" }}><div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "12px" }}><strong style={{ color: "var(--text)" }}>{comment.authorHandle ?? "Usuario"}</strong><span style={{ color: "var(--faint)" }}>{formatDate(comment.createdAt)}</span></div>{comment.filePath && <div style={{ color: "var(--accent)", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", marginTop: "4px" }}>{comment.filePath}</div>}<p style={{ color: "var(--muted)", fontSize: "13px", whiteSpace: "pre-wrap", marginBottom: 0 }}>{comment.body}</p></article>; }
+function formatDate(value: number) { return new Date(value).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" }); }
+const actionPanelStyle: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", padding: "12px", marginBottom: "12px" };
+const feedbackStyle: React.CSSProperties = { ...actionPanelStyle, borderColor: "var(--amber)", color: "var(--text)" };
+const textareaStyle: React.CSSProperties = { boxSizing: "border-box", width: "100%", resize: "vertical", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "4px", padding: "9px 10px", fontFamily: "inherit", outline: "none" };
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
diff --git a/src/lib/review/ui-smoke.test.ts b/src/lib/review/ui-smoke.test.ts
new file mode 100644
index 0000000..8d03928
--- /dev/null
+++ b/src/lib/review/ui-smoke.test.ts
@@ -0,0 +1,66 @@
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
+test("review detail preserves files when an author resubmits and shows decision feedback", async () => {
+  const detail = await source("../../components/review/ReviewRequestDetail.tsx");
+
+  assert.match(detail, /files:\s*request\.files\.map/);
+  assert.match(detail, /generalComment/);
+  assert.match(detail, /Comentario general del revisor/);
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

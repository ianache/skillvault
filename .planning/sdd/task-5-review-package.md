# Task 5 Review Package

## Commits
fce0872 feat: add review dashboards

## Stat
 .superpowers/sdd/task-5-report.md             | 39 ++++++++++++++++++++++++
 src/app/dashboard/page.tsx                    | 32 ++++++++++++++++++++
 src/app/dashboard/proposals/[id]/page.tsx     | 18 +++++++++++
 src/app/dashboard/proposals/page.tsx          | 18 +++++++++++
 src/app/dashboard/review/[id]/page.tsx        | 18 +++++++++++
 src/app/dashboard/review/page.tsx             | 20 +++++++++++++
 src/components/NavLinks.tsx                   |  2 ++
 src/components/review/ReviewCommentForm.tsx   | 18 +++++++++++
 src/components/review/ReviewRequestDetail.tsx | 43 +++++++++++++++++++++++++++
 src/components/review/ReviewRequestList.tsx   | 33 ++++++++++++++++++++
 src/lib/review/ui-smoke.test.ts               | 22 ++++++++++++++
 11 files changed, 263 insertions(+)

## Diff
diff --git a/.superpowers/sdd/task-5-report.md b/.superpowers/sdd/task-5-report.md
new file mode 100644
index 0000000..0f4df22
--- /dev/null
+++ b/.superpowers/sdd/task-5-report.md
@@ -0,0 +1,39 @@
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
index 0000000..06714c6
--- /dev/null
+++ b/src/app/dashboard/proposals/[id]/page.tsx
@@ -0,0 +1,18 @@
+import { AppHeader } from "@/components/AppHeader";
+import { ReviewRequestDetail } from "@/components/review/ReviewRequestDetail";
+import { auth } from "@/auth";
+import { client } from "@/lib/db";
+import { getReviewRequest } from "@/lib/review/service";
+import { actorFromSession } from "@/app/api/review-requests/route-utils";
+import type { ReviewRequestDetailDto } from "@/lib/review/types";
+
+export const dynamic = "force-dynamic";
+
+export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
+  const session = await auth(); const actor = session ? actorFromSession(session) : null; const id = Number((await params).id);
+  let request: ReviewRequestDetailDto | null = null; let error: string | null = null;
+  if (actor && Number.isInteger(id) && id > 0) { try { request = await getReviewRequest(id, actor, client); } catch (reason) { error = reason instanceof Error ? reason.message : "No se pudo cargar la propuesta."; } }
+  const content = request ? <ReviewRequestDetail request={request} viewerMode="author" /> : <State message={error ?? "Inicia sesion para ver esta propuesta."} />;
+  return <div style={{ minHeight: "100vh", background: "var(--bg)" }}><AppHeader /><main style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 24px" }}>{content}</main></div>;
+}
+function State({ message }: { message: string }) { return <div style={{ padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--muted)", fontSize: "13px" }}>{message}</div>; }
diff --git a/src/app/dashboard/proposals/page.tsx b/src/app/dashboard/proposals/page.tsx
new file mode 100644
index 0000000..bc86542
--- /dev/null
+++ b/src/app/dashboard/proposals/page.tsx
@@ -0,0 +1,18 @@
+import { AppHeader } from "@/components/AppHeader";
+import { ReviewRequestList } from "@/components/review/ReviewRequestList";
+import { auth } from "@/auth";
+import { client } from "@/lib/db";
+import { listReviewRequests } from "@/lib/review/service";
+import { actorFromSession } from "@/app/api/review-requests/route-utils";
+
+export const dynamic = "force-dynamic";
+
+export default async function ProposalsPage() {
+  const session = await auth();
+  const actor = session ? actorFromSession(session) : null;
+  const requests = actor ? await listReviewRequests({ mine: true }, actor, client) : null;
+  return <div style={{ minHeight: "100vh", background: "var(--bg)" }}><AppHeader /><main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}><h1 style={headingStyle}>Mis propuestas</h1><p style={descriptionStyle}>Estado y comentarios de los skills enviados a revision.</p>{requests ? <ReviewRequestList requests={requests} mode="author" /> : <State message="Inicia sesion para ver tus propuestas." />}</main></div>;
+}
+function State({ message }: { message: string }) { return <div style={{ padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--muted)", fontSize: "13px" }}>{message}</div>; }
+const headingStyle: React.CSSProperties = { fontFamily: "var(--font-geist), sans-serif", fontSize: "24px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px" };
+const descriptionStyle: React.CSSProperties = { fontSize: "13px", color: "var(--muted)", margin: "0 0 24px" };
diff --git a/src/app/dashboard/review/[id]/page.tsx b/src/app/dashboard/review/[id]/page.tsx
new file mode 100644
index 0000000..1330643
--- /dev/null
+++ b/src/app/dashboard/review/[id]/page.tsx
@@ -0,0 +1,18 @@
+import { AppHeader } from "@/components/AppHeader";
+import { ReviewRequestDetail } from "@/components/review/ReviewRequestDetail";
+import { auth } from "@/auth";
+import { client } from "@/lib/db";
+import { getReviewRequest } from "@/lib/review/service";
+import { actorFromSession } from "@/app/api/review-requests/route-utils";
+import type { ReviewRequestDetailDto } from "@/lib/review/types";
+
+export const dynamic = "force-dynamic";
+
+export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
+  const session = await auth(); const actor = session ? actorFromSession(session) : null; const id = Number((await params).id); const canReview = actor?.roles.includes("reviewer") || actor?.roles.includes("admin");
+  let request: ReviewRequestDetailDto | null = null; let error: string | null = null;
+  if (actor && canReview && Number.isInteger(id) && id > 0) { try { request = await getReviewRequest(id, actor, client); } catch (reason) { error = reason instanceof Error ? reason.message : "No se pudo cargar la solicitud."; } }
+  const content = request ? <ReviewRequestDetail request={request} viewerMode="reviewer" /> : <State message={error ?? "No tienes permiso para revisar solicitudes."} />;
+  return <div style={{ minHeight: "100vh", background: "var(--bg)" }}><AppHeader /><main style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 24px" }}>{content}</main></div>;
+}
+function State({ message }: { message: string }) { return <div style={{ padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--muted)", fontSize: "13px" }}>{message}</div>; }
diff --git a/src/app/dashboard/review/page.tsx b/src/app/dashboard/review/page.tsx
new file mode 100644
index 0000000..a4d27ca
--- /dev/null
+++ b/src/app/dashboard/review/page.tsx
@@ -0,0 +1,20 @@
+import { AppHeader } from "@/components/AppHeader";
+import { ReviewRequestList } from "@/components/review/ReviewRequestList";
+import { auth } from "@/auth";
+import { client } from "@/lib/db";
+import { listReviewRequests } from "@/lib/review/service";
+import { actorFromSession } from "@/app/api/review-requests/route-utils";
+
+export const dynamic = "force-dynamic";
+
+export default async function ReviewQueuePage() {
+  const session = await auth();
+  const actor = session ? actorFromSession(session) : null;
+  const canReview = actor?.roles.includes("reviewer") || actor?.roles.includes("admin");
+  const requests = canReview && actor ? await listReviewRequests({ status: "pending" }, actor, client) : null;
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
index 0000000..c0745a3
--- /dev/null
+++ b/src/components/review/ReviewCommentForm.tsx
@@ -0,0 +1,18 @@
+"use client";
+
+import { useState } from "react";
+import type { ReviewComment } from "@/lib/review/types";
+
+type Props = { requestId: number; onComment: (comment: ReviewComment) => void };
+
+export function ReviewCommentForm({ requestId, onComment }: Props) {
+  const [body, setBody] = useState(""); const [error, setError] = useState<string | null>(null); const [submitting, setSubmitting] = useState(false);
+  async function submit(event: React.FormEvent<HTMLFormElement>) {
+    event.preventDefault(); if (!body.trim()) return; setSubmitting(true); setError(null);
+    try { const response = await fetch(`/api/review-requests/${requestId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: body.trim() }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "No se pudo agregar el comentario"); onComment(data.comment); setBody(""); }
+    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo agregar el comentario"); } finally { setSubmitting(false); }
+  }
+  return <form onSubmit={submit} style={{ marginTop: "14px" }}><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Agregar un comentario..." rows={3} style={inputStyle} /><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px", gap: "12px" }}>{error ? <span style={{ fontSize: "12px", color: "var(--red)" }}>{error}</span> : <span />}<button type="submit" disabled={submitting || !body.trim()} style={buttonStyle}>{submitting ? "Enviando..." : "Comentar"}</button></div></form>;
+}
+const inputStyle: React.CSSProperties = { boxSizing: "border-box", width: "100%", resize: "vertical", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "4px", padding: "9px 10px", fontFamily: "inherit", fontSize: "13px", outline: "none" };
+const buttonStyle: React.CSSProperties = { fontSize: "12px", fontWeight: 600, color: "#fff", background: "var(--accent)", border: "none", borderRadius: "4px", padding: "7px 12px", cursor: "pointer" };
diff --git a/src/components/review/ReviewRequestDetail.tsx b/src/components/review/ReviewRequestDetail.tsx
new file mode 100644
index 0000000..ab333ae
--- /dev/null
+++ b/src/components/review/ReviewRequestDetail.tsx
@@ -0,0 +1,43 @@
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
+  async function resubmit() { setBusy(true); setMessage(null); try { const response = await fetch(`/api/review-requests/${request.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rawContent: content }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "No se pudo reenviar la propuesta"); setRequest((current) => ({ ...current, ...data.request })); setMessage("Propuesta reenviada para revision."); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "No se pudo reenviar la propuesta"); } finally { setBusy(false); } }
+  const comments = [...request.comments].sort((a, b) => a.createdAt - b.createdAt);
+  return <div>
+    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}><div><Link href={viewerMode === "author" ? "/dashboard/proposals" : "/dashboard/review"} style={{ fontSize: "12px", color: "var(--muted)", textDecoration: "none" }}>Volver a solicitudes</Link><h1 style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: "22px", margin: "8px 0 4px", color: "var(--text)" }}>{request.name}</h1><p style={{ margin: 0, fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", color: "var(--muted)" }}>{request.slug} · v{request.version}</p></div><span style={{ fontSize: "12px", color: "var(--amber)", border: "1px solid var(--amber)", borderRadius: "3px", padding: "4px 7px" }}>{request.status.replaceAll("_", " ")}</span></div>
+    {viewerMode === "reviewer" && request.status === "pending" && <div style={actionPanelStyle}><textarea value={decisionComment} onChange={(event) => setDecisionComment(event.target.value)} rows={2} placeholder="Comentario general (requerido para rechazar o pedir cambios)" style={textareaStyle} /><div style={{ display: "flex", gap: "8px", marginTop: "8px" }}><button disabled={busy} onClick={() => decide("approve")} style={approveStyle}>Aprobar</button><button disabled={busy} onClick={() => decide("request_changes")} style={neutralStyle}>Pedir cambios</button><button disabled={busy} onClick={() => decide("reject")} style={rejectStyle}>Rechazar</button></div></div>}
+    {canResubmit && <div style={actionPanelStyle}><div style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "8px" }}>Actualiza SKILL.md y reenvia la propuesta.</div><button disabled={busy} onClick={resubmit} style={approveStyle}>Reenviar a revision</button></div>}
+    {message && <p style={{ fontSize: "12px", color: message.includes(".") ? "var(--green)" : "var(--red)" }}>{message}</p>}
+    <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--border)", marginTop: "20px" }}>{([['skill', 'SKILL.md'], ['attachments', 'Adjuntos'], ['comments', `Comentarios (${comments.length})`], ['metadata', 'Metadata']] as [Tab, string][]).map(([id, label]) => <button key={id} onClick={() => setTab(id)} style={{ ...tabStyle, color: tab === id ? "var(--text)" : "var(--muted)", borderBottomColor: tab === id ? "var(--accent)" : "transparent" }}>{label}</button>)}</div>
+    <section style={contentStyle}>
+      {tab === "skill" && (canResubmit ? <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={24} style={{ ...textareaStyle, fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px" }} /> : <pre style={preStyle}>{request.rawContent}</pre>)}
+      {tab === "attachments" && (request.files.length ? <div style={{ display: "grid", gap: "8px" }}>{request.files.map((file) => <div key={file.id} style={fileStyle}><strong>{file.path}</strong><span>{file.fileType} · {file.changeType}</span><pre style={{ ...preStyle, marginTop: "10px" }}>{file.content}</pre></div>)}</div> : <p style={emptyCopyStyle}>Esta propuesta no tiene archivos adjuntos.</p>)}
+      {tab === "comments" && <div>{comments.length === 0 ? <p style={emptyCopyStyle}>No hay comentarios todavia.</p> : comments.map((comment) => <Comment key={comment.id} comment={comment} />)}<ReviewCommentForm requestId={request.id} onComment={(comment) => setRequest((current) => ({ ...current, comments: [...current.comments, comment] }))} /></div>}
+      {tab === "metadata" && <dl style={metadataStyle}>{[["Autor", request.authorHandle ?? "Sin nombre"], ["Revisor", request.reviewerHandle ?? "Sin asignar"], ["Tipo", request.type], ["Version de esquema", request.schemaVersion], ["Enviada", formatDate(request.submittedAt)], ["Actualizada", formatDate(request.updatedAt)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
+    </section>
+  </div>;
+}
+function Comment({ comment }: { comment: ReviewComment }) { return <article style={{ borderBottom: "1px solid var(--border)", padding: "12px 0" }}><div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "12px" }}><strong style={{ color: "var(--text)" }}>{comment.authorHandle ?? "Usuario"}</strong><span style={{ color: "var(--faint)" }}>{formatDate(comment.createdAt)}</span></div><p style={{ color: "var(--muted)", fontSize: "13px", whiteSpace: "pre-wrap", marginBottom: 0 }}>{comment.body}</p></article>; }
+function formatDate(value: number) { return new Date(value).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" }); }
+const actionPanelStyle: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", padding: "12px", marginBottom: "12px" };
+const textareaStyle: React.CSSProperties = { boxSizing: "border-box", width: "100%", resize: "vertical", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "4px", padding: "9px 10px", fontFamily: "inherit", outline: "none" };
+const approveStyle: React.CSSProperties = { fontSize: "12px", fontWeight: 600, color: "#fff", background: "var(--green)", border: "none", borderRadius: "4px", padding: "7px 11px", cursor: "pointer" };
+const neutralStyle: React.CSSProperties = { fontSize: "12px", fontWeight: 600, color: "var(--text)", background: "var(--raised)", border: "1px solid var(--border)", borderRadius: "4px", padding: "7px 11px", cursor: "pointer" };
+const rejectStyle: React.CSSProperties = { ...approveStyle, background: "var(--red)" };
+const tabStyle: React.CSSProperties = { fontSize: "12px", fontWeight: 600, background: "none", border: "none", borderBottom: "2px solid", padding: "9px 10px", cursor: "pointer" };
+const contentStyle: React.CSSProperties = { marginTop: "14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", padding: "16px" };
+const preStyle: React.CSSProperties = { margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", lineHeight: 1.6, color: "var(--text)" };
+const fileStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: "4px", padding: "10px", fontSize: "12px", color: "var(--muted)" };
+const emptyCopyStyle: React.CSSProperties = { color: "var(--faint)", fontSize: "13px", textAlign: "center", padding: "20px 0" };
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
index 0000000..5289356
--- /dev/null
+++ b/src/lib/review/ui-smoke.test.ts
@@ -0,0 +1,22 @@
+import assert from "node:assert/strict";
+import test from "node:test";
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

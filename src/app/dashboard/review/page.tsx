import { AppHeader } from "@/components/AppHeader";
import { ReviewRequestList } from "@/components/review/ReviewRequestList";
import { auth } from "@/auth";
import { fetchReviewRequests } from "../review-api";

export const dynamic = "force-dynamic";

export default async function ReviewQueuePage() {
  const session = await auth();
  const roles = session?.user?.roles ?? [];
  const canReview = roles.includes("reviewer") || roles.includes("admin");
  const requests = canReview ? await fetchReviewRequests("?status=pending") : null;
  return <PageShell title="Cola de revision" description="Solicitudes pendientes asignadas al equipo revisor.">{requests ? <ReviewRequestList requests={requests} mode="reviewer" /> : <State message="No tienes permiso para revisar solicitudes." />}</PageShell>;
}
function PageShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) { return <div style={{ minHeight: "100vh", background: "var(--bg)" }}><AppHeader /><main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}><h1 style={headingStyle}>{title}</h1><p style={descriptionStyle}>{description}</p>{children}</main></div>; }
function State({ message }: { message: string }) { return <div style={{ padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--muted)", fontSize: "13px" }}>{message}</div>; }
const headingStyle: React.CSSProperties = { fontFamily: "var(--font-geist), sans-serif", fontSize: "24px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px" };
const descriptionStyle: React.CSSProperties = { fontSize: "13px", color: "var(--muted)", margin: "0 0 24px" };

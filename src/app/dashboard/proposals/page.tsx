import { AppHeader } from "@/components/AppHeader";
import { ReviewRequestList } from "@/components/review/ReviewRequestList";
import { auth } from "@/auth";
import { client } from "@/lib/db";
import { listReviewRequests } from "@/lib/review/service";
import { actorFromSession } from "@/app/api/review-requests/route-utils";

export const dynamic = "force-dynamic";

export default async function ProposalsPage() {
  const session = await auth();
  const actor = session ? actorFromSession(session) : null;
  const requests = actor ? await listReviewRequests({ mine: true }, actor, client) : null;
  return <div style={{ minHeight: "100vh", background: "var(--bg)" }}><AppHeader /><main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}><h1 style={headingStyle}>Mis propuestas</h1><p style={descriptionStyle}>Estado y comentarios de los skills enviados a revision.</p>{requests ? <ReviewRequestList requests={requests} mode="author" /> : <State message="Inicia sesion para ver tus propuestas." />}</main></div>;
}
function State({ message }: { message: string }) { return <div style={{ padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--muted)", fontSize: "13px" }}>{message}</div>; }
const headingStyle: React.CSSProperties = { fontFamily: "var(--font-geist), sans-serif", fontSize: "24px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px" };
const descriptionStyle: React.CSSProperties = { fontSize: "13px", color: "var(--muted)", margin: "0 0 24px" };

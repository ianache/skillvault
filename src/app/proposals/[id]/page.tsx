import { AppHeader } from "@/components/AppHeader";
import { ReviewRequestDetail } from "@/components/review/ReviewRequestDetail";
import { auth } from "@/auth";
import { fetchReviewRequest } from "@/app/review-api";
import type { ReviewRequestDetailDto } from "@/lib/review/types";

export const dynamic = "force-dynamic";

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); const id = Number((await params).id);
  let request: ReviewRequestDetailDto | null = null; let error: string | null = null;
  if (session && Number.isInteger(id) && id > 0) { try { request = await fetchReviewRequest(id); } catch (reason) { error = reason instanceof Error ? reason.message : "No se pudo cargar la propuesta."; } }
  const content = request ? <ReviewRequestDetail request={request} viewerMode="author" /> : <State message={error ?? "Inicia sesion para ver esta propuesta."} />;
  return <div style={{ minHeight: "100vh", background: "var(--bg)" }}><AppHeader /><main style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 24px" }}>{content}</main></div>;
}
function State({ message }: { message: string }) { return <div style={{ padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--muted)", fontSize: "13px" }}>{message}</div>; }

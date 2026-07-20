import { AppHeader } from "@/components/AppHeader";
import { ReviewRequestDetail } from "@/components/review/ReviewRequestDetail";
import { auth } from "@/auth";
import { client } from "@/lib/db";
import { getReviewRequest } from "@/lib/review/service";
import { actorFromSession } from "@/app/api/review-requests/route-utils";
import type { ReviewRequestDetailDto } from "@/lib/review/types";

export const dynamic = "force-dynamic";

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); const actor = session ? actorFromSession(session) : null; const id = Number((await params).id); const canReview = actor?.roles.includes("reviewer") || actor?.roles.includes("admin");
  let request: ReviewRequestDetailDto | null = null; let error: string | null = null;
  if (actor && canReview && Number.isInteger(id) && id > 0) { try { request = await getReviewRequest(id, actor, client); } catch (reason) { error = reason instanceof Error ? reason.message : "No se pudo cargar la solicitud."; } }
  const content = request ? <ReviewRequestDetail request={request} viewerMode="reviewer" /> : <State message={error ?? "No tienes permiso para revisar solicitudes."} />;
  return <div style={{ minHeight: "100vh", background: "var(--bg)" }}><AppHeader /><main style={{ maxWidth: "960px", margin: "0 auto", padding: "32px 24px" }}>{content}</main></div>;
}
function State({ message }: { message: string }) { return <div style={{ padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--muted)", fontSize: "13px" }}>{message}</div>; }

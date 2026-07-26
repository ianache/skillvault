import { PageHeader } from "@/components/PageHeader";
import { ReviewFilterableList } from "@/components/review/ReviewFilterableList";
import { auth } from "@/auth";
import { fetchReviewRequests } from "@/app/review-api";

export const dynamic = "force-dynamic";

export default async function ReviewQueuePage() {
  const session = await auth();
  const roles = session?.user?.roles ?? [];
  const canReview = roles.includes("reviewer") || roles.includes("admin");
  const data = canReview ? await fetchReviewRequests("") : null;
  return (
    <PageShell title="Cola de revision" description="Solicitudes pendientes asignadas al equipo revisor.">
      {data ? (
        <ReviewFilterableList initialRequests={data.requests} counts={data.counts} mode="reviewer" defaultTab="pending" />
      ) : (
        <State message="No tienes permiso para revisar solicitudes." />
      )}
    </PageShell>
  );
}

function PageShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <PageHeader title={title} description={description} />
      <main style={{ padding: "32px 24px" }}>
        {children}
      </main>
    </div>
  );
}

function State({ message }: { message: string }) {
  return (
    <div style={{ padding: "32px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", color: "var(--muted)", fontSize: "13px" }}>
      {message}
    </div>
  );
}

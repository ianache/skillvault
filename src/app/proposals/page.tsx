import { PageHeader } from "@/components/PageHeader";
import { ReviewFilterableList } from "@/components/review/ReviewFilterableList";
import { auth } from "@/auth";
import { fetchReviewRequests } from "@/app/review-api";

export const dynamic = "force-dynamic";

export default async function ProposalsPage() {
  const session = await auth();
  const data = session ? await fetchReviewRequests("?mine=1") : null;
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <PageHeader title="Mis propuestas" description="Estado y comentarios de los skills enviados a revision." />
      <main style={{ padding: "32px 24px" }}>
        {data ? (
          <ReviewFilterableList initialRequests={data.requests} counts={data.counts} mode="author" />
        ) : (
          <State message="Inicia sesion para ver tus propuestas." />
        )}
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

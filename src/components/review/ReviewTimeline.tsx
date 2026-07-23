import type { ReviewRequestDetailDto } from "@/lib/review/types";
import { ReviewStatusBadge } from "./ReviewStatusBadge";

type Props = {
  request: ReviewRequestDetailDto;
};

export function ReviewTimeline({ request }: Props) {
  const events = [
    {
      id: "submission",
      type: "submitted",
      date: request.submittedAt,
      author: request.authorHandle ?? "Autor",
      title: "Solicitud enviada a revisión",
    },
    ...request.comments.map((c) => ({
      id: `comment-${c.id}`,
      type: "comment",
      date: c.createdAt,
      author: c.authorHandle ?? "Usuario",
      title: c.filePath ? `Comentario en ${c.filePath}` : "Comentario general",
      body: c.body,
    })),
    ...(request.reviewedAt
      ? [
          {
            id: "decision",
            type: "decision",
            date: request.reviewedAt,
            author: request.reviewerHandle ?? "Revisor",
            title: `Decisión: ${request.status}`,
            body: request.generalComment,
            status: request.status,
          },
        ]
      : []),
  ].sort((a, b) => a.date - b.date);

  return (
    <div style={{ marginTop: "32px", padding: "20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
          Historial y Línea de Tiempo
        </div>
        <ReviewStatusBadge status={request.status} size="md" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative" }}>
        {events.map((event) => (
          <div key={event.id} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{ minWidth: "10px", height: "10px", borderRadius: "50%", background: "var(--accent)", marginTop: "5px" }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{event.title}</span>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                  {new Date(event.date * 1000).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>Por {event.author}</div>
              {"body" in event && event.body && (
                <div style={{ marginTop: "6px", padding: "8px 12px", background: "var(--raised)", borderRadius: "6px", fontSize: "12.5px", color: "var(--text)" }}>
                  {event.body}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

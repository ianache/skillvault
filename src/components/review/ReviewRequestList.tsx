"use client";

import Link from "next/link";
import type { ReviewRequestSummary } from "@/lib/review/types";
import { ReviewStatusBadge } from "./ReviewStatusBadge";

type Props = { requests: ReviewRequestSummary[]; mode: "author" | "reviewer" };

export function ReviewRequestList({ requests, mode }: Props) {
  const basePath = mode === "author" ? "/dashboard/proposals" : "/dashboard/review";
  if (!requests.length) return <div style={emptyStyle}>{mode === "author" ? "Aun no tienes propuestas para revisar." : "No hay solicitudes pendientes de revision."}</div>;
  return <div style={tableStyle}>
    <div style={headerStyle}>{["Solicitud", "Estado", "Autor", "Revisor", "Actualizada", ""].map((label) => <span key={label} style={labelStyle}>{label}</span>)}</div>
    {requests.map((request, index) => <div key={request.id} style={{ ...rowStyle, borderBottom: index === requests.length - 1 ? "none" : "1px solid var(--border)" }}>
      <div><div style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>{request.slug}</div><div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "3px" }}>v{request.version} · {request.name}</div></div>
      <ReviewStatusBadge status={request.status} />
      <span style={cellStyle}>{request.authorHandle ?? "Sin nombre"}</span><span style={cellStyle}>{request.reviewerHandle ?? "Sin asignar"}</span><span style={cellStyle}>{formatDate(request.updatedAt)}</span>
      <Link href={`${basePath}/${request.id}`} style={linkStyle}>Ver</Link>
    </div>)}
  </div>;
}

function formatDate(value: number) { return new Date(value * 1000).toLocaleDateString("es", { day: "2-digit", month: "short", year: "2-digit" }); }
const tableStyle: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px", overflow: "hidden" };
const headerStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "2fr 140px 120px 120px 110px 48px", gap: "12px", padding: "10px 16px", background: "var(--raised)", borderBottom: "1px solid var(--border)" };
const rowStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "2fr 140px 120px 120px 110px 48px", gap: "12px", padding: "13px 16px", alignItems: "center" };
const labelStyle: React.CSSProperties = { fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted)" };
const cellStyle: React.CSSProperties = { fontSize: "12px", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const linkStyle: React.CSSProperties = { fontSize: "12px", color: "var(--accent)", textDecoration: "none", fontWeight: 600 };
const emptyStyle: React.CSSProperties = { padding: "40px 16px", textAlign: "center", fontSize: "13px", color: "var(--faint)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px" };


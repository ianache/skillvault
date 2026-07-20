"use client";

import { useState } from "react";
import type { ReviewComment } from "@/lib/review/types";

type Props = {
  requestId: number;
  filePath?: string | null;
  placeholder?: string;
  onComment: (comment: ReviewComment) => void;
};

export function ReviewCommentForm({ requestId, filePath = null, placeholder = "Agregar un comentario...", onComment }: Props) {
  const [body, setBody] = useState(""); const [error, setError] = useState<string | null>(null); const [submitting, setSubmitting] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!body.trim()) return; setSubmitting(true); setError(null);
    try { const response = await fetch(`/api/review-requests/${requestId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: body.trim(), filePath }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "No se pudo agregar el comentario"); onComment(data.comment); setBody(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No se pudo agregar el comentario"); } finally { setSubmitting(false); }
  }
  return <form onSubmit={submit} style={{ marginTop: "14px" }}><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder={placeholder} rows={3} style={inputStyle} /><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px", gap: "12px" }}>{error ? <span style={{ fontSize: "12px", color: "var(--red)" }}>{error}</span> : <span />}<button type="submit" disabled={submitting || !body.trim()} style={buttonStyle}>{submitting ? "Enviando..." : "Comentar"}</button></div></form>;
}
const inputStyle: React.CSSProperties = { boxSizing: "border-box", width: "100%", resize: "vertical", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "4px", padding: "9px 10px", fontFamily: "inherit", fontSize: "13px", outline: "none" };
const buttonStyle: React.CSSProperties = { fontSize: "12px", fontWeight: 600, color: "#fff", background: "var(--accent)", border: "none", borderRadius: "4px", padding: "7px 12px", cursor: "pointer" };

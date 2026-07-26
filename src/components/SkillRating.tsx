"use client";

import { useState } from "react";

interface RatingResult {
  avgRating: number;
  ratingCount: number;
  userRating: number;
}

interface Props {
  skillSlug: string;
  avgRating: number;
  ratingCount: number;
  userRating: number | null;
  onRated?: (result: RatingResult) => void;
}

const STAR_PATH =
  "M12 2.5l2.9 6.06 6.6.77-4.86 4.6 1.25 6.57L12 17.4l-5.9 3.1 1.25-6.57-4.86-4.6 6.6-.77z";

export function SkillRating({ skillSlug, avgRating, ratingCount, userRating, onRated }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [localOverride, setLocalOverride] = useState<RatingResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);

  const effectiveAvg = localOverride?.avgRating ?? avgRating;
  const effectiveCount = localOverride?.ratingCount ?? ratingCount;
  const effectiveUserRating = localOverride?.userRating ?? userRating;
  const displayRating = hovered ?? effectiveUserRating ?? effectiveAvg;

  async function handleClick(e: React.MouseEvent, value: number) {
    e.stopPropagation();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/skills/${skillSlug}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: value }),
      });
      if (res.status === 401) {
        setAuthRequired(true);
        return;
      }
      if (!res.ok) return;
      const data: RatingResult = await res.json();
      setLocalOverride(data);
      onRated?.(data);
    } finally {
      setSubmitting(false);
    }
  }

  const label = authRequired
    ? "Inicia sesión para calificar"
    : effectiveUserRating
      ? `Tu calificación: ${effectiveUserRating}/5`
      : effectiveCount > 0
        ? `${effectiveAvg.toFixed(1)} (${effectiveCount})`
        : "Sin calificaciones";

  return (
    <div
      style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}
      onMouseLeave={() => setHovered(null)}
    >
      <div style={{ display: "flex", gap: "4px" }}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= displayRating;
          return (
            <button
              key={star}
              type="button"
              aria-label={`Calificar ${star} de 5`}
              onClick={(e) => handleClick(e, star)}
              onMouseEnter={(e) => {
                e.stopPropagation();
                setHovered(star);
              }}
              disabled={submitting}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: submitting ? "default" : "pointer",
                lineHeight: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  d={STAR_PATH}
                  fill={filled ? "var(--accent)" : "none"}
                  stroke={filled ? "var(--accent)" : "var(--border)"}
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          );
        })}
      </div>
      <span
        style={{
          marginLeft: "6px",
          fontSize: "12.5px",
          fontFamily: "var(--font-jetbrains-mono), monospace",
          color: "var(--muted)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

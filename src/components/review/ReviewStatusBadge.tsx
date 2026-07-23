import type { ReviewStatus } from "@/lib/review/types";

type Props = {
  status: ReviewStatus;
  size?: "sm" | "md";
};

const STATUS_CONFIG: Record<ReviewStatus, { label: string; icon: string; color: string; bg: string }> = {
  pending: { label: "Pendiente", icon: "🕒", color: "#D97706", bg: "rgba(217,119,6,0.12)" },
  changes_requested: { label: "Cambios solicitados", icon: "💬", color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  approved: { label: "Aprobada", icon: "✓", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  rejected: { label: "Rechazada", icon: "✕", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

export function ReviewStatusBadge({ status, size = "sm" }: Props) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const isSm = size === "sm";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontFamily: "var(--font-jetbrains-mono), monospace",
        fontSize: isSm ? "11px" : "12.5px",
        fontWeight: 600,
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.color}40`,
        borderRadius: "20px",
        padding: isSm ? "3px 9px" : "5px 12px",
        letterSpacing: "0.02em",
      }}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

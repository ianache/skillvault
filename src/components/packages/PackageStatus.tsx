import type { CSSProperties } from "react";
import { packageStatusLabel, parsePackageStatus, type PackageStatusValue } from "@/lib/packages/ui";
import { ICON_PATHS, Icon } from "./icons";

/** CMP-ATOM-001. Presentational only: no state, no events, safe as a Server Component. */
export type PackageStatusInput = {
  value: PackageStatusValue;
  version?: string | null;
  /** Retirement warning: rendered as its own amber line, never as a status color. */
  warning?: string | null;
  compact?: boolean;
};

// Text colors are mixed toward --text so the label meets 4.5:1 in both themes
// (pure --sv-teal and --amber fail on their own tint). Status never relies on color alone: icon + label.
const TONES: Record<PackageStatusValue, CSSProperties> = {
  draft: { background: "var(--raised)", color: "var(--muted)", border: "1px dashed var(--border-subtle)" },
  published: {
    background: "color-mix(in srgb, var(--status-published) 12%, var(--surface))",
    color: "color-mix(in srgb, var(--status-published) 70%, var(--text))",
    border: "1px solid color-mix(in srgb, var(--status-published) 40%, transparent)",
  },
  retired: { background: "var(--raised)", color: "var(--muted)", border: "1px solid var(--border-subtle)" },
};

const mono = "var(--sv-font-mono, monospace)";

/**
 * Message line with an icon, announced with role="note". Amber for warnings (retirement, retired skills);
 * neutral with a gavel for administrative notes (disabled actions), as in the approved design.
 */
export function PackageWarningNote({ text, size = 12, tone = "warning" }: { text: string; size?: number; tone?: "warning" | "neutral" }) {
  const neutral = tone === "neutral";
  return (
    <span
      role="note"
      style={{
        display: "inline-flex",
        alignItems: "flex-start",
        gap: 6,
        padding: "4px 8px",
        borderRadius: "var(--sv-radius-sm, 6px)",
        background: neutral ? "var(--raised)" : "color-mix(in srgb, var(--amber) 12%, var(--surface))",
        color: neutral ? "var(--muted)" : "color-mix(in srgb, var(--amber) 50%, var(--text))",
        border: neutral ? "1px solid var(--border)" : "1px solid color-mix(in srgb, var(--amber) 40%, transparent)",
        fontSize: size,
        lineHeight: 1.4,
        overflowWrap: "anywhere",
      }}
    >
      <span style={{ color: neutral ? "var(--muted)" : "var(--amber)", display: "inline-flex", paddingTop: 1 }}>
        <Icon path={neutral ? ICON_PATHS.gavel : ICON_PATHS.warning} size={size + 2} />
      </span>
      <span>{text}</span>
    </span>
  );
}

export function PackageStatus({ value, version, warning, compact = false }: PackageStatusInput) {
  const status = parsePackageStatus(value);
  const size = compact ? 11 : 12;
  const pill: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: compact ? 4 : 6,
    padding: compact ? "2px 8px" : "4px 12px",
    borderRadius: "var(--sv-radius-pill, 20px)",
    fontFamily: mono,
    fontSize: size,
    lineHeight: 1.4,
    whiteSpace: "nowrap",
  };

  // D-14: an unknown status is a visible error. The received value is not rendered (known enum values only).
  if (!status) {
    return (
      <span role="alert" style={{ ...pill, background: "color-mix(in srgb, var(--sv-danger, #b3392f) 10%, var(--surface))", color: "color-mix(in srgb, var(--sv-danger, #b3392f) 70%, var(--text))", border: "1px solid var(--sv-danger, #b3392f)" }}>
        <Icon path={ICON_PATHS.warning} size={size + 2} />
        Estado desconocido
      </span>
    );
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: 6, maxWidth: "100%" }}>
      <span data-status={status} style={{ ...pill, ...TONES[status] }}>
        <Icon path={ICON_PATHS[status]} size={size + 2} />
        {packageStatusLabel(status)}
        {version ? <span style={{ opacity: 0.85 }}>v{version}</span> : null}
      </span>
      {warning ? <PackageWarningNote text={warning} size={size} /> : null}
    </span>
  );
}

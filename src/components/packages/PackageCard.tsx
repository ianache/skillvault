"use client";

import Link from "next/link";
import { useId, type CSSProperties } from "react";
import {
  formatDownloadCount,
  formatPackageVersion,
  formatRating,
  formatSkillCount,
  packageCardHref,
  retiredSkillsNote,
  type PackageCardVariant,
  type PackageStatusValue,
} from "@/lib/packages/ui";
import { ICON_PATHS, Icon } from "./icons";
import { PackageStatus, PackageWarningNote } from "./PackageStatus";

/** CMP-ORG-001. Presentational: receives data and emits events; permissions and mutations stay upstream. */
export type PackageCardPackage = {
  slug: string;
  name: string;
  description: string;
  role: string;
  status: PackageStatusValue;
  version: string | null;
  skillCount?: number;
  /** D-15: drives the retired-skills warning. */
  retiredSkillCount?: number;
  /** Approved design: shown as "14.2k descargas". */
  downloadCount?: number;
  /** Approved design: shown as "★ 4.9" (0 to 5). */
  rating?: number;
};

export type PackageCardActions = {
  edit?: boolean;
  duplicate?: boolean;
  review?: boolean;
  retire?: boolean;
};

export type PackageCardEvent =
  | { type: "open"; slug: string }
  | { type: "edit" | "duplicate" | "review" | "retire"; slug: string };

export type PackageCardProps = {
  package: PackageCardPackage;
  actions: PackageCardActions;
  variant?: PackageCardVariant;
  /** Disables the actions and shows an explanatory note. */
  disabled?: boolean;
  /** Optional note line: a warning (amber), or an administrative note (neutral) when the actions are disabled. */
  warningText?: string | null;
  onEvent?: (event: PackageCardEvent) => void;
};

const MAINTENANCE_ACTIONS = [
  { key: "edit", label: "Editar", icon: ICON_PATHS.edit },
  { key: "duplicate", label: "Duplicar", icon: ICON_PATHS.duplicate },
  { key: "review", label: "Revisar", icon: ICON_PATHS.review },
  { key: "retire", label: "Retirar", icon: ICON_PATHS.retired },
] as const;

const DISABLED_NOTE = "Las acciones no están disponibles en este momento.";

// Inline styles only (D-11). The focus ring comes from the global `:focus-visible` rule (D-12): never set `outline: 0`.
const card: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  minHeight: 354,
  padding: 24,
  minWidth: 0,
  background: "var(--surface)",
  color: "var(--text)",
  border: "1px solid var(--border)",
  borderRadius: "var(--sv-radius-lg, 12px)",
  boxShadow: "var(--sv-shadow-sm)",
  fontFamily: "var(--sv-font-display, sans-serif)",
};
const chip: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 10px",
  background: "var(--raised)",
  color: "var(--muted)",
  border: "1px solid var(--border)",
  borderRadius: "var(--sv-radius-pill, 20px)",
  fontSize: 12,
  lineHeight: 1.4,
};
const mono: CSSProperties = { fontFamily: "var(--sv-font-mono, monospace)" };
const button: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  minHeight: 36,
  padding: "0 12px",
  background: "var(--raised)",
  color: "var(--text)",
  border: "1px solid var(--border)",
  borderRadius: "var(--sv-radius-sm, 6px)",
  fontFamily: "inherit",
  fontSize: 14,
  textDecoration: "none",
  cursor: "pointer",
};
const actionRow: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 16, borderTop: "1px solid var(--border)", marginTop: "auto" };

export function PackageCard({ package: pkg, actions, variant = "maintenance", disabled = false, warningText, onEvent }: PackageCardProps) {
  const titleId = useId();
  const href = packageCardHref(pkg.slug, variant);
  const skills = formatSkillCount(pkg.skillCount);
  const retiredNote = retiredSkillsNote(pkg.retiredSkillCount);
  const extras = [formatDownloadCount(pkg.downloadCount), formatRating(pkg.rating)].filter((value): value is string => value !== null);
  const visibleActions = variant === "maintenance" ? MAINTENANCE_ACTIONS.filter((action) => actions[action.key]) : [];
  const fade: CSSProperties = disabled ? { opacity: 0.5, cursor: "not-allowed" } : {};
  // Administrative notes (disabled actions) are neutral; any other note is a warning (amber).
  const administrative = disabled;
  const note = disabled ? (warningText ?? DISABLED_NOTE) : warningText;

  return (
    <article aria-labelledby={titleId} style={card}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <span
          aria-hidden="true"
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, flexShrink: 0, background: "var(--raised)", color: "var(--accent)", border: "1px solid var(--border)", borderRadius: "var(--sv-radius-md, 8px)" }}
        >
          <Icon path={ICON_PATHS.package} size={22} />
        </span>
        <div style={{ flex: "1 1 160px", minWidth: 0 }}>
          <h3 id={titleId} style={{ margin: 0, fontSize: 17, fontWeight: 600, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {href ? (
              <Link href={href} onClick={() => onEvent?.({ type: "open", slug: pkg.slug })} style={{ color: "inherit", textDecoration: "none" }}>
                {pkg.name}
              </Link>
            ) : (
              pkg.name
            )}
          </h3>
          <div style={{ ...mono, color: "var(--muted)", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pkg.slug}</div>
        </div>
        <PackageStatus value={pkg.status} />
      </div>

      <p style={{ margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", overflowWrap: "anywhere" }}>
        {pkg.description}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <span style={chip}>{pkg.role}</span>
        {skills ? <span style={{ color: "var(--muted)", fontSize: 12 }}>{skills}</span> : null}
        <span style={{ ...mono, marginLeft: "auto", display: "inline-flex", flexWrap: "wrap", gap: 6, fontSize: 12 }}>
          <span style={{ color: pkg.version ? "var(--text)" : "var(--muted)" }}>{formatPackageVersion(pkg.version)}</span>
          {extras.map((extra) => (
            <span key={extra} style={{ color: "var(--muted)" }}>
              <span aria-hidden="true">• </span>
              {extra}
            </span>
          ))}
        </span>
      </div>

      {note ? <PackageWarningNote text={note} tone={administrative ? "neutral" : "warning"} /> : null}
      {retiredNote ? <PackageWarningNote text={retiredNote} /> : null}

      {variant === "public-readonly" ? (
        href ? (
          <div style={actionRow}>
            <Link href={href} onClick={() => onEvent?.({ type: "open", slug: pkg.slug })} aria-label={`Ver Ficha de ${pkg.name}`} style={{ ...button, ...fade, flex: "1 1 100px" }}>
              <Icon path={ICON_PATHS.open} size={16} />
              Ver Ficha
            </Link>
          </div>
        ) : null
      ) : visibleActions.length ? (
        <div role="group" aria-label={`Acciones de ${pkg.name}`} style={actionRow}>
          {visibleActions.map((action) => (
            <button
              key={action.key}
              type="button"
              disabled={disabled}
              aria-label={`${action.label} ${pkg.name}`}
              onClick={() => onEvent?.({ type: action.key, slug: pkg.slug })}
              style={{ ...button, ...fade }}
            >
              <Icon path={action.icon} size={16} />
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

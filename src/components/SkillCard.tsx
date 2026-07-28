"use client";

import { useState } from "react";
import { Category, CATEGORY_META, SkillRow } from "@/lib/types";
import { SkillRating } from "./SkillRating";

interface Props {
  skill: SkillRow;
  selected: boolean;
  onClick: () => void;
  userRoles?: string[];
  categories?: Category[];
  onCategoryUpdate?: (slug: string, newType: string) => void;
}

function fmtCount(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return String(n);
}

export function SkillCard({
  skill,
  selected,
  onClick,
  userRoles = [],
  categories = [],
  onCategoryUpdate,
}: Props) {
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isHoveredCategory, setIsHoveredCategory] = useState(false);

  const meta = categories.find((c) => c.slug === skill.type) ??
    CATEGORY_META[skill.type] ??
    { label: skill.type, color: "#8590A8", icon: "◇" };

  const stripeClass = `stripe-${skill.type}`;

  const canEdit = userRoles.some((r) =>
    ["admin", "reviewer", "editor"].includes(r.toLowerCase())
  );

  console.log(`[SkillCard Debug] Skill: ${skill.slug} | userRoles:`, userRoles, "| canEdit:", canEdit);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-pressed={selected}
      style={{
        background: selected ? "var(--raised)" : "var(--surface)",
        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
        borderRadius: "4px",
        padding: "14px 16px",
        textAlign: "left",
        cursor: "pointer",
        width: "100%",
        transition: "border-color .12s, background .12s",
        display: "block",
        boxSizing: "border-box",
      }}
      className={stripeClass}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
      }}
    >
      {/* Name + version */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--text)",
            wordBreak: "break-word",
          }}
        >
          {skill.name}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "10px",
              color: "var(--muted)",
              whiteSpace: "nowrap",
              marginTop: "2px",
            }}
          >
            v{skill.version}
          </span>
          <a
            href={`/api/skills/${skill.slug}/download`}
            download
            onClick={(e) => {
              e.stopPropagation();
              fetch(`/api/skills/${skill.slug}/install`, { method: "POST" }).catch(() => {});
            }}
            title="Descargar ZIP"
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "10px",
              padding: "2px 6px",
              borderRadius: "3px",
              border: "1px solid var(--border)",
              color: "var(--muted)",
              background: "var(--surface)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              cursor: "pointer",
              transition: "all .12s ease-in-out",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.color = "var(--accent)";
              const arrow = e.currentTarget.querySelector(".arrow");
              if (arrow) (arrow as HTMLElement).style.transform = "translateY(1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--muted)";
              const arrow = e.currentTarget.querySelector(".arrow");
              if (arrow) (arrow as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            <span className="arrow" style={{ transition: "transform .1s", marginRight: "2px", display: "inline-block" }}>⬇</span> ZIP
          </a>
        </div>
      </div>

      {/* Category badge */}
      <div style={{ marginBottom: "8px" }}>
        {(() => {
          if (isEditingCategory) {
            return (
              <select
                value={skill.type}
                onBlur={() => setIsEditingCategory(false)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onChange={async (e) => {
                  e.stopPropagation();
                  const newType = e.target.value;
                  setIsEditingCategory(false);
                  onCategoryUpdate?.(skill.slug, newType);
                  try {
                     await fetch(`/api/skills/${skill.slug}/category`, {
                       method: "PUT",
                       headers: { "Content-Type": "application/json" },
                       body: JSON.stringify({ type: newType }),
                     });
                  } catch (err) {
                     console.error("Error actualizando categoría", err);
                  }
                }}
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "11px",
                  background: "var(--surface)",
                  color: "var(--text)",
                  border: "1px solid var(--accent)",
                  borderRadius: "4px",
                  padding: "2px 6px",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            );
          }

          return (
            <span
              onMouseEnter={() => { if (canEdit) setIsHoveredCategory(true); }}
              onMouseLeave={() => { if (canEdit) setIsHoveredCategory(false); }}
              onClick={(e) => {
                if (canEdit) {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsEditingCategory(true);
                }
              }}
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "9px",
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                padding: "2px 6px",
                borderRadius: "3px",
                border: `1px solid ${meta.color}`,
                color: meta.color,
                background: `${meta.color}18`,
                cursor: canEdit ? "pointer" : "default",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
              title={canEdit ? "Hacer clic para editar categoría" : undefined}
            >
              {meta.icon} {meta.label}
              {canEdit && isHoveredCategory && (
                <span className="pencil-icon" style={{ marginLeft: "4px", fontSize: "10px", opacity: 0.8 }}>✏️</span>
              )}
            </span>
          );
        })()}
      </div>

      {/* Description */}
      <p
        style={{
          fontSize: "12px",
          color: "var(--muted)",
          lineHeight: 1.5,
          marginBottom: "10px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {skill.description}
      </p>

      {/* Primary trigger */}
      {skill.triggers[0] && (
        <div style={{ marginBottom: "10px" }}>
          <code
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "11px",
              background: "var(--accent-muted)",
              color: "var(--accent)",
              padding: "2px 6px",
              borderRadius: "3px",
            }}
          >
            {skill.triggers[0]}
          </code>
        </div>
      )}

      {/* Rating */}
      <SkillRating
        skillSlug={skill.slug}
        avgRating={skill.avgRating}
        ratingCount={skill.ratingCount}
        userRating={skill.userRating}
      />

      {/* Stats */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "var(--faint)" }}>
          ↓ {fmtCount(skill.installCount)}
        </span>
        {skill.compatibility.slice(0, 3).map((h) => (
          <span
            key={h}
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "9px",
              padding: "1px 5px",
              borderRadius: "3px",
              border: "1px solid var(--border)",
              color: "var(--muted)",
            }}
          >
            {h}
          </span>
        ))}
        {skill.compatibility.length > 3 && (
          <span style={{ fontSize: "10px", color: "var(--faint)" }}>
            +{skill.compatibility.length - 3}
          </span>
        )}
      </div>
    </div>
  );
}

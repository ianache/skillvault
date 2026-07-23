"use client";

import { useState } from "react";
import Link from "next/link";

const CATEGORY_COLORS: Record<string, string> = {
  code:  "#3B6EFF",
  docs:  "#2ECC8A",
  data:  "#4AB8E8",
  ui:    "#C45FD4",
  infra: "#E88B3A",
  ai:    "#E8503A",
};

interface Skill {
  id: number;
  slug: string;
  name: string;
  description: string;
  type: string;
  authorHandle: string | null;
  version: string;
  triggers: string[];
  compatibility: string[];
  installCount: number;
  createdAt: number;
  publishedAt: number | null;
  status: string;
}

interface Props {
  initialSkills: Skill[];
}

type SortKey = "installs" | "name" | "date" | "type";

export function DashboardClient({ initialSkills }: Props) {
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("installs");

  const types = [...new Set(initialSkills.map((s) => s.type))].sort();

  const filtered = initialSkills
    .filter((s) => {
      const matchQ = !q || s.name.includes(q) || s.description.toLowerCase().includes(q.toLowerCase());
      const matchType = !typeFilter || s.type === typeFilter;
      return matchQ && matchType;
    })
    .sort((a, b) => {
      if (sort === "installs") return b.installCount - a.installCount;
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "date") return (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt);
      if (sort === "type") return a.type.localeCompare(b.type);
      return 0;
    });

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          marginBottom: "14px",
          flexWrap: "wrap",
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrar skills..."
          style={{
            flex: 1,
            minWidth: "180px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            padding: "7px 12px",
            fontSize: "13px",
            color: "var(--text)",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            padding: "7px 10px",
            fontSize: "12px",
            color: "var(--muted)",
            outline: "none",
            fontFamily: "var(--font-jetbrains-mono), monospace",
            cursor: "pointer",
          }}
        >
          <option value="">Todas las categorías</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div style={{ display: "flex", gap: "4px" }}>
          {(["installs", "name", "date", "type"] as SortKey[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "10px",
                padding: "5px 10px",
                borderRadius: "3px",
                border: "1px solid var(--border)",
                background: sort === s ? "var(--accent)" : "none",
                color: sort === s ? "#fff" : "var(--muted)",
                cursor: "pointer",
                letterSpacing: "0.3px",
              }}
            >
              {s === "installs" ? "↓ Installs" : s === "name" ? "A-Z" : s === "date" ? "Reciente" : "Tipo"}
            </button>
          ))}
        </div>
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "11px",
            color: "var(--faint)",
            marginLeft: "auto",
          }}
        >
          {filtered.length} / {initialSkills.length}
        </span>
      </div>

      {/* Table */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 80px 90px 70px 120px 100px",
            padding: "10px 16px",
            borderBottom: "1px solid var(--border)",
            background: "var(--raised)",
          }}
        >
          {["Skill", "Tipo", "Versión", "Installs", "Publicado", "Acciones"].map((h) => (
            <span
              key={h}
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "9px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "var(--muted)",
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div
            style={{
              padding: "40px 16px",
              textAlign: "center",
              fontSize: "13px",
              color: "var(--faint)",
            }}
          >
            No hay skills que coincidan con el filtro.
          </div>
        ) : (
          filtered.map((skill, i) => (
            <SkillRow
              key={skill.slug}
              skill={skill}
              isLast={i === filtered.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
}

function SkillRow({ skill, isLast }: { skill: Skill; isLast: boolean }) {
  const color = CATEGORY_COLORS[skill.type] ?? "#8590A8";
  const date = skill.publishedAt
    ? new Date(skill.publishedAt * 1000).toLocaleDateString("es", { day: "2-digit", month: "short", year: "2-digit" })
    : "—";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "2fr 80px 90px 70px 120px 100px",
        padding: "12px 16px",
        alignItems: "center",
        borderBottom: isLast ? "none" : "1px solid var(--border)",
        transition: "background .1s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--raised)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
    >
      {/* Name + description */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
          <span
            style={{
              width: "3px",
              height: "14px",
              background: color,
              borderRadius: "2px",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text)",
            }}
          >
            {skill.name}
          </span>
          {skill.authorHandle && (
            <span style={{ fontSize: "11px", color: "var(--faint)" }}>{skill.authorHandle}</span>
          )}
        </div>
        <p
          style={{
            fontSize: "11px",
            color: "var(--muted)",
            margin: 0,
            paddingLeft: "11px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "340px",
          }}
        >
          {skill.description}
        </p>
      </div>

      {/* Type badge */}
      <span
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "9px",
          letterSpacing: "0.6px",
          textTransform: "uppercase",
          padding: "2px 7px",
          borderRadius: "3px",
          border: `1px solid ${color}`,
          color,
          background: `${color}18`,
          justifySelf: "start",
        }}
      >
        {skill.type}
      </span>

      {/* Version */}
      <span
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "12px",
          color: "var(--muted)",
        }}
      >
        v{skill.version}
      </span>

      {/* Install count */}
      <span
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "13px",
          fontWeight: 600,
          color: skill.installCount > 0 ? "var(--text)" : "var(--faint)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {skill.installCount.toLocaleString()}
      </span>

      {/* Date */}
      <span
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "11px",
          color: "var(--faint)",
        }}
      >
        {date}
      </span>

      {/* Actions */}
      <div style={{ display: "flex", gap: "6px" }}>
        <Link
          href={`/skills/${skill.slug}`}
          style={actionBtnStyle}
          title="Ver en catálogo"
        >
          ↗
        </Link>
        <Link
          href={`/dashboard/skills/${skill.slug}/edit`}
          style={{ ...actionBtnStyle, color: "var(--accent)", borderColor: "rgba(59,110,255,0.3)" }}
          title="Editar skill"
        >
          ✎
        </Link>
      </div>
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains-mono), monospace",
  fontSize: "12px",
  padding: "4px 8px",
  borderRadius: "3px",
  border: "1px solid var(--border)",
  color: "var(--muted)",
  textDecoration: "none",
  background: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
};

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { SkillCard } from "./SkillCard";
import { DetailPanel } from "./DetailPanel";
import { Category, SkillRow } from "@/lib/types";

interface Props {
  initialSkills: SkillRow[];
  initialCategories: Category[];
  initialQuery?: string;
  initialType?: string;
}

const SORT_OPTIONS = [
  { value: "popular", label: "Populares" },
  { value: "recent",  label: "Recientes" },
  { value: "az",      label: "A–Z" },
];

export function CatalogClient({ initialSkills, initialCategories, initialQuery = "", initialType = "" }: Props) {
  const searchParams = useSearchParams();
  const [skills, setSkills] = useState<SkillRow[]>(initialSkills);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [query, setQuery] = useState(initialQuery);
  const [activeType, setActiveType] = useState<string>(initialType);

  // Sync query state when URL search params change (e.g. SearchBar navigates to /?q=term)
  useEffect(() => {
    const urlQ = searchParams.get("q") ?? "";
    setQuery(urlQ);
  }, [searchParams]);
  const [sort, setSort] = useState("popular");
  const [selected, setSelected] = useState<SkillRow | null>(null);
  const [loading, setLoading] = useState(false);

  // Refresh categories when they may have changed
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => { if (d.categories) setCategories(d.categories); })
      .catch(() => {});
  }, []);

  const fetchSkills = useCallback(async (q: string, type: string, s: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    params.set("sort", s);
    const res = await fetch(`/api/skills?${params}`);
    const data = await res.json();
    setSkills(data.skills ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchSkills(query, activeType, sort), 220);
    return () => clearTimeout(t);
  }, [query, activeType, sort, fetchSkills]);

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>

      {/* ── Sidebar ── */}
      <aside
        style={{
          width: "220px",
          flexShrink: 0,
          borderRight: "1px solid var(--border)",
          padding: "20px 0",
          position: "sticky",
          top: "56px",
          height: "calc(100vh - 56px)",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "0 16px", marginBottom: "4px" }}>
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "9px",
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: "10px",
            }}
          >
            Categorías
          </div>

          {/* All */}
          <SidebarItem
            active={activeType === ""}
            color="var(--muted)"
            icon="◈"
            label="Todos"
            count={initialSkills.length}
            onClick={() => setActiveType("")}
          />

          {categories.map((cat) => {
            const count = initialSkills.filter((s) => s.type === cat.slug).length;
            return (
              <SidebarItem
                key={cat.slug}
                active={activeType === cat.slug}
                color={cat.color}
                icon={cat.icon}
                label={cat.label}
                count={count}
                onClick={() => setActiveType(activeType === cat.slug ? "" : cat.slug)}
              />
            );
          })}
        </div>

        <div
          style={{
            margin: "20px 16px 0",
            paddingTop: "16px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <a
            href="/publish"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 10px",
              borderRadius: "4px",
              border: "1px solid var(--accent)",
              background: "var(--accent-muted)",
              color: "var(--accent)",
              textDecoration: "none",
              fontSize: "12px",
              fontWeight: 600,
              transition: "background .12s",
            }}
          >
            + Publicar Skill
          </a>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, minWidth: 0, padding: "24px" }}>
        {/* Sort + counter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ fontSize: "13px", color: "var(--muted)" }}>
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontWeight: 700,
                color: "var(--text)",
              }}
            >
              {loading ? "…" : skills.length}
            </span>{" "}
            skills encontrados
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "10px",
                color: "var(--muted)",
                letterSpacing: "0.5px",
              }}
            >
              Ordenar:
            </span>
            {SORT_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setSort(o.value)}
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "11px",
                  padding: "4px 10px",
                  borderRadius: "3px",
                  border: `1px solid ${sort === o.value ? "var(--accent)" : "var(--border)"}`,
                  background: sort === o.value ? "var(--accent-muted)" : "none",
                  color: sort === o.value ? "var(--accent)" : "var(--muted)",
                  cursor: "pointer",
                  transition: "all .1s",
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "10px",
            opacity: loading ? 0.5 : 1,
            transition: "opacity .15s",
          }}
        >
          {skills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              selected={selected?.slug === skill.slug}
              onClick={() =>
                setSelected(selected?.slug === skill.slug ? null : skill)
              }
            />
          ))}
          {!loading && skills.length === 0 && (
            <div
              style={{
                gridColumn: "1 / -1",
                padding: "60px 20px",
                textAlign: "center",
                color: "var(--muted)",
                fontSize: "14px",
              }}
            >
              No se encontraron skills para "{query || activeType}"
            </div>
          )}
        </div>
      </main>

      {/* ── Detail panel overlay ── */}
      {selected && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 49,
            }}
            onClick={() => setSelected(null)}
          />
          <DetailPanel skill={selected} onClose={() => setSelected(null)} />
        </>
      )}
    </div>
  );
}

function SidebarItem({
  active, color, icon, label, count, onClick,
}: {
  active: boolean;
  color: string;
  icon: string;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        width: "100%",
        padding: "7px 8px",
        borderRadius: "4px",
        border: "none",
        background: active ? "var(--raised)" : "none",
        cursor: "pointer",
        marginBottom: "2px",
        transition: "background .1s",
      }}
    >
      <span style={{ fontSize: "13px", width: "16px", textAlign: "center", color }}>{icon}</span>
      <span
        style={{
          flex: 1,
          textAlign: "left",
          fontSize: "12px",
          color: active ? "var(--text)" : "var(--muted)",
          fontWeight: active ? 600 : 400,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--font-jetbrains-mono), monospace",
          fontSize: "10px",
          color: "var(--faint)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {count}
      </span>
    </button>
  );
}

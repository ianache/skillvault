"use client";

import { useState } from "react";

export interface CatalogSkill {
  slug: string;
  name: string;
  type: string;
}

interface SkillAssignerProps {
  availableSkills: CatalogSkill[];
  assignedSlugs: string[];
  onChange: (slugs: string[]) => void;
  loading: boolean;
}

export function SkillAssigner({ availableSkills, assignedSlugs, onChange, loading }: SkillAssignerProps) {
  const [search, setSearch] = useState("");
  const [draggingSlug, setDraggingSlug] = useState<string | null>(null);

  function assign(slug: string) {
    if (assignedSlugs.includes(slug)) return;
    onChange([...assignedSlugs, slug]);
  }

  function unassign(slug: string) {
    onChange(assignedSlugs.filter((s) => s !== slug));
  }

  function handleDragStart(slug: string, e: React.DragEvent) {
    setDraggingSlug(slug);
    e.dataTransfer.setData("text/plain", slug);
  }

  function handleZoneDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleAssignedDrop(e: React.DragEvent) {
    e.preventDefault();
    const slug = e.dataTransfer.getData("text/plain") || draggingSlug;
    if (slug) assign(slug);
  }

  function handleCatalogDrop(e: React.DragEvent) {
    e.preventDefault();
    const slug = e.dataTransfer.getData("text/plain") || draggingSlug;
    if (slug) unassign(slug);
  }

  const term = search.trim().toLowerCase();
  const available = availableSkills
    .filter((sk) => !assignedSlugs.includes(sk.slug))
    .filter((sk) => !term || sk.name.toLowerCase().includes(term) || sk.type.toLowerCase().includes(term));

  const assigned = assignedSlugs
    .map((slug) => availableSkills.find((sk) => sk.slug === slug))
    .filter((sk): sk is CatalogSkill => Boolean(sk));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", position: "sticky", top: "20px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--faint)", fontFamily: "var(--sv-font-mono)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Asignar skills
      </div>
      <p style={{ margin: "-8px 0 4px", fontSize: "12.5px", color: "var(--muted)" }}>
        Arrastra un skill del catálogo hacia la lista de asignados, o usa el botón +.
      </p>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", boxShadow: "var(--sv-shadow-sm)", padding: "16px 18px" }}>
        <input
          type="text"
          placeholder="Buscar en el catálogo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "9px 12px",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontFamily: "var(--sv-font-display)",
            fontSize: "13px",
            background: "var(--surface)",
            color: "var(--text)",
            marginBottom: "12px",
          }}
        />
        <div
          onDragOver={handleZoneDragOver}
          onDrop={handleCatalogDrop}
          style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "220px", overflowY: "auto" }}
        >
          {loading ? (
            <div style={{ padding: "16px", border: "1px dashed var(--border)", borderRadius: "8px", color: "var(--muted)", fontSize: "13px" }}>
              Cargando skills disponibles de la plataforma...
            </div>
          ) : available.length === 0 ? (
            <p style={{ margin: "4px 0", fontSize: "12.5px", color: "var(--faint)", textAlign: "center" }}>
              {search.trim() ? "Sin coincidencias." : "No hay skills publicados en el catálogo."}
            </p>
          ) : (
            available.map((sk) => (
              <div
                key={sk.slug}
                draggable
                onDragStart={(e) => handleDragStart(sk.slug, e)}
                onClick={() => assign(sk.slug)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  padding: "9px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  cursor: "grab",
                  background: "var(--surface)",
                }}
              >
                <div>
                  <div style={{ fontFamily: "var(--sv-font-mono)", fontSize: "12.5px", fontWeight: 600, color: "var(--text)" }}>{sk.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--faint)", marginTop: "2px" }}>{sk.type}</div>
                </div>
                <span style={{ fontSize: "15px", color: "var(--accent)", flexShrink: 0 }}>+</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        onDragOver={handleZoneDragOver}
        onDrop={handleAssignedDrop}
        style={{ background: "var(--surface)", border: "2px dashed var(--border-subtle)", borderRadius: "12px", padding: "16px 18px", minHeight: "160px" }}
      >
        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--faint)", fontFamily: "var(--sv-font-mono)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
          Skills asignados ({assigned.length})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {assigned.length === 0 ? (
            <p style={{ margin: "4px 0", fontSize: "12.5px", color: "var(--faint)", textAlign: "center" }}>
              Suelta aquí los skills que debe usar este agente.
            </p>
          ) : (
            assigned.map((sk) => (
              <div
                key={sk.slug}
                draggable
                onDragStart={(e) => handleDragStart(sk.slug, e)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                  padding: "9px 12px",
                  border: "1px solid rgba(var(--sv-accent-rgb),0.35)",
                  background: "rgba(var(--sv-accent-rgb),0.08)",
                  borderRadius: "8px",
                  cursor: "grab",
                }}
              >
                <div>
                  <div style={{ fontFamily: "var(--sv-font-mono)", fontSize: "12.5px", fontWeight: 600, color: "var(--accent-dim)" }}>{sk.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--faint)", marginTop: "2px" }}>{sk.type}</div>
                </div>
                <button
                  type="button"
                  onClick={() => unassign(sk.slug)}
                  aria-label="Quitar skill"
                  style={{ background: "none", border: "none", padding: "2px", cursor: "pointer", color: "var(--accent-dim)", flexShrink: 0 }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

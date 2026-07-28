"use client";

import { useState } from "react";
import { Category } from "@/lib/types";
import { useRouter } from "next/navigation";
import { CategoriesDrawer } from "./CategoriesDrawer";

interface Props {
  initialCategories: Category[];
  skillCounts: Record<string, number>;
}

export function CategoriesManager({ initialCategories, skillCounts }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const r = await fetch("/api/categories");
    const d = await r.json();
    if (d.categories) setCategories(d.categories);
    router.refresh();
  }

  async function handleAdd(data: {
    slug: string;
    label: string;
    icon: string;
    color: string;
    description: string;
  }) {
    setError("");
    setSaving(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(resData.error ?? "Error al crear");
      return false;
    }
    await refresh();
    return true;
  }

  async function handleEdit(data: {
    slug: string;
    label: string;
    icon: string;
    color: string;
    description: string;
  }) {
    setError("");
    setSaving(true);
    const res = await fetch(`/api/categories/${data.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: data.label,
        icon: data.icon,
        color: data.color,
        description: data.description,
      }),
    });
    const resData = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(resData.error ?? "Error al guardar");
      return false;
    }
    await refresh();
    return true;
  }

  async function handleDelete(slug: string) {
    setError("");
    const res = await fetch(`/api/categories/${slug}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error al eliminar"); return; }
    await refresh();
  }

  return (
    <div>
      {error && (
        <div
          style={{
            padding: "10px 14px",
            background: "#E8503A18",
            border: "1px solid #E8503A55",
            borderRadius: "6px",
            color: "#E8503A",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          overflow: "hidden",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "40px 1fr 180px 80px 80px 120px",
            padding: "10px 16px",
            borderBottom: "1px solid var(--border)",
            fontSize: "11px",
            fontFamily: "var(--font-jetbrains-mono), monospace",
            color: "var(--muted)",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          <span>Icono</span>
          <span>Nombre / Descripción</span>
          <span>Slug</span>
          <span>Color</span>
          <span>Skills</span>
          <span></span>
        </div>

        {categories.map((cat) => (
          <div key={cat.slug}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 180px 80px 80px 120px",
                padding: "12px 16px",
                borderBottom: "1px solid var(--border)",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "18px" }}>{cat.icon}</span>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{cat.label}</div>
                <div style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>{cat.description || "—"}</div>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "12px",
                  color: "var(--muted)",
                }}
              >
                {cat.slug}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    background: cat.color,
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", color: "var(--muted)" }}>
                  {cat.color}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  fontSize: "12px",
                  color: (skillCounts[cat.slug] ?? 0) > 0 ? "var(--text)" : "var(--muted)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {skillCounts[cat.slug] ?? 0}
              </span>
              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => {
                    setSelectedCategory(cat);
                    setDrawerMode("edit");
                    setIsDrawerOpen(true);
                    setError("");
                  }}
                  style={{ padding: "4px 10px", background: "none", border: "1px solid var(--border)", borderRadius: "5px", color: "var(--muted)", cursor: "pointer", fontSize: "12px" }}
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(cat.slug)}
                  disabled={(skillCounts[cat.slug] ?? 0) > 0}
                  title={(skillCounts[cat.slug] ?? 0) > 0 ? "Tiene skills asignados" : "Eliminar"}
                  style={{
                    padding: "4px 10px",
                    background: "none",
                    border: "1px solid var(--border)",
                    borderRadius: "5px",
                    color: (skillCounts[cat.slug] ?? 0) > 0 ? "var(--border)" : "#E8503A",
                    cursor: (skillCounts[cat.slug] ?? 0) > 0 ? "not-allowed" : "pointer",
                    fontSize: "12px",
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          setSelectedCategory(null);
          setDrawerMode("create");
          setIsDrawerOpen(true);
          setError("");
        }}
        style={{
          padding: "9px 18px",
          background: "var(--accent)",
          border: "none",
          borderRadius: "6px",
          color: "#fff",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 600,
        }}
      >
        + Nueva categoría
      </button>

      <CategoriesDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        mode={drawerMode}
        category={selectedCategory}
        onSave={drawerMode === "create" ? handleAdd : handleEdit}
        saving={saving}
        error={error}
        setError={setError}
      />
    </div>
  );
}

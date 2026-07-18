"use client";

import { useState } from "react";
import { Category } from "@/lib/types";
import { useRouter } from "next/navigation";

interface Props {
  initialCategories: Category[];
  skillCounts: Record<string, number>;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: "var(--raised)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  color: "var(--text)",
  fontSize: "13px",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

export function CategoriesManager({ initialCategories, skillCounts }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [adding, setAdding] = useState(false);
  const [editSlug, setEditSlug] = useState<string | null>(null);
  const [form, setForm] = useState({ slug: "", label: "", icon: "📦", color: "#8590A8", description: "" });
  const [editForm, setEditForm] = useState<Partial<Category>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function refresh() {
    const r = await fetch("/api/categories");
    const d = await r.json();
    if (d.categories) setCategories(d.categories);
    router.refresh();
  }

  async function handleAdd() {
    setError("");
    setSaving(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Error al crear"); return; }
    setAdding(false);
    setForm({ slug: "", label: "", icon: "📦", color: "#8590A8", description: "" });
    await refresh();
  }

  async function handleEdit(slug: string) {
    setError("");
    setSaving(true);
    const res = await fetch(`/api/categories/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Error al guardar"); return; }
    setEditSlug(null);
    await refresh();
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
            {editSlug === cat.slug ? (
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border)",
                  background: "var(--raised)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr", gap: "8px" }}>
                  <div>
                    <label style={{ fontSize: "11px", color: "var(--muted)" }}>Icono</label>
                    <input
                      value={editForm.icon ?? cat.icon}
                      onChange={(e) => setEditForm((f) => ({ ...f, icon: e.target.value }))}
                      style={{ ...inputStyle, marginTop: "4px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "var(--muted)" }}>Label</label>
                    <input
                      value={editForm.label ?? cat.label}
                      onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))}
                      style={{ ...inputStyle, marginTop: "4px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "var(--muted)" }}>Color (hex)</label>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "4px" }}>
                      <input
                        type="color"
                        value={editForm.color ?? cat.color}
                        onChange={(e) => setEditForm((f) => ({ ...f, color: e.target.value }))}
                        style={{ width: "36px", height: "34px", borderRadius: "4px", border: "1px solid var(--border)", cursor: "pointer", padding: "2px" }}
                      />
                      <input
                        value={editForm.color ?? cat.color}
                        onChange={(e) => setEditForm((f) => ({ ...f, color: e.target.value }))}
                        style={{ ...inputStyle, flex: 1 }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "var(--muted)" }}>Descripción</label>
                  <input
                    value={editForm.description ?? cat.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    style={{ ...inputStyle, marginTop: "4px" }}
                    placeholder="Describe qué tipo de skills pertenecen aquí..."
                  />
                </div>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => { setEditSlug(null); setEditForm({}); }}
                    style={{ padding: "6px 14px", background: "none", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--muted)", cursor: "pointer", fontSize: "13px" }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleEdit(cat.slug)}
                    disabled={saving}
                    style={{ padding: "6px 14px", background: "var(--accent)", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
                  >
                    {saving ? "Guardando…" : "Guardar"}
                  </button>
                </div>
              </div>
            ) : (
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
                    onClick={() => { setEditSlug(cat.slug); setEditForm({ label: cat.label, icon: cat.icon, color: cat.color, description: cat.description }); setError(""); }}
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
            )}
          </div>
        ))}
      </div>

      {/* Add new */}
      {adding ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Nueva categoría</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>Slug *</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                placeholder="mi-categoria"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>Label *</label>
              <input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="Mi Categoría"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>Icono (emoji)</label>
              <input
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="📦"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>Color</label>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  style={{ width: "36px", height: "34px", borderRadius: "4px", border: "1px solid var(--border)", cursor: "pointer", padding: "2px" }}
                />
                <input
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
            </div>
          </div>
          <div>
            <label style={{ fontSize: "11px", color: "var(--muted)", display: "block", marginBottom: "4px" }}>Descripción</label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Describe qué tipo de skills pertenecen aquí..."
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button
              onClick={() => { setAdding(false); setError(""); }}
              style={{ padding: "7px 16px", background: "none", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--muted)", cursor: "pointer", fontSize: "13px" }}
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || !form.slug || !form.label}
              style={{ padding: "7px 16px", background: "var(--accent)", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 600, opacity: (!form.slug || !form.label) ? 0.5 : 1 }}
            >
              {saving ? "Creando…" : "Crear categoría"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setAdding(true); setError(""); }}
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
      )}
    </div>
  );
}

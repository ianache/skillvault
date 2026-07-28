# Plan de Implementación — Panel Lateral de Categorías (Drawer)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar la creación y edición de categorías convirtiendo el flujo en línea actual en un panel lateral flotante derecho (drawer) interactivo y premium, con selección rápida de iconos/colores y validaciones sólidas.

**Architecture:** Crear un componente modular `src/components/CategoriesDrawer.tsx` que gestione el formulario de forma aislada y se comunique mediante eventos de guardado y cierre con el contenedor principal `src/components/CategoriesManager.tsx`. Las transiciones y suavizado de visualización se controlarán con animaciones CSS globales por hardware acelerado.

**Tech Stack:** React 19, Next.js 16 (App Router), TypeScript, Vanilla CSS variables.

## Global Constraints
- Conservar el formateo, estructura de imports y estilo de consultas SQL existentes.
- No realizar múltiples llamadas paralelas a herramientas sobre el mismo archivo.
- No utilizar placeholders ni comentarios TODO. Todos los códigos deben estar completos y listos para producción.

---

### Task 1: Agregar Estilos y Keyframes Globales

**Files:**
- Modify: `src/app/globals.css`

- [x] **Step 1: Modificar `src/app/globals.css` para añadir las animaciones del Drawer**
  Añadir las animaciones de desvanecimiento (`svFadeIn`) y deslizamiento lateral derecho (`svSlideInRight`) al final del archivo.

  ```css
  /* Drawer Animations & Keyframes */
  @keyframes svFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes svSlideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }

  .sv-drawer-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(11, 13, 16, 0.5);
    z-index: 1000;
    animation: svFadeIn 0.2s ease-out forwards;
  }

  .sv-drawer-content {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 440px;
    background: var(--surface);
    border-left: 1px solid var(--border);
    box-shadow: -8px 0 32px rgba(0, 0, 0, 0.16);
    z-index: 1001;
    display: flex;
    flex-direction: column;
    animation: svSlideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  ```

- [x] **Step 2: Verificar la compilación del CSS y tipos**
  Run: `pnpm tsc --noEmit`
  Expected: Sin errores de compilación de TypeScript.

- [x] **Step 3: Realizar commit de la tarea 1**
  ```bash
  git add src/app/globals.css
  git commit -m "style: add drawer animations and classes to globals.css"
  ```

---

### Task 2: Implementar el Componente `CategoriesDrawer`

**Files:**
- Create: `src/components/CategoriesDrawer.tsx`

- [x] **Step 1: Crear el archivo `src/components/CategoriesDrawer.tsx` con su lógica, campos y diseño premium**
  Escribir el código completo del componente, incluyendo el grid de colores del Design System actual y la fila de selección rápida de iconos recomendados, autofocus inteligente y listener de tecla `Escape`.

  ```typescript
  "use client";

  import { useEffect, useRef, useState } from "react";
  import { Category } from "@/lib/types";

  interface CategoriesDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    mode: "create" | "edit";
    category: Category | null;
    onSave: (data: {
      slug: string;
      label: string;
      icon: string;
      color: string;
      description: string;
    }) => Promise<boolean>;
    saving: boolean;
    error: string;
    setError: (err: string) => void;
  }

  const QUICK_ICONS = ["📦", "💻", "📝", "📊", "🎨", "🤖"];
  const QUICK_COLORS = [
    "#3B6EFF", // Azul Código
    "#2ECC8A", // Verde Documentación
    "#4AB8E8", // Celeste Datos
    "#C45FD4", // Púrpura Interfaz de Usuario
    "#E88B3A", // Naranja Infraestructura
    "#E8503A", // Rojo Inteligencia Artificial
  ];

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: "var(--raised)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--text)",
    fontSize: "13px",
    fontFamily: "inherit",
    boxSizing: "border-box",
    outline: "none",
  };

  export function CategoriesDrawer({
    isOpen,
    onClose,
    mode,
    category,
    onSave,
    saving,
    error,
    setError,
  }: CategoriesDrawerProps) {
    const [slug, setSlug] = useState("");
    const [label, setLabel] = useState("");
    const [icon, setIcon] = useState("📦");
    const [color, setColor] = useState("#3B6EFF");
    const [description, setDescription] = useState("");

    const labelInputRef = useRef<HTMLInputElement>(null);
    const slugInputRef = useRef<HTMLInputElement>(null);

    // Resetear formulario según si abrimos para crear o editar
    useEffect(() => {
      if (isOpen) {
        setError("");
        if (mode === "edit" && category) {
          setSlug(category.slug);
          setLabel(category.label);
          setIcon(category.icon || "📦");
          setColor(category.color || "#3B6EFF");
          setDescription(category.description || "");
          setTimeout(() => labelInputRef.current?.focus(), 100);
        } else {
          setSlug("");
          setLabel("");
          setIcon("📦");
          setColor("#3B6EFF");
          setDescription("");
          setTimeout(() => slugInputRef.current?.focus(), 100);
        }
      }
    }, [isOpen, mode, category, setError]);

    // Listener para cerrar al presionar Escape
    useEffect(() => {
      function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape" && isOpen) {
          onClose();
        }
      }
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Normalizar slug: minúsculas, números y guiones únicamente
    function handleSlugChange(value: string) {
      const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
      setSlug(sanitized);
    }

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      if (!slug || !label) {
        setError("El Slug y la Etiqueta son requeridos.");
        return;
      }
      const success = await onSave({ slug, label, icon, color, description });
      if (success) {
        onClose();
      }
    }

    return (
      <>
        {/* Backdrop oscurecido */}
        <div className="sv-drawer-backdrop" onClick={onClose} />

        {/* Panel lateral */}
        <div className="sv-drawer-content">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", height: "100%", margin: 0 }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: "var(--text)" }}>
                  {mode === "create" ? "Nueva categoría" : "Editar categoría"}
                </h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--muted)" }}>
                  {mode === "create" ? "Agrega una nueva sección al catálogo de habilidades" : "Modifica el diseño y metadatos de la categoría"}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px" }}
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: "24px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "18px" }}>
              {error && (
                <div style={{ padding: "10px 14px", background: "#E8503A12", border: "1px solid #E8503A44", borderRadius: "6px", color: "#E8503A", fontSize: "13px" }}>
                  {error}
                </div>
              )}

              {/* Slug Field */}
              <div>
                <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "6px", fontWeight: 500 }}>Slug (Identificador Único) *</label>
                <input
                  ref={slugInputRef}
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="ej. cloud-architecture"
                  disabled={mode === "edit" || saving}
                  required
                  style={{
                    ...inputStyle,
                    opacity: mode === "edit" ? 0.6 : 1,
                    cursor: mode === "edit" ? "not-allowed" : "text",
                    border: mode === "edit" ? "1px dashed var(--border)" : "1px solid var(--border)"
                  }}
                />
                {mode === "create" && (
                  <span style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px", display: "block" }}>
                    Solo minúsculas, números y guiones. No se puede modificar después.
                  </span>
                )}
              </div>

              {/* Label Field */}
              <div>
                <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "6px", fontWeight: 500 }}>Etiqueta visible *</label>
                <input
                  ref={labelInputRef}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="ej. Arquitectura Cloud"
                  required
                  disabled={saving}
                  style={inputStyle}
                />
              </div>

              {/* Description Field */}
              <div>
                <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "6px", fontWeight: 500 }}>Descripción de la categoría</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe qué tipo de habilidades se agrupan en esta sección..."
                  disabled={saving}
                  rows={3}
                  style={{ ...inputStyle, resize: "none", minHeight: "80px" }}
                />
              </div>

              {/* Icon Selector (Chips + Custom) */}
              <div>
                <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "8px", fontWeight: 500 }}>Icono de la categoría</label>
                <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                  {QUICK_ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIcon(emoji)}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        border: "1px solid var(--border)",
                        background: icon === emoji ? "var(--border)" : "var(--surface)",
                        cursor: "pointer",
                        fontSize: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        outline: icon === emoji ? "2px solid var(--sv-accent)" : "none",
                        outlineOffset: icon === emoji ? "1px" : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <input
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="Ingrese emoji personalizado (ej. 📦)"
                  disabled={saving}
                  style={{ ...inputStyle, maxWidth: "150px" }}
                />
              </div>

              {/* Color Selector (Swatches + Custom Hex) */}
              <div>
                <label style={{ fontSize: "12px", color: "var(--muted)", display: "block", marginBottom: "8px", fontWeight: 500 }}>Color distintivo</label>
                <div style={{ display: "flex", gap: "8px", marginBottom: "10px", alignItems: "center" }}>
                  {QUICK_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setColor(hex)}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        border: "2px solid var(--surface)",
                        background: hex,
                        cursor: "pointer",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                        outline: color === hex ? `2px solid ${hex}` : "none",
                        transform: color === hex ? "scale(1.1)" : "scale(1)",
                        transition: "all 0.15s ease",
                      }}
                      title={hex}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    disabled={saving}
                    style={{ width: "36px", height: "34px", borderRadius: "6px", border: "1px solid var(--border)", cursor: "pointer", padding: "2px", background: "none" }}
                  />
                  <input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#3B6EFF"
                    disabled={saving}
                    style={{ ...inputStyle, maxWidth: "120px" }}
                  />
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: "10px", justifyContent: "flex-end", background: "var(--raised)" }}>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                style={{ padding: "8px 16px", background: "none", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--muted)", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !slug || !label}
                style={{
                  padding: "8px 18px",
                  background: "var(--sv-accent, #a9772e)",
                  border: "none",
                  borderRadius: "6px",
                  color: "#fff",
                  cursor: (saving || !slug || !label) ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  opacity: (saving || !slug || !label) ? 0.6 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                {saving ? "Guardando..." : mode === "create" ? "Crear categoría" : "Guardar cambios"}
              </button>
            </div>
          </form>
        </div>
      </>
    );
  }
  ```

- [x] **Step 2: Comprobar que TypeScript compila el componente perfectamente**
  Run: `pnpm tsc --noEmit`
  Expected: Cero errores de tipos para el componente creado.

- [x] **Step 3: Guardar y hacer commit de la tarea 2**
  ```bash
  git add src/components/CategoriesDrawer.tsx
  git commit -m "feat: implement modular and premium CategoriesDrawer component"
  ```

---

### Task 3: Integrar el Drawer en `CategoriesManager`

**Files:**
- Modify: `src/components/CategoriesManager.tsx`

- [x] **Step 1: Modificar `src/components/CategoriesManager.tsx` para incorporar el nuevo `CategoriesDrawer` y quitar forms inline antiguos**
  Sustituir los antiguos formularios integrados por llamadas de estado hacia `CategoriesDrawer`, modificando los handlers `handleAdd` y `handleEdit` para que retornen un booleano (para saber si cerrar el drawer con éxito).

  ```typescript
  // Reemplazar la sección de importaciones para incorporar el nuevo Drawer
  import { CategoriesDrawer } from "./CategoriesDrawer";
  ```

  Modificar las funciones del componente `CategoriesManager`:
  ```typescript
  // Reemplazar la lógica de handleAdd para soportar el retorno de éxito del drawer
  async function handleAdd(data: { slug: string; label: string; icon: string; color: string; description: string }): Promise<boolean> {
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

  // Reemplazar la lógica de handleEdit para soportar la firma del drawer
  async function handleEdit(data: { slug: string; label: string; icon: string; color: string; description: string }): Promise<boolean> {
    if (!editSlug) return false;
    setError("");
    setSaving(true);
    const res = await fetch(`/api/categories/${editSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const resData = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(resData.error ?? "Error al guardar");
      return false;
    }
    setEditSlug(null);
    await refresh();
    return true;
  }
  ```

- [x] **Step 2: Verificar la limpieza de variables de estado antiguas en `CategoriesManager.tsx`**
  Eliminar `adding`, `form`, `editForm` del estado, dejando el nuevo esquema simplificado de control.

- [x] **Step 3: Comprobar compilación del archivo modificado**
  Run: `pnpm tsc --noEmit`
  Expected: Compilación exitosa, sin lints o tipos rotos.

- [x] **Step 4: Hacer commit de la tarea 3**
  ```bash
  git add src/components/CategoriesManager.tsx
  git commit -m "refactor: integrate CategoriesDrawer into CategoriesManager and clean up inline forms"
  ```

---

### Task 4: Pruebas de Verificación y Compilación Final

**Files:**
- Modify: `docs/superpowers/plans/2026-07-28-categories-drawer-panel.md` (Update state tracker)

- [x] **Step 1: Ejecutar la suite de pruebas del sistema para garantizar que nada se ha roto**
  Run: `pnpm test`
  Expected: Todos los 132 tests pasan satisfactoriamente.

- [x] **Step 2: Ejecutar el build de Next.js para asegurar la renderización SSR/CSR perfecta**
  Run: `pnpm build`
  Expected: Build exitoso con cero errores en páginas estáticas o dinámicas.

- [x] **Step 3: Commit final de verificación de la rama**
  ```bash
  git commit --allow-empty -m "test: verify build and drawer operation"
  ```

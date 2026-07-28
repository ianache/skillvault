# Reconciliación de Estilo de Bordes en UsersManager - Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolver la advertencia de reconciliación de estilos inline en los botones de filtro de estado (Activos/Inactivos) de `UsersManager.tsx`.

**Architecture:** Reemplazar el uso del estilo shorthand `border` por propiedades detalladas (`borderWidth`, `borderStyle`, `borderColor`) y mantener las mismas llaves con `borderColor: "transparent"` en estados inactivos para evitar que React remueva propiedades de estilo en caliente durante los re-renders.

**Tech Stack:** React, TypeScript, Tailwind/CSS Variables.

## Global Constraints

* Conservar el formateo, estructura de imports y estilo de consultas SQL existentes.
* No realizar múltiples llamadas paralelas a herramientas sobre el mismo archivo.
* No utilizar placeholders ni comentarios TODO. Todos los códigos deben estar completos y listos para producción.

---

### Task 1: Reconciliación de Estilo de Bordes en UsersManager

**Files:**
- Modify: `src/components/UsersManager.tsx`

**Interfaces:**
- Consumes: Ninguna.
- Produces: `UsersManager` con estilos inline libres de advertencias de reconciliación en re-render.

- [ ] **Step 1: Modificar estilos base y activos en UsersManager.tsx**

Modificar `pillBase` y `pillActive` para usar propiedades individuales de borde en lugar de shorthand `border`:

```typescript
const pillBase: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: "20px",
  fontFamily: "inherit",
  fontSize: "12.5px",
  fontWeight: 600,
  cursor: "pointer",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "var(--border)",
  background: "var(--surface)",
  color: "var(--muted)",
};

const pillActive: React.CSSProperties = {
  ...pillBase,
  background: "var(--accent)",
  borderColor: "var(--accent)",
  color: "#fff",
};
```

- [ ] **Step 2: Modificar los botones de filtro de estado (Activos/Inactivos)**

En las líneas de renderizado de los botones de filtro de estado (alrededor de las líneas 154-159), cambiar el estilo inactivo para mantener las llaves de borde consistentes en lugar de usar `border: "none"`:

```typescript
        <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "3px" }}>
          <button type="button" onClick={() => setStatusFilter("active")} style={statusFilter === "active" ? pillActive : { ...pillBase, borderWidth: "1px", borderStyle: "solid", borderColor: "transparent", borderRadius: "6px" }}>
            Activos
          </button>
          <button type="button" onClick={() => setStatusFilter("inactive")} style={statusFilter === "inactive" ? pillActive : { ...pillBase, borderWidth: "1px", borderStyle: "solid", borderColor: "transparent", borderRadius: "6px" }}>
            Inactivos
          </button>
        </div>
```

- [ ] **Step 3: Ejecutar compilación TypeScript para verificar tipado de React**

Ejecutar: `pnpm tsc --noEmit`
Expected: Exited with code 0 (compilación correcta, sin errores de tipado en React.CSSProperties).

- [ ] **Step 4: Ejecutar suite de pruebas unitarias para validar que no haya regresiones**

Ejecutar: `pnpm test`
Expected: Exited with code 0 (127/127 pruebas unitarias pasadas con éxito).

- [ ] **Step 5: Confirmar cambios en Git**

Ejecutar:
```bash
git add src/components/UsersManager.tsx
git commit -m "style: fix border style reconciliation warning in UsersManager"
```

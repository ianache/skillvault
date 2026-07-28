# Especificación de Diseño - Reconciliación de Borde de Inline Styles en UsersManager

Este documento describe la especificación técnica para resolver el error de advertencia de consola en el portal SkillVault relacionado con la reconciliación de estilos inline en el componente `UsersManager`.

---

## 1. Contexto y Problema

### El Error de Consola
```
Removing a style property during rerender (borderColor) when a conflicting property is set (border) can lead to styling bugs. To avoid this, don't mix shorthand and non-shorthand properties for the same value; instead, replace the shorthand with separate values.

    at button (<anonymous>:null:null)
    at UsersPage (src\app\users\page.tsx:44:9)
```

### Origen Técnico
En `src/components/UsersManager.tsx`, los botones de filtro de estado (Activos/Inactivos) alternan sus estilos condicionalmente de la siguiente manera:
1. `pillActive` extiende `pillBase` mediante `...pillBase`.
2. `pillBase` declara un borde shorthand: `border: "1px solid var(--border)"`.
3. `pillActive` anula específicamente `borderColor`: `borderColor: "var(--accent)"`.
4. El estado inactivo utiliza un objeto alternativo con `border: "none"`.

Durante el ciclo de renderizado, React detecta que se está eliminando la propiedad detallada `borderColor` mientras se muta la propiedad shorthand `border`, lo cual confunde al algoritmo de diffing del motor de estilos de React e introduce inconsistencias visuales o advertencias en entornos Turbopack.

---

## 2. Solución Propuesta

### Desglose de Propiedades de Borde
Reemplazar todas las declaraciones shorthand de `border` por propiedades explícitas y consistentes de CSS:
* `borderWidth`
* `borderStyle`
* `borderColor`

### Consistencia de Llaves
Asegurar que los objetos de estilo utilizados en un mismo componente para transiciones condicionales compartan las mismas llaves con valores neutros (por ejemplo, `borderColor: "transparent"`) en lugar de omitirlas o removerlas.

---

## 3. Cambios en Código

### src/components/UsersManager.tsx
1. Redefinir `pillBase`:
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
```

2. Redefinir la lógica de estilo inline en los botones de filtro de estado (líneas 154-159):
```typescript
style={statusFilter === "active" ? pillActive : { 
  ...pillBase, 
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "transparent", 
  borderRadius: "6px" 
}}
```

---

## 4. Verificación y Pruebas

* **Compilación:** Ejecutar `pnpm tsc --noEmit` para asegurar que el tipado de React.CSSProperties siga siendo válido.
* **Pruebas de Consola:** Navegar a la página `/users` en el navegador y verificar que el error de consola desaparezca al alternar el filtro de estado entre "Activos" e "Inactivos".

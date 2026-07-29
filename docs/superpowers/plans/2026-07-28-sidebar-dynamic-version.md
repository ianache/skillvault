# Menú Lateral - Versión Dinámica de Aplicativo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que el pie de página del menú lateral principal (`AppSidebar.tsx`) muestre dinámicamente la versión configurada en `package.json` en lugar de una versión hardcodeada.

**Architecture:** El archivo `package.json` será importado y su propiedad `version` expuesta como la variable de entorno pública de Next.js `NEXT_PUBLIC_APP_VERSION` dentro de `next.config.ts`. El componente de cliente `AppSidebar.tsx` consumirá esta variable para pintar la versión actual de manera optimizada y segura.

**Tech Stack:** Next.js 16 (App Router), TypeScript, pnpm.

## Global Constraints
- No exponer metadatos sensibles ni dependencias completas del `package.json` en el bundle del cliente.
- Mantener la compatibilidad con el entorno de pruebas existente (`node:test`).
- El servidor de Next.js debe compilar correctamente usando Turbopack o Webpack.

---

### Task 1: Exponer versión desde la configuración

**Files:**
- Modify: `next.config.ts`

**Interfaces:**
- Consumes: `package.json` (propiedad `version`)
- Produces: Variable de entorno `process.env.NEXT_PUBLIC_APP_VERSION`

- [ ] **Step 1: Modificar `next.config.ts` para importar package.json y definir variable de entorno**

Edita el archivo `next.config.ts` para añadir la importación de `./package.json` y configurar la clave `env`:
```typescript
import type { NextConfig } from "next";
import path from "path";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.resolve(__dirname),
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
};

export default nextConfig;
```

- [ ] **Step 2: Verificar sintaxis y compilación del archivo de configuración**

Ejecuta el linter o build rápido para asegurar que no hay errores de sintaxis en `next.config.ts`:
Run: `pnpm run build` o `npx next info` (para verificar que el archivo es parseado sin problemas)
Expected: El build inicia correctamente sin errores de TypeScript en la configuración.

- [ ] **Step 3: Confirmar cambios locales en git**

Run: `git diff next.config.ts`
Expected: Muestra la adición de la importación y de la propiedad `env`.

- [ ] **Step 4: Realizar commit incremental**

```bash
git add next.config.ts
git commit -m "feat: expose package.json version via NEXT_PUBLIC_APP_VERSION env variable"
```

---

### Task 2: Modificar Sidebar y Actualizar Pruebas

**Files:**
- Modify: `src/components/shell/AppSidebar.tsx`
- Modify: `src/lib/review/ui-smoke.test.ts`

**Interfaces:**
- Consumes: Variable de entorno `process.env.NEXT_PUBLIC_APP_VERSION`
- Produces: Renderizado de la versión en el menú lateral

- [ ] **Step 1: Escribir la prueba que falle**

Añade un nuevo caso de prueba al final de `src/lib/review/ui-smoke.test.ts` para validar que `AppSidebar.tsx` consume la variable de entorno y no tiene el valor hardcodeado:
```typescript
test("AppSidebar renders version from environment variable", async () => {
  const sidebarSource = await source("../../components/shell/AppSidebar.tsx");
  assert.match(sidebarSource, /NEXT_PUBLIC_APP_VERSION/);
  assert.doesNotMatch(sidebarSource, /<span>v0\.3\.0<\/span>/);
});
```

- [ ] **Step 2: Ejecutar pruebas para verificar que falla**

Run: `pnpm run test:review`
Expected: FAIL, debido a que `AppSidebar` aún no tiene la variable de entorno y contiene `v0.3.0`.

- [ ] **Step 3: Implementar cambio en `AppSidebar.tsx`**

Edita el footer en `src/components/shell/AppSidebar.tsx` (cerca de la línea 125) para usar la variable de entorno:
```tsx
{/* Footer Version */}
{!collapsed && (
  <div style={{ padding: "12px 16px", borderTop: "1px solid var(--sv-sidebar-border)", fontSize: "11px", color: "var(--sv-sidebar-text-dim)", fontFamily: "var(--sv-font-mono), monospace", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span>v{process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0"}</span>
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <span>Status</span>
      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--sv-teal)", boxShadow: "0 0 0 3px rgba(15,148,136,0.18)" }} />
    </div>
  </div>
)}
```

- [ ] **Step 4: Ejecutar pruebas para verificar que pasan**

Run: `pnpm run test:review`
Expected: PASS en todas las pruebas, incluyendo la nueva prueba de la versión del sidebar.

- [ ] **Step 5: Confirmar cambios en git y commit**

```bash
git add src/components/shell/AppSidebar.tsx src/lib/review/ui-smoke.test.ts
git commit -m "feat: render dynamic package.json version in AppSidebar and update tests"
```

# Especificación de Diseño: Versión Dinámica en Menú Principal (AppSidebar)

**Fecha:** 2026-07-28  
**Estado:** Aprobado  
**Autor:** Antigravity AI  

---

## 1. Contexto y Objetivos
Actualmente, el menú lateral principal del sistema (`AppSidebar.tsx`) muestra la versión del aplicativo hardcodeada en el componente (`v0.3.0`). Sin embargo, la versión real y actualizada de la aplicación se encuentra en el archivo `package.json` (actualmente `0.6.0`).

El objetivo de este cambio es hacer que el menú lateral lea y muestre de manera dinámica y optimizada la versión configurada en `package.json`.

---

## 2. Enfoque de Solución Seleccionado
Se seleccionó el **Enfoque 2**: Exponer la versión a través de `next.config.ts`.

Este enfoque lee el archivo `package.json` en tiempo de compilación/construcción (lado servidor/Node.js) y expone únicamente el string de la versión como una variable de entorno pública (`NEXT_PUBLIC_APP_VERSION`). Esto evita inyectar metadatos innecesarios del `package.json` (como dependencias, scripts o rutas) en el bundle del cliente, garantizando la máxima seguridad y optimización del rendimiento.

---

## 3. Cambios Propuestos

### 3.1. Configuración de Next.js (`next.config.ts`)
Se importará `package.json` y se añadirá la clave `env` en la configuración de Next.js.

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

### 3.2. Menú Lateral (`src/components/shell/AppSidebar.tsx`)
Se modificará el elemento del footer que despliega la versión para usar la variable de entorno expuesta por Next.js.

```tsx
<span>v{process.env.NEXT_PUBLIC_APP_VERSION || "0.0.0"}</span>
```

---

## 4. Criterios de Verificación y Pruebas
1. **Compilación Correcta:** El servidor de desarrollo de Next.js y el proceso de compilación (`pnpm build`) deben ejecutarse sin errores de TypeScript ni de importación de JSON.
2. **Despliegue de Versión:** Al cargar la aplicación, en el pie del menú lateral colapsable debe leerse claramente `v0.6.0` (o la versión que esté configurada en `package.json`).
3. **Persistencia ante Cambios:** Si se modifica la versión en `package.json` (por ejemplo, a `0.6.1`) y se reinicia el servidor de desarrollo, la versión mostrada en el menú debe actualizarse de forma correspondiente.

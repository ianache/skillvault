# Especificación de Diseño: Rediseño Premium de App Shell y Barra Lateral

**Fecha:** 2026-07-28  
**Estado:** Propuesto  
**Autor:** Antigravity  

---

## 1. Introducción y Contexto

Se propone renovar la interfaz de usuario de **SkillVault** para alinearla al diseño editorial "warm-dark" premium importado de Claude Design. Los cambios se centran en tres áreas críticas:
1. **AppSidebar / Menú Principal Izquierdo**: Reorganización de las opciones en dos bloques principales de navegación, incorporando iconos vectoriales (SVGs), tipografía premium (`Space Grotesk` y `JetBrains Mono`) y divisores estéticos.
2. **UserMenu (Menú de Usuario)**: Integración de un submenú desplegable premium en el avatar de usuario que muestre el nombre, sus roles formateados como Badges de categoría con colores personalizados y un botón estilizado para "Salir".
3. **Catálogo / Descargas de CLI**: Reemplazo de los iconos genéricos por los logotipos vectoriales reales de cada Sistema Operativo (Windows, macOS, Linux).

---

## 2. Detalles de Diseño e Implementación

### 2.1 Reorganización del Panel Lateral (`AppSidebar.tsx` y `navigation.ts`)

La barra lateral actual de near-black (`#1c1a17`) se reorganizará de forma limpia en **dos bloques principales de navegación** separados por un divisor sutil (`1px solid var(--sv-sidebar-border)`):

1. **Bloque 1: Exploración y Contenido Personal**
   * **Sección Exploración**: `Catálogo` e `Publicar skill` (con visibilidad restringida por capacidades).
   * **Sección Mi Contenido**: `Mis Skills` e `Mis propuestas`.
2. **Bloque 2: Gestión y Administración**
   * **Sección Revisión**: `Cola de revisión` e `Categorías`.
   * **Sección Administración**: `Usuarios y roles`.

#### Iconos Vectoriales (SVG Paths)
Se reemplazarán los emojis unicode actuales en `navigation.ts` por las siguientes rutas SVG extraídas de los mockups de Claude Design:
* **Catálogo**: `M4 4h16v4H4zM4 12h16v8H4z` (Vista de catálogo)
* **Publicar skill**: `M12 5v14M5 12h14` (Icono más)
* **Mis Skills**: `M12 2l2.9 6.06 6.6.77-4.86 4.6 1.25 6.57L12 16.9l-5.9 3.1 1.25-6.57-4.86-4.6 6.6-.77z` (Estrella)
* **Mis propuestas**: `M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 15h6M9 11h2` (Propuestas/Documentos)
* **Cola de revisión**: `M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z` (Escudo)
* **Categorías**: `M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z` (Categorías/Grid)
* **Usuarios y roles**: `M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75` (Usuarios)

---

### 2.2 Menú de Usuario Desplegable Premium (`UserMenu.tsx`)

Se convertirá el componente actual a un menú interactivo premium con control de estado de apertura (`isOpen`) en React:

* **Interacción**: Al hacer clic en el avatar, se alternará la visibilidad del menú desplegable. Se implementará un listener de clics fuera de él (`click-outside`) para cerrarlo automáticamente de forma natural.
* **Diseño del Contenedor**: Un panel flotante absoluto con fondo `var(--sv-surface)`, borde `1px solid var(--sv-border)`, y sombra difuminada premium `var(--sv-shadow-md)`.
* **Contenido Interno**:
  1. **Cabecera**: Nombre completo del usuario (`Space Grotesk`, negrita) y su correo electrónico (`JetBrains Mono`, atenuado).
  2. **Roles (Badges)**: Listado de roles mapeados a etiquetas estilizadas y coloridas:
     * `admin` $\rightarrow$ **Administrador** (Fondo color marrón/accent tintado, texto oscuro)
     * `reviewer` $\rightarrow$ **Revisor** (Fondo verde/teal suave, texto teal oscuro)
     * `publisher` $\rightarrow$ **Creador** (Fondo ámbar suave, texto oscuro)
     * Otros $\rightarrow$ **Usuario** (Gris sutil)
  3. **Divisor**: Línea sutil horizontal.
  4. **Acción de Cierre de Sesión**: Botón estilizado con hover premium para "Salir de sesión" dentro del formulario Keycloak.

---

### 2.3 Iconos de Sistemas Operativos en Descargas de CLI (`page.tsx`)

Se actualizará la barra de descarga de CLI en el catálogo principal (`src/app/page.tsx`) reemplazando el carácter `↓` y el texto genérico por botones con iconos vectoriales (SVG) de alta definición:

1. **Windows**: Logo clásico estilizado de 4 cuadrantes.
2. **macOS**: Logotipo de Apple mordido.
3. **Linux**: Silueta de Tux o terminal elegante.

---

## 3. Arquitectura de Datos y Tipado

* **`navigation.ts`**: Se mantendrá el tipado e integridad de la exportación de `getNavigationGroups`, pero internamente se reestructurará el array para que retorne dos grupos principales (Bloque 1 y Bloque 2) con sus respectivos metadatos y rutas SVG.
* **`UserMenu.tsx`**:
  ```typescript
  type Props = {
    user?: {
      name?: string | null;
      email?: string | null;
      roles?: string[];
    } | null;
  };
  ```
  El tipado se expandirá para soportar los roles directamente desde el objeto del usuario o el contexto de la sesión.

---

## 4. Plan de Verificación y Testing

1. **Compilación de TypeScript**: Ejecutar `pnpm tsc --noEmit` para asegurar que no hay errores de tipos en las nuevas propiedades o componentes.
2. **Pruebas de Smoke UI**: Ejecutar e integrar validaciones de renderizado en `src/lib/review/ui-smoke.test.ts`.
3. **Prueba Completa de Regresión**: Ejecutar `pnpm test` para asegurar que las 128 pruebas unitarias continúan pasando exitosamente.
4. **Validación Visual Manual**: Verificación en vivo de las transiciones, dropdowns y comportamiento responsivo móvil.

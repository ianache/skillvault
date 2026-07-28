# Especificación de Diseño: Integración de Design System y Rediseño de Barra de CLI

**Fecha:** 2026-07-27  
**Fase:** DISEÑO / ESPECIFICACIÓN  
**Estado:** APROBADO por el usuario  

---

## 1. Introducción y Contexto

Se ha importado con éxito el Design System de SkillVault desde Claude Design (`_ds/skillvault/styles.css`) y el prototipo HTML (`Catálogo de Skills - Detalle.dc.html`). Esta especificación describe el plan técnico para aplicar estas variables visuales, unificar la tipografía, y rediseñar los componentes críticos del portal.

---

## 2. Objetivos de Diseño

1.  **Tipografía Unificada:** Aplicar la fuente `Space Grotesk` para textos de interfaz general, y `JetBrains Mono` para todo el código, identificadores y comandos de consola.
2.  **Menú Principal Premium (AppSidebar):** Integrar la paleta oscura cálida del Design System en la barra lateral de navegación para lograr un aspecto de "admin tool" sofisticado y editorial.
3.  **Barra de CLI Interactiva (DetailPanel):** Rediseñar el bloque de comandos CLI convirtiéndolo en una terminal oscura interactiva con selectores visuales mediante iconos SVG para **Windows**, **macOS** y **Linux**.

---

## 3. Cambios en Código y Arquitectura

### 3.1. Estilos Globales (`src/app/globals.css`)
*   Importar el archivo `../../_ds/skillvault/styles.css` al inicio para heredar los tokens `--sv-*`.
*   Establecer la fuente del `body` usando `var(--sv-font-display)` (`Space Grotesk`).
*   Configurar variables CSS del sistema local (`--bg`, `--surface`, etc.) para que hereden de forma reactiva de los tokens de `styles.css`.

### 3.2. Menú Principal (`src/components/shell/AppSidebar.tsx`)
*   Reemplazar las propiedades de color de la barra lateral con las variables exclusivas del sidebar:
    *   Fondo: `var(--sv-sidebar-bg)` (`#1c1a17`)
    *   Borde: `var(--sv-sidebar-border)` (`#302c26`)
*   Ajustar los enlaces de navegación (`Link`):
    *   Texto inactivo: `var(--sv-sidebar-text)` (`#c9c5bd`)
    *   Texto activo/hover: `var(--sv-sidebar-active-text)` (`#e8ab6a`)
    *   Fondo activo/hover: `var(--sv-sidebar-active-bg)` (`rgba(169, 119, 46, 0.28)`)
*   Ajustar las fuentes de los encabezados de grupo para que usen `var(--sv-font-mono)`.

### 3.3. Barra de CLI e Iconos de SO (`src/components/DetailPanel.tsx`)
*   **Contenedor de Terminal:** Estilo de consola premium usando `var(--sv-sidebar-bg)` (`#1c1a17`), borde `#302c26`, y letras claras `#f2efe9`.
*   **Selector de Sistemas Operativos:**
    *   Integrar un estado de React (`selectedOS`) que detectará automáticamente el sistema operativo del usuario o permitirá cambiarlo.
    *   Mostrar tres botones elegantes con iconos vectoriales SVG para Windows, macOS y Linux.
    *   El SO seleccionado se resaltará con bordes y tipografías en el color de acento de la marca (`var(--sv-accent)`).

---

## 4. Plan de Verificación y Pruebas

1.  **Compilación TypeScript:** Ejecutar `pnpm tsc --noEmit` para asegurar que no haya errores de tipado.
2.  **Verificación Visual:** Correr la aplicación localmente mediante el servidor de desarrollo y validar el renderizado del sidebar en alto contraste y la barra de CLI interactiva.

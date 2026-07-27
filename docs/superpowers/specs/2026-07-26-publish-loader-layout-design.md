# Diseño: Layout de la pantalla de carga en /publish

## Contexto

La pantalla inicial de `/publish` (step 0, "Cargar skill local") vive en `src/app/publish/page.tsx`. Actualmente muestra:

1. Un breadcrumb de navegación ("Inicio / Publicar skill / Cargar Skill local") debajo del `PageHeader`.
2. Un contenedor de contenido fijo y centrado (`maxWidth: "680px", margin: "40px auto"`) que envuelve el componente `LocalSkillLoader` (título "Cargar skill local", panel "Estructura esperada" y los dos paneles de carga "Seleccionar carpeta" / "Subir archivo .zip").

Este layout se ve como una caja angosta centrada en medio de la pantalla, inconsistente con el resto del wizard (pasos 1-4), que usa `WizardLayout` con un contenedor de `960px`.

## Cambios

### 1. Eliminar el breadcrumb

Quitar por completo el bloque `<header>` de navegación en `src/app/publish/page.tsx` (líneas 93-137), que renderiza el breadcrumb "Inicio / Publicar skill / Cargar Skill local". El `PageHeader` (título "Publicar skill" + descripción) que se renderiza antes se mantiene sin cambios — sigue dando contexto de dónde está el usuario.

### 2. Ancho del contenedor de contenido

El contenedor en `src/app/publish/page.tsx:139` que envuelve `<LocalSkillLoader />`:

- **Antes:** `{ maxWidth: "680px", margin: "40px auto", padding: "0 24px" }`
- **Después:** `{ maxWidth: "960px", margin: "0 auto", padding: "44px 32px 80px" }`

Este es el mismo ancho y padding que usa `WizardLayout` (`src/components/wizard/WizardLayout.tsx:169-175`) para los pasos 1-4, dando continuidad visual a todo el flujo del wizard.

### 3. Sin cambios en `LocalSkillLoader.tsx`

El título "Cargar skill local", el panel "Estructura esperada" y el grid `gridTemplateColumns: "1fr 1fr"` de los dos paneles de carga son elementos fluidos (ocupan el 100% del ancho de su contenedor padre). No requieren ningún cambio — se estirarán automáticamente al nuevo ancho de 960px.

## Fuera de alcance

- No se elimina ni se oculta el título "Cargar skill local" ni el panel "Estructura esperada" — solo cambia el ancho del contenedor que los envuelve.
- No se modifica la lógica de carga de archivos (`processFiles`, `processZip`, drag & drop) ni el resto de los pasos del wizard.

## Testing

Cambio puramente visual/estructural sin lógica nueva; no requiere test automatizado. Verificación visual manual en el dev server (`pnpm dev --port 3010` → `/publish`) es suficiente.

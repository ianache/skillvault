# Diseño: Tokens CSS en el mockup "Publicar Skill" + selector de categoría en Step 2

## Contexto

El proyecto de Claude Design "SkillVault" (`projectId 7fb6161e-1057-4869-b0b0-224b134dfeb3`) contiene el mockup `Publicar Skill.dc.html`, que representa el **Paso 2 — Editor SKILL.md** del wizard de publicación. Este mockup usa valores de color hardcodeados (`#f7f5f0`, `#a9772e`, `#1a1d21`, `#5c6270`, `#e6e1d8`, `#0f9488`, etc.) y tipografía Space Grotesk / JetBrains Mono vía Google Fonts.

Se verificó que estos valores hex coinciden exactamente con los tokens ya definidos para el tema claro en `src/app/globals.css` (`--bg`, `--surface`, `--accent`, `--text`, `--muted`, `--border`, `--green`, etc.), y que las fuentes del mockup corresponden a `--font-geist` (Space Grotesk) y `--font-jetbrains-mono` (JetBrains Mono), definidas en `src/app/layout.tsx`.

También se verificó `src/components/wizard/Step2Editor.tsx`, el componente real del Paso 2 en la app Next.js: ya reproduce fielmente el diseño del mockup (editor CodeMirror, tabs Editor/Preview, panel de validación "Dentro del límite"/"Límite superado", checkbox de aceptación) y ya usa tokens CSS (`var(--bg)`, `var(--accent)`, etc.) en vez de hex fijos. La única pieza del mockup ausente en la implementación real es el selector **"Categoría del skill"**.

Ese selector es necesario porque la categoría (`metadata.type` en el frontmatter) hoy solo se puede fijar en el Paso 1 (`Step1Metadata.tsx`, vía `/api/categories`). Cuando un usuario carga un `SKILL.md` existente con `LocalSkillLoader`, el wizard salta directo al Paso 2 (`src/app/publish/page.tsx:61`, `handleLoaded` → `setStep(2)`), sin pasar por el Paso 1 — no hay forma de fijar o cambiar la categoría en ese flujo.

## Parte A — Tokenizar el mockup de Claude Design

**Archivos:** `Publicar Skill.dc.html` (proyecto remoto `7fb6161e-1057-4869-b0b0-224b134dfeb3`) y su espejo local `.designs/SkillVault Publicar Skill (Light).dc.html`.

1. Agregar en el `<helmet><style>` del mockup un bloque `:root { }` con los mismos tokens y valores que el tema claro de `src/app/globals.css`: `--bg`, `--surface`, `--raised`, `--border`, `--border-subtle`, `--accent`, `--accent-dim`, `--text`, `--muted`, `--faint`, `--green`, `--red`, más `--font-geist` / `--font-jetbrains-mono` referenciando las mismas familias tipográficas ya cargadas por Google Fonts.
2. Reemplazar cada valor hex hardcodeado dentro de los atributos `style="..."` del cuerpo del mockup por el `var(--token)` correspondiente (mapeo 1 a 1, sin cambiar ningún valor visual — es un cambio puramente de referencia, no de diseño).
3. Aplicar el mismo cambio en el archivo espejo local, manteniendo ambos sincronizados.

Fuera de alcance: no se toca la estructura HTML, el layout, el contenido del `<script data-dc-script>`, ni ningún otro mockup del proyecto (`Cargar Skill.dc.html`, `Mis Skills.dc.html`, etc.).

## Parte B — Selector de categoría en `Step2Editor.tsx`

1. Agregar un fetch a `/api/categories` dentro de `Step2Editor.tsx` (mismo patrón que `Step1Metadata.tsx:27-32`), guardando el resultado en estado local.
2. Renderizar el selector como botones-tag (mismo componente visual que ya usa `Step1Metadata.tsx:126-154` — icono + label, coloreado por `cat.color` cuando está activo), **no** como `<select>` plano como en el mockup, para mantener consistencia visual con el resto del wizard.
3. Ubicación: en la columna derecha del grid de Step2Editor, encima del panel "Dentro del límite" (`src/components/wizard/Step2Editor.tsx:273` en adelante).
4. El valor activo se deriva leyendo `metadata.type` del frontmatter ya parseado (`fm.metadata?.type`, usando el mismo parser `gray-matter` que ya usa el componente). Al seleccionar una categoría, se reescribe el contenido vía regex sobre el string `content` (mismo patrón que `buildContent()` en `src/app/publish/page.tsx:37`: `.replace(/  type: .+/m, ...)`) y se llama a `onChange(nextContent)`.
5. Si el frontmatter no tiene el bloque `metadata:`/`type:` (SKILL.md cargado sin ese campo), el regex no encuentra coincidencia y no se inserta nada nuevo — comportamiento igual al de `buildContent()`, que asume que la plantilla base siempre trae esas líneas. Esto es aceptable: el editor ya expone el YAML crudo, así que el usuario puede añadir el campo manualmente si falta.

Fuera de alcance: no se modifica `Step1Metadata.tsx`, ni la lista de categorías (`/api/categories`), ni el flujo de `LocalSkillLoader`.

## Testing

- Parte A es un cambio puramente visual/referencial sin lógica; verificación visual del mockup renderizado es suficiente.
- Parte B: verificación manual en `pnpm dev --port 3010` → cargar un SKILL.md vía `/publish` (o crear uno desde cero) → confirmar que el selector de categoría en el Paso 2 refleja y actualiza correctamente `metadata.type` en el contenido. No se agrega test automatizado nuevo: el único suite de tests del repo (`src/lib/review/*.test.ts`) cubre el flujo de review, no componentes de UI del wizard.

# Plan de Implementación: Integración de Design System y Barra de CLI Interactiva

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar el Design System de SkillVault en el menú lateral principal, la tipografía y los tamaños, y rediseñar la barra de CLI en el panel de detalle integrando iconos interactivos de sistemas operativos (Windows, macOS, Linux).

**Architecture:** Mapeo centralizado de variables CSS nativas a los tokens `--sv-*` en los estilos globales, reestilización del componente `AppSidebar` para contraste oscuro-cálido, e introducción de estado de SO e iconos SVG interactivos en `DetailPanel`.

**Tech Stack:** Next.js (App Router), React, CSS vanilla, SVG.

## Global Constraints

* Conservar el formateo, estructura de imports y estilo de consultas SQL existentes.
* No realizar múltiples llamadas paralelas a herramientas sobre el mismo archivo.
* No utilizar placeholders ni comentarios TODO. Todos los códigos deben estar completos y listos para producción.

---

### Task 1: Estilos Globales, Importar styles.css y Mapear Variables CSS

**Files:**
- Modify: `src/app/globals.css`
- Test: Compilación con `pnpm tsc --noEmit`

**Interfaces:**
- Consumes: `_ds/skillvault/styles.css`
- Produces: Variables CSS mapeadas de forma global para toda la aplicación (`--bg`, `--surface`, `--text`, etc.) y cuerpo unificado con tipografía 'Space Grotesk'.

- [ ] **Step 1: Modificar `src/app/globals.css` para importar `styles.css` y mapear los tokens**

Reemplazar las líneas 1-74 del archivo `src/app/globals.css` para añadir la importación de `../../_ds/skillvault/styles.css` al inicio y mapear las variables en `:root` y en el tema claro `[data-theme="light"]`.

```css
@import "tailwindcss";
@import "../../_ds/skillvault/styles.css";

/* ── SkillVault Design Tokens ── */
:root {
  /* Mapeo de variables nativas a los tokens del Design System en tema oscuro por defecto */
  --bg:            var(--sv-dark-bg);
  --surface:       var(--sv-dark-surface);
  --raised:        #1f1c16;
  --border:        var(--sv-dark-border);
  --border-subtle: #2b2721;

  --accent:        var(--sv-accent);
  --accent-dim:    var(--sv-accent-dark);
  --accent-muted:  rgba(169,119,46,0.14);
  --accent-indigo: #8f94ff;

  --text:          var(--sv-dark-text);
  --muted:         var(--sv-dark-text-muted);
  --faint:         var(--sv-sidebar-text-dim);

  --cat-code:   #3B6EFF;
  --cat-docs:   #2ECC8A;
  --cat-data:   #4AB8E8;
  --cat-ui:     #C45FD4;
  --cat-infra:  #E88B3A;
  --cat-ai:     #E8503A;

  --green:  var(--sv-teal);
  --amber:  #E88B3A;
  --red:    var(--sv-danger);
  --cyan:   #4AB8E8;
  --purple: #C45FD4;

  --status-published: var(--sv-teal);
  --status-review:    #E88B3A;
  --status-draft:     var(--sv-sidebar-text-dim);
  --status-rejected:  var(--sv-danger);
}

[data-theme="light"] {
  --bg:            var(--sv-bg);
  --surface:       var(--sv-surface);
  --raised:        var(--sv-subtle);
  --border:        var(--sv-border);
  --border-subtle: var(--sv-border-strong);
  --text:          var(--sv-text);
  --muted:         var(--sv-text-muted);
  --faint:         var(--sv-text-faint);
  --accent:        var(--sv-accent);
  --accent-dim:    var(--sv-accent-dark);
  --accent-muted:  rgba(169,119,46,0.12);
  --accent-indigo: #5a5fd6;
  --green:         var(--sv-teal);
  --status-published: var(--sv-teal);
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    --bg:            var(--sv-bg);
    --surface:       var(--sv-surface);
    --raised:        var(--sv-subtle);
    --border:        var(--sv-border);
    --border-subtle: var(--sv-border-strong);
    --text:          var(--sv-text);
    --muted:         var(--sv-text-muted);
    --faint:         var(--sv-text-faint);
    --accent:        var(--sv-accent);
    --accent-dim:    var(--sv-accent-dark);
    --accent-muted:  rgba(169,119,46,0.12);
    --accent-indigo: #5a5fd6;
    --green:         var(--sv-teal);
    --status-published: var(--sv-teal);
  }
}
```

- [ ] **Step 2: Verificar la compilación TypeScript de los estilos globales**

Correr el comando:
```powershell
pnpm tsc --noEmit
```
Expected: Éxito sin errores.

- [ ] **Step 3: Comprometer el cambio de estilos**

```powershell
git add src/app/globals.css
git commit -m "feat: import design system CSS and map core tokens globally"
```

---

### Task 2: Menú Principal (AppSidebar.tsx) - Colores del Sidebar y Textos

**Files:**
- Modify: `src/components/shell/AppSidebar.tsx`
- Test: Compilación con `pnpm tsc --noEmit`

**Interfaces:**
- Consumes: Variables CSS de `--sv-sidebar-*` definidas globalmente.
- Produces: Menú lateral reestilizado en un tono oscuro premium consistente con el Design System.

- [ ] **Step 1: Aplicar colores de la paleta oscura cálida en `AppSidebar.tsx`**

Modificar los estilos inline del componente `AppSidebar` en `src/components/shell/AppSidebar.tsx` para aplicar las variables `--sv-sidebar-bg`, `--sv-sidebar-border`, `--sv-sidebar-text` y `--sv-sidebar-active-text` y configurar la fuente del encabezado.

Buscar el bloque de estilos del contenedor `aside` y del `Link` activo/inactivo (aproximadamente líneas 18-32 y líneas 53-88) y modificarlo de la siguiente manera:

```tsx
  return (
    <aside
      style={{
        width: collapsed ? "64px" : "240px",
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "var(--sv-sidebar-bg)",
        borderRight: "1px solid var(--sv-sidebar-border)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        zIndex: 30,
        userSelect: "none",
      }}
    >
      {/* Brand Header */}
      <div style={{ height: "56px", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--sv-sidebar-border)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <span style={{ width: "28px", height: "28px", background: "var(--sv-accent)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "12px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
            SV
          </span>
          {!collapsed && <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--sv-sidebar-text)", letterSpacing: "-0.3px", fontFamily: "var(--sv-font-display), sans-serif" }}>SkillVault</span>}
        </Link>
        <button
          type="button"
          onClick={onToggleCollapse}
          style={{ background: "transparent", border: "none", color: "var(--sv-sidebar-text-dim)", cursor: "pointer", padding: "4px", borderRadius: "4px" }}
          title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {collapsed ? "❯" : "❮"}
        </button>
      </div>

      {/* Navigation Groups */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 8px" }}>
        {navGroups.map((group) => (
          <div key={group.title} style={{ marginBottom: "20px" }}>
            {!collapsed && (
              <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--sv-sidebar-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "0 12px 6px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                {group.title}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: collapsed ? "10px 0" : "8px 12px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "var(--sv-sidebar-active-text)" : "var(--sv-sidebar-text)",
                    background: isActive ? "var(--sv-sidebar-active-bg)" : "transparent",
                    transition: "all 0.15s ease",
                    marginBottom: "2px",
                  }}
                >
                  <span style={{ fontSize: "15px" }}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Version */}
      {!collapsed && (
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--sv-sidebar-border)", fontSize: "11px", color: "var(--sv-sidebar-text-dim)", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
          SkillVault v0.3.0
        </div>
      )}
    </aside>
```

- [ ] **Step 2: Verificar que el Sidebar compile correctamente**

Correr:
```powershell
pnpm tsc --noEmit
```
Expected: Éxito.

- [ ] **Step 3: Comprometer el cambio de Sidebar**

```powershell
git add src/components/shell/AppSidebar.tsx
git commit -m "feat: style AppSidebar using design system warm-dark sidebar tokens"
```

---

### Task 3: Barra de CLI Interactiva en DetailPanel.tsx con Iconos SVG de SO

**Files:**
- Modify: `src/components/DetailPanel.tsx`
- Test: Compilación con `pnpm tsc --noEmit`

**Interfaces:**
- Consumes: `selectedSkill` de las props en `DetailPanel`
- Produces: Caja de comandos de instalación de CLI rediseñada como terminal oscura con botones interactivos y SVG de sistemas operativos de Windows, macOS y Linux.

- [ ] **Step 1: Añadir estado de sistema operativo (`selectedOS`) en `DetailPanel.tsx`**

Importar `useState` y `useEffect` si no están presentes en `src/components/DetailPanel.tsx`. Crear un estado `selectedOS` inicializado detectando el OS del cliente (o por defecto en `'windows'`).

```typescript
  const [selectedOS, setSelectedOS] = useState<"windows" | "macos" | "linux">("windows");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const platform = window.navigator.platform.toLowerCase();
      if (platform.includes("mac")) {
        setSelectedOS("macos");
      } else if (platform.includes("linux")) {
        setSelectedOS("linux");
      } else {
        setSelectedOS("windows");
      }
    }
  }, []);
```

- [ ] **Step 2: Definir los SVG de los sistemas operativos en `DetailPanel.tsx`**

Añadir las siguientes constantes de iconos SVG al final del archivo u antes del componente:

```tsx
const WindowsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.551v-8.1zM10.95 1.937L24 0v11.55H10.95V1.937zM10.95 12.45H24v11.55l-13.05-1.937v-9.613z" />
  </svg>
);

const MacIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.07 2.47.3 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.37-.58.62-1.09 1.76-.95 2.87 1.07.08 2.18-.46 2.78-1.18z" />
  </svg>
);

const LinuxIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a10 10 0 0 0-3.32 19.44c.1-.03.17-.11.17-.22V20c0-.83.6-1.5 1.4-1.5.4 0 .76.16 1.04.42l.06.06c.28.26.64.42 1.04.42.8 0 1.4-.67 1.4-1.5v-1.22c0-.11.07-.19.17-.22A10 10 0 0 0 12 2zm1.45 13.55a1.72 1.72 0 1 1-3.44 0 1.72 1.72 0 0 1 3.44 0z" />
  </svg>
);
```

- [ ] **Step 3: Rediseñar la sección de "Instalar" con los botones de SO interactivos en `DetailPanel.tsx`**

Reemplazar la renderización de la sección del comando (líneas ~351-373) para integrar los botones interactivos de sistemas operativos y cambiar el diseño del bloque del comando a una terminal oscura premium.

```tsx
            {/* Command and OS Selector */}
            <div style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--faint)", fontFamily: "var(--font-jetbrains-mono), monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Comando CLI
                </span>
                {/* OS Selector */}
                <div style={{ display: "flex", gap: "4px" }}>
                  {(["windows", "macos", "linux"] as const).map((os) => (
                    <button
                      key={os}
                      type="button"
                      onClick={() => setSelectedOS(os)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: "5px",
                        border: `1px solid ${selectedOS === os ? "var(--sv-accent)" : "var(--border)"}`,
                        background: selectedOS === os ? "rgba(169, 119, 46, 0.12)" : "none",
                        color: selectedOS === os ? "var(--sv-accent-dark)" : "var(--muted)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      title={`Ver comando para ${os}`}
                    >
                      {os === "windows" && <WindowsIcon />}
                      {os === "macos" && <MacIcon />}
                      {os === "linux" && <LinuxIcon />}
                      <span style={{ textTransform: "capitalize" }}>{os === "macos" ? "macOS" : os}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Terminal Box */}
              <div
                style={{
                  background: "var(--sv-sidebar-bg)",
                  border: "1px solid var(--sv-sidebar-border)",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)",
                }}
              >
                <code
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "12.5px",
                    color: "#f2efe9",
                    flex: 1,
                    wordBreak: "break-all",
                    lineHeight: "1.4",
                  }}
                >
                  {selectedOS === "windows" ? `powershell -Command "${cmd}"` : cmd}
                </code>
                <button
                  type="button"
                  onClick={copyCmd}
                  style={{
                    fontFamily: "var(--font-jetbrains-mono), monospace",
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: `1px solid ${copied ? "var(--sv-teal)" : "var(--sv-sidebar-border)"}`,
                    background: copied ? "rgba(15, 148, 136, 0.15)" : "rgba(255,255,255,0.05)",
                    color: copied ? "var(--sv-teal)" : "#c9c5bd",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "all .12s",
                  }}
                >
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>
```

- [ ] **Step 4: Verificar compilación y no emitir errores**

Correr:
```powershell
pnpm tsc --noEmit
```
Expected: Éxito de compilación.

- [ ] **Step 5: Comprometer los cambios de la consola interactiva CLI**

```powershell
git add src/components/DetailPanel.tsx
git commit -m "feat: implement interactive operating system selector and terminal styling in DetailPanel"
```

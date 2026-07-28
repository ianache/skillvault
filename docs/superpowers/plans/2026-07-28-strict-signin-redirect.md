# Plan de Implementación: Redirección Estricta a /signin y Botón + Nuevo Skill en Catálogo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redirigir de manera estricta y limpia a los usuarios a la página `/signin` al iniciar sesión desde el menú de usuario y al cerrar sesión mediante Keycloak. Además, mover y renombrar el botón de "+ Publicar Skill" al panel del título y descripción en la página de catálogo de la aplicación.

**Architecture:** Modificar el parámetro `post_logout_redirect_uri` y el fallback de NextAuth `signOut` del servidor en `src/app/actions/auth.ts`, simplificar el enlace estático en el componente de cliente `src/components/UserMenu.tsx`, mover el botón "+ Publicar Skill" en `src/components/CatalogClient.tsx` hacia `<PageHeader />` en `src/app/page.tsx`, y actualizar los tests correspondientes.

**Tech Stack:** Next.js (App Router), NextAuth.js v5, TypeScript.

## Global Constraints

- Conservar el formateo, estructura de imports y estilo de consultas SQL existentes.
- No realizar múltiples llamadas paralelas a herramientas sobre el mismo archivo.
- No utilizar placeholders ni comentarios TODO. Todos los códigos deben estar completos y listos para producción.

---

### Task 1: Redirección al Salir de Sesión (Logout Action)

**Files:**
- Modify: `src/app/actions/auth.ts`

**Interfaces:**
- Produces: `logoutAction()` que realiza el cierre de sesión redirigiendo estrictamente a `/signin`.

- [x] **Step 1: Modificar `buildKeycloakLogoutUrl` en `src/app/actions/auth.ts`**
- [x] **Step 2: Modificar `logoutAction` en `src/app/actions/auth.ts`**
- [x] **Step 3: Ejecutar compilador TypeScript para verificar la sintaxis**
- [x] **Step 4: Confirmar los cambios de la Task 1 en Git**

---

### Task 2: Botón de Inicio de Sesión Limpio (UserMenu)

**Files:**
- Modify: `src/components/UserMenu.tsx`

**Interfaces:**
- Produces: Componente de UI `UserMenu` para usuarios no autenticados que enlaza limpiamente a `/signin`.

- [ ] **Step 1: Modificar `src/components/UserMenu.tsx`**
  Quitar los hooks `usePathname` y `useSearchParams` de Next.js, remover los imports no utilizados, y actualizar la ruta del enlace "Iniciar sesión" a puramente `"/signin"`.

  El bloque de renderizado para usuarios no autenticados (líneas ~40 a 63) debe quedar exactamente así:
  ```typescript
    if (!user) {
      return (
        <Link
          href="/signin"
          style={{
            display: "inline-block",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 600,
            color: "#fff",
            background: "var(--accent)",
            border: "none",
            borderRadius: "6px",
            padding: "5px 14px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Iniciar sesión
        </Link>
      );
    }
  ```

- [ ] **Step 2: Ejecutar el compilador TypeScript para verificar tipos**
  Ejecutar: `pnpm tsc --noEmit`
  Esperado: Compilación exitosa sin advertencias.

- [ ] **Step 3: Confirmar los cambios de la Task 2 en Git**
  Ejecutar:
  ```bash
  git add src/components/UserMenu.tsx
  git commit -m "feat: simplify UserMenu login link to point strictly to /signin"
  ```

---

### Task 3: Actualización de la Prueba de Humo de Interfaz de Usuario (ui-smoke.test)

**Files:**
- Modify: `src/lib/review/ui-smoke.test.ts`

**Interfaces:**
- Consumes: `src/components/UserMenu.tsx`
- Produces: Caso de prueba de humo `UserMenu renders a sign-in Link directly pointing to /signin...` que pasa de forma exitosa.

- [ ] **Step 1: Modificar `src/lib/review/ui-smoke.test.ts`**
  Modificar el test correspondiente (líneas 218 a 224) para eliminar las comprobaciones obsoletas de `usePathname` y `useSearchParams` y verificar en su lugar el enlace limpio `/signin`.

  El test debe quedar exactamente así:
  ```typescript
  test("UserMenu renders a sign-in Link directly pointing to /signin when user is not logged in", async () => {
    const menuSource = await source("../../components/UserMenu.tsx");
    assert.match(menuSource, /Link/);
    assert.match(menuSource, /href="\/signin"/);
  });
  ```

- [ ] **Step 2: Ejecutar la suite de pruebas unitarias y de integración**
  Ejecutar: `pnpm test`
  Esperado: 132 de 132 tests pasan de forma impecable y exitosa.

- [ ] **Step 3: Ejecutar compilación de producción para asegurar empaquetado**
  Ejecutar: `pnpm build`
  Esperado: Compilación exitosa en Turbopack sin advertencias de renderizado.

- [ ] **Step 4: Confirmar los cambios de la Task 3 en Git**
  Ejecutar:
  ```bash
  git add src/lib/review/ui-smoke.test.ts
  git commit -m "test: update UserMenu smoke test assertion to match static signin path"
  ```

---

### Task 4: Reposicionar y Renombrar Botón en Catálogo de Skills

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/CatalogClient.tsx`

**Interfaces:**
- Produces: `<PageHeader />` con botón `+ Nuevo Skill` en `src/app/page.tsx`, y remoción del botón duplicado en `src/components/CatalogClient.tsx`.

- [ ] **Step 1: Modificar `src/app/page.tsx`**
  Importar `Link` desde `"next/link"` y pasar el enlace estilizado como la propiedad `actions` de `<PageHeader />`.
  ```typescript
        <PageHeader
          title={q ? `Resultados para "${q}"` : "Catálogo de Skills"}
          description="Skills reutilizables para Claude Code y otros harnesses compatibles con el estándar SKILL.md de Anthropic."
          actions={
            <Link
              href="/publish"
              style={{
                padding: "9px 18px",
                background: "var(--accent)",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "opacity 0.15s ease",
              }}
            >
              + Nuevo Skill
            </Link>
          }
        />
  ```

- [ ] **Step 2: Modificar `src/components/CatalogClient.tsx`**
  Eliminar el bloque `div` que contiene el antiguo enlace `+ Publicar Skill` de la barra lateral izquierda `<aside>` (líneas 125 a 151).

- [ ] **Step 3: Ejecutar compilador TypeScript y suite de pruebas**
  Ejecutar: `pnpm tsc --noEmit` y `pnpm test`
  Esperado: Compilación exitosa y todas las pruebas de humo pasan de forma impecable.

- [ ] **Step 4: Confirmar los cambios de la Task 4 en Git**
  Ejecutar:
  ```bash
  git add src/app/page.tsx src/components/CatalogClient.tsx
  git commit -m "feat: move publish button to PageHeader as + Nuevo Skill"
  ```

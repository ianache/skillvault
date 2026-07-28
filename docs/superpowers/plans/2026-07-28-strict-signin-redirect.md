# Plan de Implementación: Redirección Estricta a /signin en Login y Logout

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redirigir de manera estricta y limpia a los usuarios a la página `/signin` al iniciar sesión desde el menú de usuario y al cerrar sesión mediante Keycloak.

**Architecture:** Modificar el parámetro `post_logout_redirect_uri` y el fallback de NextAuth `signOut` del servidor en `src/app/actions/auth.ts`, simplificar el enlace estático en el componente de cliente `src/components/UserMenu.tsx`, y actualizar los tests correspondientes.

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

- [ ] **Step 1: Modificar `buildKeycloakLogoutUrl` en `src/app/actions/auth.ts`**
  Actualizar `logoutUrl.searchParams.set("post_logout_redirect_uri", baseUrl)` para concatenar `/signin`.
  ```typescript
  logoutUrl.searchParams.set("post_logout_redirect_uri", baseUrl + "/signin");
  ```

- [ ] **Step 2: Modificar `logoutAction` en `src/app/actions/auth.ts`**
  Modificar el callback de `signOut` para redirigir a `/signin` por defecto.
  ```typescript
  await signOut({ redirectTo: keycloakLogoutUrl ?? "/signin" });
  ```

  El archivo `src/app/actions/auth.ts` debe quedar exactamente así:
  ```typescript
  "use server";

  import { auth, signIn, signOut } from "@/auth";

  function buildKeycloakLogoutUrl(idToken?: string): string | null {
    const issuer = process.env.AUTH_KEYCLOAK_ISSUER;
    if (!issuer) return null;

    const logoutUrl = new URL(`${issuer}/protocol/openid-connect/logout`);
    if (idToken) {
      logoutUrl.searchParams.set("id_token_hint", idToken);
    }
    const baseUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    logoutUrl.searchParams.set("post_logout_redirect_uri", baseUrl + "/signin");
    return logoutUrl.toString();
  }

  export async function loginAction() {
    await signIn("keycloak");
  }

  export async function logoutAction() {
    const session = await auth();
    const keycloakLogoutUrl = buildKeycloakLogoutUrl(session?.idToken);
    await signOut({ redirectTo: keycloakLogoutUrl ?? "/signin" });
  }
  ```

- [ ] **Step 3: Ejecutar compilador TypeScript para verificar la sintaxis**
  Ejecutar: `pnpm tsc --noEmit`
  Esperado: Compilación exitosa con salida limpia.

- [ ] **Step 4: Confirmar los cambios de la Task 1 en Git**
  Ejecutar:
  ```bash
  git add src/app/actions/auth.ts
  git commit -m "feat: configure strict /signin redirect on logout action"
  ```

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

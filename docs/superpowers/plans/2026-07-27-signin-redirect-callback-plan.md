# Redirección Inteligente a Signin con Callback URL - Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redirigir el botón "Iniciar sesión" del encabezado (`UserMenu.tsx`) hacia la página de login `/signin` preservando la URL actual del cliente como `callbackUrl` para retornar automáticamente tras autenticarse con Keycloak.

**Architecture:** Modificación del componente cliente `UserMenu.tsx` para usar `usePathname` y `useSearchParams` de Next.js, y sustitución del formulario de envío directo por un componente de enlace nativo `<Link>`.

**Tech Stack:** Next.js 16, React, NextAuth v5.

## Global Constraints

- Preserve all existing file formatting and design patterns verbatim.
- Ensure all style variables are defined and use standard project styles.
- Perform strict TDD cycle with test coverage validation.

---

### Task 1: Pruebas de Humo - Añadir caso de prueba estático para la redirección de UserMenu

**Files:**
- Modify: `src/lib/review/ui-smoke.test.ts`

**Interfaces:**
- Consumes: `src/components/UserMenu.tsx`

- [ ] **Step 1: Escribir la prueba estática fallida**
  Añadir un test al final del archivo `src/lib/review/ui-smoke.test.ts` para verificar que `UserMenu.tsx` utiliza la redirección inteligente.

  ```typescript
  test("UserMenu renders a sign-in Link with callbackUrl support when user is not logged in", async () => {
    const menuSource = await source("../../components/UserMenu.tsx");
    assert.match(menuSource, /usePathname\(\)/);
    assert.match(menuSource, /useSearchParams\(\)/);
    assert.match(menuSource, /Link/);
    assert.match(menuSource, /href=\{\`\/signin\?callbackUrl=\$\{encodeURIComponent\(currentUrl\)\}\`\}/);
  });
  ```

- [ ] **Step 2: Ejecutar la prueba para comprobar que falla**
  Ejecutar: `pnpm test`
  Resultado esperado: FAIL (el test falla porque aún no se importan ni se usan esos hooks o el componente Link en `UserMenu.tsx`).

- [ ] **Step 3: Comprometer la prueba en git**
  ```bash
  git add src/lib/review/ui-smoke.test.ts
  git commit -m "test: add failing smoke test for UserMenu signin redirect"
  ```

---

### Task 2: Implementación - Refactorizar UserMenu para navegación inteligente con Link

**Files:**
- Modify: `src/components/UserMenu.tsx`

**Interfaces:**
- Produces: Redirección nativa cliente-servidor con callbackUrl preservada.

- [ ] **Step 1: Reemplazar el formulario por Link y agregar hooks de Next.js**
  Modificar `src/components/UserMenu.tsx` para usar `usePathname`, `useSearchParams` y `<Link>`.

  ```typescript
  "use client";

  import Link from "next/link";
  import { usePathname, useSearchParams } from "next/navigation";
  import { logoutAction } from "@/app/actions/auth";

  type Props = {
    user?: {
      name?: string | null;
      email?: string | null;
    } | null;
  };

  export function UserMenu({ user }: Props) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    if (!user) {
      const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

      return (
        <Link
          href={`/signin?callbackUrl=${encodeURIComponent(currentUrl)}`}
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

    const name = user.name ?? user.email ?? "Usuario";
    const initials = name
      .split(" ")
      .slice(0, 2)
      .map((w: string) => w[0])
      .join("")
      .toUpperCase();

    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "var(--accent)",
            color: "#fff",
            fontSize: "11px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          title={name}
        >
          {initials}
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            style={{
              fontSize: "12px",
              color: "var(--muted)",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "4px 10px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Salir
          </button>
        </form>
      </div>
    );
  }
  ```

- [ ] **Step 2: Compilar TypeScript**
  Ejecutar: `pnpm tsc --noEmit`
  Resultado esperado: EXIT CODE 0 (sin errores de compilación).

- [ ] **Step 3: Ejecutar pruebas unitarias**
  Ejecutar: `pnpm test`
  Resultado esperado: PASS (todas las pruebas pasan con éxito, incluyendo la nueva aserción).

- [ ] **Step 4: Confirmar los cambios en git**
  ```bash
  git add src/components/UserMenu.tsx
  git commit -m "feat: implement smart sign-in redirection with callback URL preservation"
  ```

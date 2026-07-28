# Especificación de Diseño: Redirección Inteligente al Inicio de Sesión con Preservación de Callback URL

Este documento detalla la especificación de diseño para redirigir a los usuarios no autenticados a la pantalla personalizada `/signin`, preservando dinámicamente la página de origen activa como `callbackUrl` de retorno para NextAuth y Keycloak.

---

## 1. Contexto y Objetivos

Actualmente, el botón **"Iniciar sesión"** en el encabezado (`UserMenu.tsx`) inicia el flujo de inicio de sesión de Keycloak de forma inmediata mediante un Server Action (`loginAction`), saltándose la página personalizada de `/signin` que presenta los KPIs, estadísticas del catálogo e información general de SkillVault.

El objetivo es:
1. Redirigir a los usuarios no autenticados que hacen clic en "Iniciar sesión" a la ruta de landing personalizada `/signin`.
2. Preservar de forma segura la URL actual del cliente (ruta de origen y parámetros de consulta de filtros) mediante un parámetro de consulta `callbackUrl` para que, una vez que el inicio de sesión con Keycloak se concrete, el usuario vuelva exactamente al mismo punto donde se encontraba antes.

---

## 2. Detalles Técnicos de la Solución

Se utilizará el **Enfoque A**: navegación del lado del cliente nativa de Next.js mediante el componente `<Link>`.

### 2.1 Hooks de Navegación de Cliente
En `UserMenu.tsx` (que ya está marcado como `"use client"`), importaremos los siguientes hooks:
*   `usePathname`: Recupera la ruta activa (por ejemplo, `/publish`).
*   `useSearchParams`: Recupera los parámetros de búsqueda activos (por ejemplo, `?q=postgres`).

La URL de origen (`currentUrl`) se resolverá concatenando ambos elementos condicionalmente para evitar URLs mal formadas:
```typescript
const pathname = usePathname();
const searchParams = useSearchParams();
const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
```

### 2.2 Reemplazo de Elemento de UI
Se eliminará el formulario del lado del servidor que invoca a `loginAction` y se reemplazará con un enlace `<Link>` de Next.js.

*   **Ruta Destino:** `/signin?callbackUrl=${encodeURIComponent(currentUrl)}`
*   **Estilo Visual:** Se mantiene exactamente el mismo estilo de botón premium y se añade `textDecoration: "none"` para evitar el estilo de supresión clásico de subrayado del tag `<a>`.

```typescript
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
```

---

## 3. Pruebas y Validación

1.  **TypeScript:** Comprobar que no haya errores de importación o firma de tipos (`pnpm tsc --noEmit`).
2.  **Pruebas Unitarias y Humo:**
    *   Comprobar que el componente `UserMenu` compila y se renderiza correctamente con el nuevo tag de enlace.
    *   Comprobar que todas las pruebas unitarias existentes del flujo de inicio de sesión y sincronización de roles continúan pasando limpiamente sin regresiones.
3.  **Verificación Conversacional (UAT):**
    *   Verificar que en la página de inicio principal, el botón redirige a `/signin?callbackUrl=%2F`.
    *   Verificar que en la página `/publish`, el botón redirige a `/signin?callbackUrl=%2Fpublish`.

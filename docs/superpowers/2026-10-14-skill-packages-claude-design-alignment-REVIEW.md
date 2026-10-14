---
phase: 2026-10-14-skill-packages-claude-design-alignment
reviewed: 2026-10-14T06:55:00-05:00
depth: deep
files_reviewed: 14
files_reviewed_list:
  - src/components/shell/navigation.ts
  - src/lib/auth/access-policy.ts
  - src/app/packages/page.tsx
  - src/app/packages/[slug]/page.tsx
  - src/app/packages/new/page.tsx
  - src/app/packages/[slug]/edit/page.tsx
  - src/app/packages/[slug]/review/page.tsx
  - src/app/packages/public/page.tsx
  - src/app/packages/public/[slug]/page.tsx
  - src/components/packages/PackageCatalogClient.tsx
  - src/components/packages/PublicPackageCatalogClient.tsx
  - src/components/packages/PackageEditorClient.tsx
  - src/components/packages/PackageReviewClient.tsx
  - src/lib/packages/service.ts
findings:
  critical: 2
  warning: 3
  info: 0
  total: 5
status: issues_found
---

# Phase 2026-10-14: Code Review Report

**Reviewed:** 2026-10-14
**Depth:** deep
**Status:** issues_found

## Summary

La separación visual de `Paquetes` y `Gestionar paquetes`, los enlaces públicos sin `/edit` y el filtrado de la lista pública están presentes. Sin embargo, la frontera de autorización y la garantía de published-only no están cerradas, y el nuevo estado de validación del editor tiene una condición obsoleta.

## Critical

### CR-01: La ruta pública permite resolver paquetes retirados o no publicados

**File:** `src/lib/packages/service.ts:198-210`; `src/app/packages/public/[slug]/page.tsx:12`

**Issue:** `getPublishedManifest()` filtra `pv.release_status = 'published'`, pero no `p.status = 'published'`. La página pública obtiene además `getPackage()` sin comprobar el estado. Por tanto, una URL directa y los endpoints de manifest/download pueden seguir exponiendo un paquete retirado (o un paquete cuyo registro no sea público) mientras conserve una versión publicada. Esto contradice published-only y hace ineficaz retirar el paquete del catálogo.

**Fix:** Añadir `AND p.status = 'published'` en la consulta de `getPublishedManifest` y comprobar el estado del paquete antes de renderizar/descargar; cubrir también las rutas `/api/packages/[slug]/public` y `/download` con una prueba de retired/draft.

### CR-02: El detalle administrativo solo exige autenticación, no `content:manage`

**File:** `src/app/packages/[slug]/page.tsx:6-9`

**Issue:** Cualquier sesión autenticada puede abrir `/packages/{slug}`. La página está dentro de la superficie administrativa y la especificación exige que `Gestionar paquetes` permanezca protegida por `content:manage`; roles autenticados sin esa capacidad pueden consultar información de mantenimiento.

**Fix:** Reutilizar `actorFromSession` + `capabilityError(actor, "content:manage")` como en `/packages`, `/new` y `/edit`, o proteger `/packages/:path*` en la regla de rutas/middleware.

## Important

### IM-01: La validación del editor usa el estado anterior al clic

**File:** `src/components/packages/PackageEditorClient.tsx:56-63`

**Issue:** `setValidated(true)` es asíncrono, pero `hasValidationErrors` se calcula con `validated` de la renderización anterior. En el primer clic con campos vacíos, la condición suele ser falsa y se envía la petición; el mensaje de validación se muestra solo después. Esto rompe el estado `Validación` y permite requests que la UI debía bloquear.

**Fix:** Calcular los errores desde los valores actuales dentro de `saveDraft` (o usar `const errors = validateMetadata({ name, description, role })` y comprobar `Object.values(errors)`), y luego actualizar el estado para pintar el resumen.

### IM-02: El catálogo administrativo no tiene estado de error de carga

**File:** `src/app/packages/page.tsx:15`

**Issue:** `await listPackages(client)` se ejecuta directamente en el render del servidor y no está protegido. Un fallo de base de datos produce el error genérico de Next en vez del estado explícito de error/reintento requerido para `SCR-001`; el `error` de `PackageCatalogClient` solo cubre mutaciones posteriores.

**Fix:** Capturar el fallo de carga y renderizar un estado de error accesible con retry, o mover la carga a un boundary/cliente que conserve filtros y muestre `role="alert"`.

### IM-03: El envío a revisión puede quedar bloqueado tras un fallo de red

**File:** `src/components/packages/PackageReviewClient.tsx:11-16`

**Issue:** `fetch()` y `response.json()` no están dentro de `try/catch`. Si hay desconexión, respuesta no JSON o un error de red, la promesa rechaza y `sending` permanece `true`; el botón queda deshabilitado sin feedback ni recuperación.

**Fix:** Usar `try/catch/finally`, mostrar un error accesible y restablecer `sending` en toda salida no exitosa.

---

_Reviewer: gsd-code-reviewer_

# Diseño: Texto del botón de login en /signin

## Contexto

El botón de autenticación en la página `/signin` (`src/app/signin/page.tsx`) actualmente muestra el texto "Login con Keycloak". Se solicita cambiarlo a "Signin con Keycloak".

## Cambio

- **Archivo:** `src/app/signin/page.tsx`, línea 192.
- **Antes:** `Login con Keycloak`
- **Después:** `Signin con Keycloak`

No se modifica ningún otro elemento de la página: ícono, estilos, el `<form action>` que invoca `signIn("keycloak", { redirectTo: callbackUrl })`, ni ningún otro texto (KPIs, listas top, sidebar).

## Testing

Cambio de texto estático sin lógica involucrada; no requiere test automatizado. Verificación visual manual en el dev server es suficiente.

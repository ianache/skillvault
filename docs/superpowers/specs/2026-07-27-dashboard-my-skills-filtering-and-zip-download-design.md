# Especificación de Diseño: Filtrado de "Mis Skills" y Descarga ZIP en Dashboard

Este documento detalla el diseño de ingeniería para aislar los datos de la sección "Mis Skills" (`/dashboard`) al usuario autenticado actual y para agregar una nueva opción de descarga de ZIP en la grilla de acciones.

---

## 1. Objetivos y Alcance
* **Aislamiento de Datos por Creador:** Modificar la vista de "Mis Skills" en `/dashboard` para que únicamente muestre los skills creados y las estadísticas acumuladas correspondientes al usuario logueado en la sesión de NextAuth.
* **Descarga de ZIP Directa:** Añadir un botón de acción en cada fila de la grilla de skills que permita descargar el archivo ZIP del skill de manera inmediata y asíncrona, incrementando su contador de instalaciones, replicando exactamente la lógica presente en el catálogo principal.
* **Seguridad Robusta:** Evitar fugas de datos de otros desarrolladores a nivel de base de datos (Opción A).

---

## 2. Detalles de Implementación

### Capa del Servidor: `src/app/dashboard/page.tsx`
* **Autenticación Obligatoria:** El componente obtendrá la sesión activa mediante `auth()`. Si no existe sesión, redirigirá al usuario a la página de login (`/signin`).
* **Estadísticas por Usuario:** Modificar `getStats()` para aceptar el ID de usuario (`userId`) y realizar la consulta de recuento, suma de instalaciones y categorías agregando la condición `WHERE author_id = ?`.
* **Carga de Habilidades por Usuario:** Modificar `getSkills()` para aceptar el ID de usuario (`userId`) y filtrar la consulta agregando `WHERE author_id = ?`.

### Capa de Interfaz de Usuario: `src/components/dashboard/DashboardClient.tsx`
* **Botón en Fila de Habilidades (`SkillRow`):** 
  Se agregará un nuevo botón en el contenedor de acciones (`{/* Actions */}`) de cada fila utilizando una etiqueta `<a>` HTML estándar.
* **Enlace de Descarga:**
  * Atributo `href`: `/api/skills/${skill.slug}/download`
  * Atributo `download`: Habilitado
  * Icono: Símbolo de descarga (`↓`) estilizado conforme al sistema de diseño.
  * Título: `"Descargar ZIP"`
* **Sincronización en Segundo Plano:** El controlador `onClick` prevendrá la propagación del evento (`e.stopPropagation()`) para evitar que el clic seleccione o altere la fila, y ejecutará de forma asíncrona:
  ```typescript
  fetch(`/api/skills/${skill.slug}/install`, { method: "POST" }).catch(() => {});
  ```

---

## 3. Matriz de Pruebas y Aseguramiento de Calidad
* **Verificación de Seguridad:** Validar que al intentar ingresar a `/dashboard` sin sesión activa, se redirija a la autenticación.
* **Prueba de Smoke de UI (`src/lib/review/ui-smoke.test.ts`):** 
  Añadir una aserción estática para garantizar que el archivo `DashboardClient.tsx` contiene:
  1. El endpoint de descarga `/api/skills/\${skill.slug}/download` o similar.
  2. El manejador `onClick` que realiza el POST al endpoint `/install` deteniendo la propagación del evento.

---

## 4. Revisión Interna de Consistencia
* **¿Contiene placeholders?** No.
* **¿Es consistente?** Sí, alinea perfectamente el endpoint del backend con las acciones del frontend.
* **¿Respeta los roles y control de accesos?** Sí, filtra de manera segura mediante el `id` del usuario autenticado actual obtenido desde el servidor.

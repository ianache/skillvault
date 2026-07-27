# Especificación de Diseño: Descarga de Skills como ZIP desde el Catálogo

Este documento describe la especificación técnica y de diseño de interfaz para permitir la descarga directa de habilidades en formato ZIP desde el catálogo principal (`/`) de SkillVault, incorporando incrementos automáticos y visuales en el contador de instalaciones en tiempo real.

## 1. Introducción y Contexto

Actualmente, el portal de SkillVault cuenta con una API de backend en `src/app/api/skills/[slug]/download/route.ts` que empaqueta una habilidad (el archivo `SKILL.md` y todos sus archivos asociados de la tabla `skill_files`) en un archivo ZIP listo para descargar, utilizando la biblioteca `JSZip`.

El objetivo de esta tarea es exponer esta funcionalidad en el catálogo de cara al usuario, ofreciendo dos puntos de entrada de descarga:
1. Un acceso directo en las tarjetas de habilidades (`SkillCard.tsx`) de la cuadrícula del catálogo.
2. Un botón alternativo de instalación manual dentro del panel de detalles lateral (`DetailPanel.tsx`).

Ambos puntos de descarga registrarán la acción como una instalación mediante el incremento del contador `install_count` de la base de datos a través del endpoint existente `POST /api/skills/[slug]/install`.

---

## 2. Experiencia de Usuario y Diseño de Interfaz

### 2.1. Botón de Descarga Directa en `SkillCard.tsx`

* **Ubicación**: En la esquina superior derecha de la tarjeta, alineado con la etiqueta de la versión (`vX.Y.Z`).
* **Aspecto Visual**:
  * Un enlace discreto pero claramente accionable estructurado como un botón sutil.
  * Contenido de texto: `⬇ ZIP` o similar, utilizando tipografía de ancho fijo (`fontFamily: "var(--font-jetbrains-mono), monospace"`) y tamaño pequeño (`10px`).
  * Estilo por defecto: Borde sutil (`1px solid var(--border)`), fondo transparente o muy atenuado, color de texto atenuado (`var(--muted)`).
* **Interactividad y Micro-animaciones**:
  * **Hover**: Al pasar el cursor, el borde se iluminará con el color de acento (`var(--accent)`), el fondo tomará el color de acento atenuado (`var(--accent-muted)`) y el texto se coloreará con `var(--accent)`. El icono de la flecha `⬇` tendrá un desplazamiento sutil hacia abajo (`transform: translateY(1px)`) simulando un empuje físico.
  * **Clic**: El enlace navegará nativamente al endpoint de descarga del backend. Se detendrá la propagación del evento (`e.stopPropagation()`) para evitar que se abra el panel de detalles lateral al hacer clic en el botón de descarga directa.

### 2.2. Botón Alternativo de Descarga en `DetailPanel.tsx`

* **Ubicación**: Dentro de la caja de configuración de "Instalar" (`var(--raised)`), debajo del bloque de comando CLI.
* **Aspecto Visual**:
  * Un divisor de línea fino (`1px solid var(--border)`) separará el bloque CLI del nuevo bloque de descarga manual.
  * El bloque mostrará una etiqueta descriptiva a la izquierda: `¿Prefieres instalarlo manualmente?` en tamaño `11px` y color atenuado.
  * A la derecha, un botón estilizado como un botón de acción secundario/primario que dirá `⬇ Descargar ZIP`.
  * Estilo del botón: Fondo de acento atenuado (`var(--accent-muted)`), borde de acento (`var(--accent)`), color de texto de acento (`var(--accent)`), esquinas redondeadas (`4px`), peso de fuente semi-negrita (`600`) y tamaño de fuente `11px`.
* **Interactividad y Micro-animaciones**:
  * **Hover**: El fondo se iluminará, cambiando de `var(--accent-muted)` a un acento ligeramente más visible. El cursor cambiará a tipo `pointer`.
  * **Clic**: Al hacer clic, se activará la descarga directa nativa del navegador y se disparará de inmediato la llamada POST en segundo plano para registrar la instalación. Al recibir la confirmación de la API, el contador de instalaciones mostrado en la parte inferior del panel se incrementará en tiempo real frente a los ojos del usuario.

---

## 3. Flujo de Datos y Arquitectura de API

### 3.1. Endpoints de Backend Utilizados

La implementación de esta característica no requiere cambios estructurales en el backend, ya que se apoya en endpoints existentes y optimizados:

1. **Descarga de ZIP**:
   * **Endpoint**: `GET /api/skills/[slug]/download`
   * **Comportamiento**: Obtiene los datos del skill y sus archivos asociados en la base de datos, ensambla un archivo ZIP en memoria con `JSZip` y lo sirve al navegador como un archivo adjunto binario con compresión DEFLATE.
2. **Incremento del Contador**:
   * **Endpoint**: `POST /api/skills/[slug]/install`
   * **Comportamiento**: Incrementa de forma atómica en la base de datos el contador `install_count` para la fila especificada por el `slug`, retornando un JSON con el resultado y el nuevo valor totalizado.
   * **Estructura de respuesta**:
     ```json
     {
       "success": true,
       "installCount": 1246
     }
     ```

### 3.2. Lógica del Cliente (Manejadores de Eventos)

#### Manejador en `SkillCard.tsx`
```typescript
const handleDownload = (e: React.MouseEvent) => {
  // Evitar que la tarjeta se seleccione o abra el panel de detalles lateral
  e.stopPropagation();

  // Disparar la petición silenciosa para registrar la descarga en base de datos
  fetch(`/api/skills/${skill.slug}/install`, { method: "POST" })
    .catch(() => {
      // Ignorar fallos de red en el contador para que la experiencia de descarga no se interrumpa
    });
};
```

#### Manejador en `DetailPanel.tsx`
```typescript
async function handleDownload() {
  // Disparar incremento del contador en segundo plano
  fetch(`/api/skills/${selectedSkill.slug}/install`, { method: "POST" })
    .then((res) => {
      if (res.ok) return res.json();
      throw new Error();
    })
    .then((data) => {
      // Actualizar el estado local liveCount para reflejar el incremento de forma instantánea
      if (data.installCount) {
        setLiveCount(data.installCount);
      }
    })
    .catch(() => {
      // En caso de fallo de red, se mantiene el conteo anterior sin alterar la UI
    });
}
```

---

## 4. Plan de Pruebas y Criterios de Aceptación

Para asegurar el correcto funcionamiento y la robustez de la nueva característica, se deben verificar los siguientes criterios:

* **Descarga del ZIP**: Al hacer clic tanto en el botón de la tarjeta como en el del panel, se debe generar un archivo con extensión `.zip` y el nombre correcto del slug (ej. `db-migrate.zip`).
* **Integridad del ZIP**: Al descomprimir el ZIP descargado, este debe contener el archivo principal `SKILL.md` con su frontmatter y contenido markdown completo, así como cualquier archivo adicional especificado en sus dependencias.
* **No Interferencia en la Tarjeta**: Al hacer clic en el botón `⬇ ZIP` de una tarjeta en el catálogo, se inicia la descarga del ZIP pero la tarjeta **no** se selecciona ni abre el panel de detalles.
* **Interferencia Normal**: Al hacer clic en cualquier otra parte de la tarjeta, se debe abrir el panel lateral con normalidad.
* **Incremento del Contador**: Al hacer clic en cualquiera de los botones de descarga, el valor de `install_count` de la base de datos debe incrementarse en `+1`.
* **Actualización en Caliente**: En el panel lateral de detalles, el indicador visual de "instalaciones" debe subir en `+1` de manera instantánea tras completarse la descarga y el registro.

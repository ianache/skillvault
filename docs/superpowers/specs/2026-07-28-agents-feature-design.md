# Especificación de Diseño: Integración de Agentes de IA Dinámicos y Simulador de Orquestación

- **Fecha:** 2026-07-28
- **Estado:** APROBADO 🚀
- **Autor:** Antigravity (AI Assistant)
- **Rama:** `feat/agents`

---

## 1. Descripción General del Feature

El objetivo de esta funcionalidad es incorporar al portal de **SkillVault** la capacidad de definir, gestionar y simular el uso de **Agentes de IA** interactivos. Estos agentes consumen *skills* del catálogo existente como si fueran herramientas autónomas (tools) asignadas.

De acuerdo con las decisiones de diseño adoptadas (Enfoque C y Enfoque de Orquestación Interactiva 1), la implementación se centrará en una experiencia de usuario premium en el frontend, utilizando un **motor de simulación de orquestación de herramientas** robusto. Los agentes, configuraciones y el historial de chat persistirán localmente a través de `localStorage` para garantizar continuidad de uso, quedando la interfaz totalmente modularizada para conectarse a un API de agentes real en el futuro.

---

## 2. Modelos de Datos y Estructuras

Se implementarán las siguientes interfaces TypeScript para garantizar consistencia y tipado estricto en toda la aplicación:

### A. Perfil de Agente de IA (`AIAgent`)
Define el esquema de un agente persistido:

```typescript
export interface AIAgent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;         // Ej: "claude-3-5-sonnet", "gpt-4o", "llama-3.3"
  skills: string[];      // Lista de slugs de skills asignados (ej: ["terraform-lint", "pr-reviewer"])
  status: 'active' | 'inactive';
  createdAt: string;
}
```

### B. Elemento de Orquestación (`ThoughtStep`)
Define un paso intermedio de procesamiento o ejecución de herramientas por parte del agente:

```typescript
export interface ThoughtStep {
  id: string;
  label: string;         // Mensaje amigable (ej: "Invocando herramienta /terraform-lint")
  status: 'pending' | 'running' | 'completed';
  durationMs?: number;
  output?: string;       // Registros/logs de terminal simulados en formato texto plano
}
```

### C. Mensaje de Conversación (`ChatMessage`)
Define el esquema de un mensaje dentro del chat de un agente específico:

```typescript
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  thoughtSteps?: ThoughtStep[]; // Pasos de ejecución/pensamiento animados para el asistente
}
```

---

## 3. Arquitectura de Rutas e Interfaz de Usuario

Se crearán las siguientes rutas en el App Router de Next.js (`src/app/`):

### 1. Panel de Control de Agentes (`/agents` o `/dashboard/agents`)
- **Propósito:** Mostrar los agentes existentes y estadísticas generales del sistema.
- **UI Elements:**
  - Grid responsivo de tarjetas de agentes (`AIAgent`).
  - Tarjetas con iniciales de avatar degradadas, indicador de estado activo (puntos turquesa parpadeando), badges de skills asignados y botones para chatear o editar.
  - Botón "Crear Agente" en la esquina superior derecha.

### 2. Formulario de Creación/Edición (`/agents/create` y `/agents/edit/[id]`)
- **Propósito:** Registrar un nuevo agente o editar uno existente.
- **UI Elements:**
  - Formulario estructurado con controles de estilo retro-warm/glassmorphic (Space Grotesk).
  - Textarea estilizada como editor para el "System Prompt".
  - **Asignador de Skills:** Caja de búsqueda de skills interactiva que consulta el catálogo local y permite activar casillas con animaciones fluidas de check.

### 3. Sala de Chat y Orquestador de Agentes (`/agents/chat/[id]`)
- **Propósito:** Interactuar directamente con el agente seleccionado y observar su ejecución de herramientas.
- **UI Elements:**
  - **Panel Izquierdo:** Detalles del agente, prompt básico de sistema y lista interactiva de sus herramientas asignadas (las cuales se encienden con un halo turquesa cuando están siendo utilizadas).
  - **Panel de Conversación:** Mensajes secuenciales. Para los mensajes del asistente:
    - Despliegue de los `ThoughtStep` correspondientes con spinners activos de carga.
    - Consola negra empotrada estilizada al estilo macOS (`JetBrains Mono`) con outputs detallados del linter, reviewer o base de datos.
  - **Chips de Prompts Rápidos:** Sugerencias basadas en los skills activos sobre la barra de texto para facilitar la demostración de los casos de uso.

---

## 4. Motor de Reglas de Simulación de Skills

Para simular una orquestación inteligente de agentes en el frontend, el asistente analizará el prompt del usuario mediante las siguientes reglas:

| Skill de Orquestación | Palabras Clave Desencadenantes | Logs de Consola Simulados |
| :--- | :--- | :--- |
| **`terraform-lint`** | `terraform`, `tf`, `lint`, `infra` | Impresión de logs de análisis de archivos `.tf` con advertencia de variables no usadas y compilación correcta. |
| **`pr-reviewer`** | `pr`, `pull request`, `review`, `revisar` | Simulación de análisis de ramas Git mostrando cantidad de archivos editados e instrucciones de refactorización de código limpio. |
| **`sql-explain`** | `sql`, `query`, `explain`, `db` | Impresión de sentencia SQL estructurada con desglose de coste de ejecución y recomendación de índices en verde turquesa. |
| **`agent-memory`** | `memoria`, `memory`, `recordar` | Simulación de búsqueda vectorial semántica e inyección de datos clave de la sesión del usuario. |

Si el usuario envía un mensaje que no coincide con ninguno de los skills asignados del agente, este procesará el prompt con un flujo estándar de pensamiento conversacional ("Analizando intencionalidad...", "Generando respuesta...") y contestará en base a su personalidad y systemPrompt.

---

## 5. Diseño Visual, Estética y Tokens

La estética de las nuevas pantallas seguirá rigurosamente los tokens oficiales definidos en `_ds/skillvault/styles.css`:

- **Tipografía:** `Space Grotesk` para la interfaz y títulos. `JetBrains Mono` para la consola de la terminal, códigos de triggers y badges de versión.
- **Colores:**
  - Fondo general cálido: `var(--sv-bg)` (`#f7f5f0`).
  - Tarjetas y paneles limpios: `var(--sv-surface)` (`#ffffff`) con bordes en `var(--sv-border)` (`#e6e1d8`).
  - Acento principal (oro/marrón premium): `var(--sv-accent)` (`#a9772e`).
  - Éxito/Activo (turquesa): `var(--sv-teal)` (`#0f9488`).
  - Terminal de Logs (Fondo oscuro): `var(--sv-sidebar-bg)` (`#1c1a17`).
- **Animaciones:** Transiciones suaves de escala en tarjetas, halos turquesas parpadeantes para herramientas en uso y desplazamientos dinámicos suaves para mensajes entrantes.

---

## 6. Estrategia de Pruebas y Validación

Para certificar el correcto funcionamiento de esta funcionalidad, se agregarán pruebas smoke y unitarias en `src/lib/review/ui-smoke.test.ts` u homólogos:

1. **Prueba de Rutas y Componentes:** Comprobar que los nuevos componentes de los agentes se exporten correctamente y utilicen los tokens estéticos.
2. **Prueba de Orquestación en Chat:** Comprobar que los mensajes de chat soportan y renderizan correctamente los `thoughtSteps` y los bloques de logs de terminal.
3. **Prueba de Persistencia:** Validar que el manejador local de estado (persistencia en `localStorage`) inicializa, agrega y recupera agentes sin errores.

# Plan de Reinicio de Caché Next.js (Turbopack)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Parar procesos locales de Node residuales, borrar la caché de compilación corrupta `.next/` de Next.js/Turbopack, y levantar el servidor para restablecer la estabilidad completa del compilador.

**Architecture:** Limpieza atómica de directorios de compilación volátiles del compilador Next.js.

**Tech Stack:** Next.js, Turbopack, Windows PowerShell, Git.

## Global Constraints

* Conservar intactos todos los archivos de configuración y base de datos locales de desarrollo (e.g. `skills-vault.db`).
* Asegurar que no queden hilos de Node corriendo en segundo plano antes de limpiar directorios.

---

### Task 1: Limpieza del Directorio de Caché de Next.js

**Files:**
- Modify: `.next/` (Directorio temporal de caché, borrado completo)

**Interfaces:**
- Consumes: Ninguna.
- Produces: Directorio `.next/` regenerado limpiamente en el reinicio del servidor de desarrollo.

- [ ] **Step 1: Matar procesos de Node residuales en Windows**
  Asegurarse de que no haya procesos de desarrollo de Next.js activos corriendo en segundo plano que bloqueen los archivos de caché.
  Run: `taskkill /f /im node.exe` (Ignorar si no se encuentran procesos de Node activos).

- [ ] **Step 2: Eliminar recursivamente el directorio de compilación `.next`**
  Borrar la carpeta de caché que contiene la base de datos de Turbopack corrompida.
  Run: `Remove-Item -Recururse -Force .next` (En PowerShell).
  Expected: La carpeta `.next` es completamente removida del disco.

- [ ] **Step 3: Levantar el servidor de desarrollo Next.js**
  Iniciar el compilador Next.js limpio.
  Run: `pnpm dev --turbo` (o el comando de inicio de desarrollo correspondiente).
  Expected: Next.js levanta de manera correcta y compila el proyecto desde cero, regenerando la base de datos de caché Turbopack sin errores de compactación.

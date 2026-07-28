# Plan de Implementación: Filtrado de "Mis Skills" y Descarga ZIP en Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Filtrar la sección "Mis Skills" por el usuario logueado en la capa de base de datos e incorporar un botón para descargar el archivo ZIP de cada skill directamente desde las acciones de la tabla.

**Architecture:** Modificaremos la página de dashboard en el lado del servidor (`src/app/dashboard/page.tsx`) para asegurar la sesión de NextAuth, obtener el ID de usuario y filtrar las consultas SQL. Actualizaremos el componente `DashboardClient.tsx` para agregar la opción de descarga nativa e incrementar el contador de descargas en segundo plano.

**Tech Stack:** Next.js Server Components, React Client Components, SQLite (via lib/db), NextAuth (auth).

## Global Constraints
* No placeholders (TODO, TBD, etc.) are allowed.
* Preservar el estilo CSS inline actual consistente con los tokens de diseño (`var(--border)`, `var(--muted)`, `var(--accent)`, etc.).
* Evitar que la descarga propague el clic en la grilla (`e.stopPropagation()`).
* Todas las pruebas del sistema deben pasar con éxito antes de concluir.

---

### Task 1: Servidor - Filtrado Seguro por Creador

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `auth` from `@/auth` para leer la sesión del usuario.
- Produces: `initialSkills` y estadísticas filtradas por `author_id` para `<DashboardClient />`.

- [ ] **Step 1: Modificar `src/app/dashboard/page.tsx` para importar `auth` y `redirect`**

  Modificar el archivo para incorporar la importación de `auth` de `@/auth` y `redirect` de `next/navigation`:
  ```typescript
  import { client } from "@/lib/db";
  import Link from "next/link";
  import { DashboardClient } from "@/components/dashboard/DashboardClient";
  import { PageHeader } from "@/components/PageHeader";
  import { auth } from "@/auth";
  import { redirect } from "next/navigation";
  ```

- [ ] **Step 2: Actualizar las firmas de `getStats` y `getSkills` para recibir `userId`**

  Reemplazar las funciones existentes de obtención de datos para condicionar sus consultas SQL mediante el parámetro `userId`:
  ```typescript
  async function getStats(userId: string) {
    const [skillsRes, installsRes, typesRes] = await Promise.all([
      client.execute({
        sql: "SELECT COUNT(*) as count FROM skills WHERE status = 'published' AND author_id = ?",
        args: [userId]
      }),
      client.execute({
        sql: "SELECT COALESCE(SUM(install_count), 0) as total FROM skills WHERE status = 'published' AND author_id = ?",
        args: [userId]
      }),
      client.execute({
        sql: "SELECT type, COUNT(*) as count FROM skills WHERE status = 'published' AND author_id = ? GROUP BY type ORDER BY count DESC",
        args: [userId]
      }),
    ]);

    return {
      totalSkills: Number(skillsRes.rows[0]?.count ?? 0),
      totalInstalls: Number(installsRes.rows[0]?.total ?? 0),
      byType: (typesRes.rows as { type: string; count: number }[]),
    };
  }

  async function getSkills(userId: string) {
    const res = await client.execute({
      sql: "SELECT id, slug, name, description, type, author_handle, version, triggers, compatibility, install_count, created_at, published_at, status FROM skills WHERE author_id = ? ORDER BY install_count DESC, created_at DESC",
      args: [userId]
    });
    return res.rows.map((r) => ({
      id: r.id as number,
      slug: r.slug as string,
      name: r.name as string,
      description: r.description as string,
      type: r.type as string,
      authorHandle: r.author_handle as string | null,
      version: r.version as string,
      triggers: JSON.parse(r.triggers as string ?? "[]") as string[],
      compatibility: JSON.parse(r.compatibility as string ?? '["claude"]') as string[],
      installCount: r.install_count as number,
      createdAt: Number(r.created_at),
      publishedAt: r.published_at === null || r.published_at === undefined ? null : Number(r.published_at),
      status: r.status as string,
    }));
  }
  ```

- [ ] **Step 3: Actualizar el componente por defecto `DashboardPage`**

  Garantizar que la sesión esté iniciada, recuperar el `id` del usuario y pasarlo a las funciones actualizadas de datos:
  ```typescript
  export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user?.id) {
      redirect("/api/auth/signin");
    }

    const userId = session.user.id;
    const [stats, skills] = await Promise.all([getStats(userId), getSkills(userId)]);

    return (
      // ... mantener el resto del marcado de retorno idéntico ...
    );
  ```

- [ ] **Step 4: Ejecutar la suite de pruebas para verificar que no hay errores de compilación**

  Run: `pnpm test`
  Expected: La suite de tests compila y pasa al 100% de manera exitosa.

- [ ] **Step 5: Guardar y comprometer los cambios en git**

  ```bash
  git add src/app/dashboard/page.tsx
  git commit -m "feat: secure dashboard stats and skills queries by author_id"
  ```

---

### Task 2: Interfaz de Usuario - Acción de Descarga ZIP en Tabla de Skills

**Files:**
- Modify: `src/components/dashboard/DashboardClient.tsx`

**Interfaces:**
- Consumes: Las propiedades de `skill` en cada fila.
- Produces: Un botón interactivo de descarga ZIP de tipo `<a>` HTML estándar en la columna de acciones.

- [ ] **Step 1: Localizar e incorporar la acción de descarga ZIP en la columna Acciones**

  En `src/components/dashboard/DashboardClient.tsx`, dentro del componente interno `SkillRow` (aproximadamente línea 315-330), incorporar el enlace de descarga justo antes o después del enlace de edición:
  ```typescript
        {/* Actions */}
        <div style={{ display: "flex", gap: "6px" }}>
          <Link
            href={`/skills/${skill.slug}`}
            style={actionBtnStyle}
            title="Ver en catálogo"
          >
            ↗
          </Link>
          <a
            href={`/api/skills/${skill.slug}/download`}
            download
            onClick={(e) => {
              e.stopPropagation();
              fetch(`/api/skills/${skill.slug}/install`, { method: "POST" }).catch(() => {});
            }}
            style={actionBtnStyle}
            title="Descargar ZIP"
          >
            ↓
          </a>
          <Link
            href={`/skills/${skill.slug}/edit`}
            style={{ ...actionBtnStyle, color: "var(--accent)", borderColor: "rgba(59,110,255,0.3)" }}
            title="Editar skill"
          >
            ✎
          </Link>
        </div>
  ```

- [ ] **Step 2: Verificar sintaxis y formato**

  Asegurar que todas las etiquetas de cerrado y apertura de JSX coinciden y que no hay referencias indefinidas.

- [ ] **Step 3: Ejecutar la suite de pruebas**

  Run: `pnpm test`
  Expected: Todo en verde.

- [ ] **Step 4: Comprometer los cambios de frontend en git**

  ```bash
  git add src/components/dashboard/DashboardClient.tsx
  git commit -m "feat: add direct ZIP download action with background install count tracking on dashboard rows"
  ```

---

### Task 3: Pruebas de Calidad - Pruebas Estáticas de Humo (UI Smoke Tests)

**Files:**
- Modify: `src/lib/review/ui-smoke.test.ts`

**Interfaces:**
- Consumes: `DashboardClient.tsx` de forma estática en la función de lectura de archivos.
- Produces: Un nuevo test suite para verificar la conformidad de las especificaciones.

- [ ] **Step 1: Añadir un test case en `src/lib/review/ui-smoke.test.ts`**

  Al final del archivo `src/lib/review/ui-smoke.test.ts`, añadir el nuevo bloque de test:
  ```typescript
  test("DashboardClient renders a zip download action in rows with click propagation stopped", async () => {
    const dashboardSource = await source("../../components/dashboard/DashboardClient.tsx");
    assert.match(dashboardSource, /href=\{\`\/api\/skills\/\$\{skill\.slug\}\/download\`\}/);
    assert.match(dashboardSource, /download/);
    assert.match(dashboardSource, /e\.stopPropagation\(\)/);
    assert.match(dashboardSource, /fetch\(\`\/api\/skills\/\$\{skill\.slug\}\/install\`/);
  });
  ```

- [ ] **Step 2: Ejecutar los tests de humo para verificar el funcionamiento de las aserciones**

  Run: `pnpm test`
  Expected: La suite de tests de humo completa sus 125 aserciones exitosamente (incluyendo la nueva aserción).

- [ ] **Step 3: Comprometer los cambios de tests en git**

  ```bash
  git add src/lib/review/ui-smoke.test.ts
  git commit -m "test: add static smoke test verifying dashboard my skills ZIP download structure"
  ```

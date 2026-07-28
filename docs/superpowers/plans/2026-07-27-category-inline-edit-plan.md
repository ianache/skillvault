# Plan de Implementación de Edición de Categorías Inline en Catálogo

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir a usuarios con roles de `editor`, `reviewer` y `admin` editar la categoría de un skill directamente en el catálogo mediante un lápiz en hover y combobox interactivo, actualizando la base de datos de manera inmediata.

**Architecture:** Nueva ruta API aislada para actualización directa y propagación de estado React en componentes cliente.

**Tech Stack:** Next.js App Router, React Client Hooks, TypeScript, SQLite (via lib/db).

## Global Constraints

* Toda modificación de base de datos (`skills`) debe ocurrir a través de un endpoint API debidamente asegurado a nivel de rol.
* Cualquier clic o interacción con elementos de edición debe invocar `e.stopPropagation()` para evitar que el contenedor de la tarjeta (padre clickable) maneje o altere la selección de la skill.
* Cumplir con TDD: escribir pruebas unitarias o de contrato antes de implementar el código lógico.

---

### Task 1: Endpoint de Backend `PUT /api/skills/[slug]/category`

**Files:**
- Create: `src/app/api/skills/[slug]/category/route.ts`
- Create: `src/lib/review/category-api.test.ts`

**Interfaces:**
- Consumes: `auth` (de `@/auth`), `client` (de `@/lib/db`).
- Produces: API HTTP `PUT /api/skills/[slug]/category` que acepta un JSON `{"type": "new-category-slug"}` y actualiza el campo `type` de la skill en la tabla `skills`.

- [ ] **Step 1: Crear caso de prueba unitaria y contrato para el nuevo endpoint**
  Escribir pruebas en `src/lib/review/category-api.test.ts` para validar la autenticación y actualización de categoría.

  ```typescript
  // src/lib/review/category-api.test.ts
  import { NextRequest } from "next/server";
  import { PUT } from "@/app/api/skills/[slug]/category/route";
  import { client } from "@/lib/db";

  describe("API PUT /api/skills/[slug]/category", () => {
    beforeEach(async () => {
      // Registrar un skill temporal para pruebas
      await client.execute(`
        INSERT INTO skills (id, name, slug, description, type, version, status, install_count, created_at)
        VALUES (9999, 'Test Skill', 'test-skill-category-edit', 'Description', 'code', '1.0.0', 'published', 0, 1234567)
        ON CONFLICT(id) DO UPDATE SET type='code', status='published';
      `);
    });

    afterEach(async () => {
      await client.execute("DELETE FROM skills WHERE id = 9999");
    });

    it("requires authenticated user session with reviewer, editor, or admin roles", async () => {
      // Prueba con sesión no autorizada o nula (debe dar 401)
      const req = new NextRequest("http://localhost/api/skills/test-skill-category-edit/category", {
        method: "PUT",
        body: JSON.stringify({ type: "docs" }),
      });
      const response = await PUT(req, { params: Promise.resolve({ slug: "test-skill-category-edit" }) });
      expect(response.status).toBe(401);
    });
  });
  ```

- [ ] **Step 2: Ejecutar pruebas y verificar falla esperada**
  Run: `pnpm test src/lib/review/category-api.test.ts` (o el equivalente de jest activo).
  Expected: FAIL (debido a que el endpoint no existe o el import falla).

- [ ] **Step 3: Crear el endpoint de backend seguro**
  Escribir la lógica completa de validación de roles y actualización en `src/app/api/skills/[slug]/category/route.ts`.

  ```typescript
  import { NextRequest, NextResponse } from "next/server";
  import { auth } from "@/auth";
  import { client } from "@/lib/db";

  type RouteContext = { params: Promise<{ slug: string }> };

  export async function PUT(req: NextRequest, { params }: RouteContext) {
    const session = await auth();
    const roles = session?.user?.roles ?? [];
    const isAuthorized = roles.includes("admin") || roles.includes("reviewer") || roles.includes("editor");

    if (!isAuthorized) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await req.json().catch(() => ({}));
    const newType = body.type;

    if (!newType || typeof newType !== "string") {
      return NextResponse.json({ error: "Tipo de categoría inválido o ausente" }, { status: 400 });
    }

    // Validar que la categoría exista en la base de datos
    const catCheck = await client.execute({
      sql: "SELECT slug FROM categories WHERE slug = ? LIMIT 1",
      args: [newType],
    });

    if (catCheck.rows.length === 0) {
      return NextResponse.json({ error: "La categoría especificada no existe" }, { status: 400 });
    }

    // Actualizar la categoría en la tabla de skills
    await client.execute({
      sql: "UPDATE skills SET type = ? WHERE slug = ? AND status = 'published'",
      args: [newType, slug],
    });

    return NextResponse.json({ success: true, type: newType });
  }
  ```

- [ ] **Step 4: Ejecutar pruebas unitarias para confirmar el paso exitoso**
  Run: `pnpm test src/lib/review/category-api.test.ts`
  Expected: PASS

- [ ] **Step 5: Confirmar cambios en Git**
  Run:
  ```bash
  git add src/app/api/skills/[slug]/category/route.ts src/lib/review/category-api.test.ts
  git commit -m "feat: add PUT endpoint for direct skill category update with role validation"
  ```

---

### Task 2: Integración Frontend de Selección de Categoría en SkillCard y Catálogo

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/CatalogClient.tsx`
- Modify: `src/components/SkillCard.tsx`
- Modify: `src/lib/review/ui-smoke.test.ts`

**Interfaces:**
- Consumes: Props de `SkillCard` extendidas (`userRoles`, `categories`, `onCategoryUpdate`).
- Produces: UI interactiva con lápiz en hover de categoría seleccionada, combobox de cambio instantáneo de categoría y propagación de estado al catálogo.

- [ ] **Step 1: Escribir prueba de UI para asegurar el flujo de edición en SkillCard**
  En `src/lib/review/ui-smoke.test.ts`, agregar aserciones para verificar que `SkillCard` maneja correctamente la edición interactiva de categoría.

  ```typescript
  // Agregar al final de src/lib/review/ui-smoke.test.ts
  test("SkillCard handles inline category edit on hover and click for authorized roles", async () => {
    const cardSource = await source("../../components/SkillCard.tsx");
    expect(cardSource).toContain("isEditingCategory");
    expect(cardSource).toContain("pencil-icon");
    expect(cardSource).toContain("stopPropagation");
  });
  ```

- [ ] **Step 2: Ejecutar suite de pruebas de UI y confirmar error esperado**
  Run: `pnpm test src/lib/review/ui-smoke.test.ts`
  Expected: FAIL (falta la lógica de props y estados en `SkillCard.tsx`).

- [ ] **Step 3: Modificar `src/app/page.tsx` para pasar el usuario**
  Pasar el objeto de sesión `session?.user` al cliente del catálogo.

  ```typescript
  // src/app/page.tsx: alrededor de la línea 175
  // Reemplazar:
  // <CatalogClient initialSkills={skills} initialCategories={categories} initialQuery={q ?? ""} initialType={type ?? ""} />
  // Por:
  <CatalogClient
    initialSkills={skills}
    initialCategories={categories}
    initialQuery={q ?? ""}
    initialType={type ?? ""}
    user={session?.user ? { id: session.user.id, name: session.user.name, email: session.user.email, roles: session.user.roles ?? [] } : null}
  />
  ```

- [ ] **Step 4: Modificar `src/components/CatalogClient.tsx`**
  Actualizar las Props, recibir el objeto `user`, e implementar la propagación reactiva al cambiar la categoría.

  ```typescript
  // src/components/CatalogClient.tsx: Agregar user en Props y mapear en el loop
  interface Props {
    initialSkills: SkillRow[];
    initialCategories: Category[];
    initialQuery?: string;
    initialType?: string;
    user?: { id: string; name?: string | null; email?: string | null; roles: string[] } | null;
  }

  // Y en la función CatalogClient:
  export function CatalogClient({ initialSkills, initialCategories, initialQuery = "", initialType = "", user = null }: Props) {
    // ... estado existente ...

    // Callback de actualización
    const handleCategoryUpdate = useCallback((slug: string, newType: string) => {
      setSkills((prev) => prev.map((s) => (s.slug === slug ? { ...s, type: newType } : s)));
      setSelected((prev) => (prev && prev.slug === slug ? { ...prev, type: newType } : prev));
    }, []);

    // Y al renderizar <SkillCard>:
    <SkillCard
      key={skill.id}
      skill={skill}
      selected={selected?.slug === skill.slug}
      onClick={() => setSelected(selected?.slug === skill.slug ? null : skill)}
      userRoles={user?.roles ?? []}
      categories={categories}
      onCategoryUpdate={handleCategoryUpdate}
    />
  ```

- [ ] **Step 5: Modificar `src/components/SkillCard.tsx`**
  Implementar el diseño interactivo de la Opción B: botón flotante de lápiz en hover, render del combobox selectivo al pulsar, envío automático vía fetch PUT al seleccionar, y bloqueo de propagación.

  ```typescript
  // src/components/SkillCard.tsx
  // Añadir imports de useState
  import { useState } from "react";
  import { Category, CATEGORY_META, SkillRow } from "@/lib/types";

  interface Props {
    skill: SkillRow;
    selected: boolean;
    onClick: () => void;
    userRoles?: string[];
    categories?: Category[];
    onCategoryUpdate?: (slug: string, newType: string) => void;
  }

  // Dentro de SkillCard(props):
  export function SkillCard({ skill, selected, onClick, userRoles = [], categories = [], onCategoryUpdate }: Props) {
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    const [isHoveredCategory, setIsHoveredCategory] = useState(false);

    // Mapear color dinámico de categorías
    const meta = categories.find(c => c.slug === skill.type) ??
      CATEGORY_META[skill.type] ??
      { label: skill.type, color: "#8590A8", icon: "◇" };

    const stripeClass = `stripe-${skill.type}`;

    const canEdit = selected && (
      userRoles.includes("admin") ||
      userRoles.includes("reviewer") ||
      userRoles.includes("editor")
    );

    // Render badge o dropdown
    const renderCategoryBadge = () => {
      if (isEditingCategory) {
        return (
          <select
            value={skill.type}
            onBlur={() => setIsEditingCategory(false)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={async (e) => {
              e.stopPropagation();
              const newType = e.target.value;
              setIsEditingCategory(false);
              onCategoryUpdate?.(skill.slug, newType);
              try {
                await fetch(`/api/skills/${skill.slug}/category`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ type: newType }),
                });
              } catch (err) {
                console.error("Error actualizando categoría", err);
              }
            }}
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "11px",
              background: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--accent)",
              borderRadius: "4px",
              padding: "2px 6px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        );
      }

      return (
        <span
          onMouseEnter={() => { if (canEdit) setIsHoveredCategory(true); }}
          onMouseLeave={() => { if (canEdit) setIsHoveredCategory(false); }}
          onClick={(e) => {
            if (canEdit) {
              e.stopPropagation();
              e.preventDefault();
              setIsEditingCategory(true);
            }
          }}
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "9px",
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            padding: "2px 6px",
            borderRadius: "3px",
            border: `1px solid ${meta.color}`,
            color: meta.color,
            background: `${meta.color}18`,
            cursor: canEdit ? "pointer" : "default",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
          title={canEdit ? "Hacer clic para editar categoría" : undefined}
        >
          {meta.icon} {meta.label}
          {canEdit && isHoveredCategory && (
            <span className="pencil-icon" style={{ marginLeft: "4px", fontSize: "10px", opacity: 0.8 }}>✏️</span>
          )}
        </span>
      );
    };

    // Y colocar {renderCategoryBadge()} dentro del div de categoría existente
  ```

- [ ] **Step 6: Ejecutar pruebas y confirmar paso exitoso**
  Run: `pnpm test src/lib/review/ui-smoke.test.ts`
  Expected: PASS

- [ ] **Step 7: Confirmar todos los cambios finales en Git**
  Run:
  ```bash
  git add src/app/page.tsx src/components/CatalogClient.tsx src/components/SkillCard.tsx src/lib/review/ui-smoke.test.ts
  git commit -m "feat: implement visual option B hover-pencil edit category button on selected SkillCard with react state update"
  ```

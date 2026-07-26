import { client } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { CategoriesManager } from "@/components/CategoriesManager";
import { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getCategories(): Promise<Category[]> {
  const result = await client.execute(
    "SELECT slug, label, icon, color, description, sort_order FROM categories ORDER BY sort_order ASC"
  );
  return result.rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      slug: String(row.slug),
      label: String(row.label),
      icon: String(row.icon),
      color: String(row.color),
      description: String(row.description),
      sort_order: Number(row.sort_order),
    };
  });
}

async function getSkillCountPerCategory(): Promise<Record<string, number>> {
  const result = await client.execute(
    "SELECT type, COUNT(*) as count FROM skills GROUP BY type"
  );
  const map: Record<string, number> = {};
  for (const row of result.rows) {
    const r = row as Record<string, unknown>;
    map[String(r.type)] = Number(r.count);
  }
  return map;
}

export const metadata = { title: "Categorías" };

export default async function CategoriesPage() {
  const [categories, skillCounts] = await Promise.all([
    getCategories(),
    getSkillCountPerCategory(),
  ]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <PageHeader
        title="Gestión de categorías"
        description="Las categorías organizan el catálogo. Solo administradores pueden gestionarlas."
      />
      <div style={{ padding: "32px 24px" }}>
        <CategoriesManager initialCategories={categories} skillCounts={skillCounts} />
      </div>
    </div>
  );
}

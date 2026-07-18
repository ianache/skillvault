import { client } from "./index";

const INITIAL_CATEGORIES = [
  { slug: "code",  label: "Code",          icon: "⌨", color: "#3B6EFF", description: "Skills de programación, revisión de código y desarrollo de software.", sort_order: 1 },
  { slug: "docs",  label: "Docs",          icon: "📄", color: "#2ECC8A", description: "Generación y gestión de documentación técnica.", sort_order: 2 },
  { slug: "data",  label: "Data",          icon: "🗄", color: "#4AB8E8", description: "Análisis de datos, ETL y visualizaciones.", sort_order: 3 },
  { slug: "ui",    label: "UI / Frontend", icon: "🖥", color: "#C45FD4", description: "Diseño y desarrollo de interfaces de usuario.", sort_order: 4 },
  { slug: "infra", label: "Infra",         icon: "⚙", color: "#E88B3A", description: "Infraestructura, DevOps y configuración de entornos.", sort_order: 5 },
  { slug: "ai",    label: "AI & Agents",   icon: "🤖", color: "#E8503A", description: "Integración con modelos de IA y construcción de agentes.", sort_order: 6 },
];

async function migrate() {
  console.log("🔧 Running categories migration...");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '📦',
      color TEXT NOT NULL DEFAULT '#8590A8',
      description TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  const existing = await client.execute("SELECT COUNT(*) as count FROM categories");
  const count = Number((existing.rows[0] as Record<string, unknown>)["count"]);
  if (count > 0) {
    console.log(`✓ Categories already seeded (${count}). Skipping.`);
    await client.close();
    return;
  }

  for (const cat of INITIAL_CATEGORIES) {
    await client.execute({
      sql: `INSERT INTO categories (slug, label, icon, color, description, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [cat.slug, cat.label, cat.icon, cat.color, cat.description, cat.sort_order],
    });
  }

  console.log(`✓ Seeded ${INITIAL_CATEGORIES.length} categories.`);
  await client.close();
}

migrate().catch(console.error);

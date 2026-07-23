/**
 * Initializes SkillVault schema on a MySQL 8.0+ database.
 * Run once: DATABASE_URL=mysql://user:pass@host/dbname tsx src/lib/db/migrate-mysql-init.ts
 * Idempotent — uses CREATE TABLE IF NOT EXISTS.
 */
import { client } from "./index";

const INITIAL_CATEGORIES = [
  { slug: "code",  label: "Code",          icon: "⌨", color: "#3B6EFF", description: "Skills de programación, revisión de código y desarrollo de software.", sort_order: 1 },
  { slug: "docs",  label: "Docs",          icon: "📄", color: "#2ECC8A", description: "Generación y gestión de documentación técnica.", sort_order: 2 },
  { slug: "data",  label: "Data",          icon: "🗄", color: "#4AB8E8", description: "Análisis de datos, ETL y visualizaciones.", sort_order: 3 },
  { slug: "ui",    label: "UI / Frontend", icon: "🖥", color: "#C45FD4", description: "Diseño y desarrollo de interfaces de usuario.", sort_order: 4 },
  { slug: "infra", label: "Infra",         icon: "⚙", color: "#E88B3A", description: "Infraestructura, DevOps y configuración de entornos.", sort_order: 5 },
  { slug: "ai",    label: "AI & Agents",   icon: "🤖", color: "#E8503A", description: "Integración con modelos de IA y construcción de agentes.", sort_order: 6 },
];

async function run() {
  console.log("🔧 MySQL 8+ — creating SkillVault schema...");

  await client.execute({
    sql: `CREATE TABLE IF NOT EXISTS skills (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      type VARCHAR(50) NOT NULL,
      author_id VARCHAR(255),
      author_handle VARCHAR(255),
      version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
      schema_version VARCHAR(20) NOT NULL DEFAULT '1.1',
      triggers TEXT NOT NULL,
      tools TEXT NOT NULL,
      compatibility TEXT NOT NULL,
      dependencies TEXT NOT NULL,
      config_requirements TEXT NOT NULL,
      raw_content LONGTEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'published',
      install_count INT NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()),
      updated_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()),
      published_at BIGINT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  });
  console.log("✓ skills");

  await client.execute({
    sql: `CREATE TABLE IF NOT EXISTS skill_versions (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      skill_id INT NOT NULL,
      version VARCHAR(50) NOT NULL,
      raw_content LONGTEXT NOT NULL,
      created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP())
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  });
  console.log("✓ skill_versions");

  await client.execute({
    sql: `CREATE TABLE IF NOT EXISTS skill_files (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      skill_id INT NOT NULL,
      path VARCHAR(500) NOT NULL,
      file_type VARCHAR(50) NOT NULL,
      content LONGTEXT NOT NULL,
      created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP())
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  });
  console.log("✓ skill_files");

  await client.execute({
    sql: `CREATE TABLE IF NOT EXISTS installs (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      skill_id INT NOT NULL,
      user_id VARCHAR(255),
      harness VARCHAR(50) NOT NULL DEFAULT 'claude',
      scope VARCHAR(20) NOT NULL DEFAULT 'global',
      skill_version VARCHAR(50) NOT NULL,
      installed_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP())
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  });
  console.log("✓ installs");

  await client.execute({
    sql: `CREATE TABLE IF NOT EXISTS categories (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(100) NOT NULL UNIQUE,
      label VARCHAR(100) NOT NULL,
      icon VARCHAR(20) NOT NULL DEFAULT '📦',
      color VARCHAR(20) NOT NULL DEFAULT '#8590A8',
      description TEXT NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP())
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  });
  console.log("✓ categories");

  // Seed categories if empty
  const existing = await client.execute({ sql: "SELECT COUNT(*) as count FROM categories" });
  const count = Number((existing.rows[0] as Record<string, unknown>)["count"]);
  if (count === 0) {
    for (const cat of INITIAL_CATEGORIES) {
      await client.execute({
        sql: `INSERT INTO categories (slug, label, icon, color, description, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [cat.slug, cat.label, cat.icon, cat.color, cat.description, cat.sort_order],
      });
    }
    console.log(`✓ Seeded ${INITIAL_CATEGORIES.length} categories.`);
  } else {
    console.log(`✓ Categories already seeded (${count}). Skipping.`);
  }

  console.log("\nMigration complete.");
  await client.close();
}

run().catch((e) => { console.error(e); process.exit(1); });

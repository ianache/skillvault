import { client } from "./index";

const SKILLS = [
  {
    slug: "code-review",
    name: "code-review",
    description: "Revisa el diff actual buscando bugs, problemas de seguridad y oportunidades de simplificación.",
    type: "code",
    author_handle: "@anthropic",
    version: "2.1.0",
    triggers: JSON.stringify(["/code-review", "revisar código", "review diff", "buscar bugs"]),
    tools: JSON.stringify(["Read", "Grep", "Glob", "Edit", "Agent"]),
    compatibility: JSON.stringify(["claude", "codex", "opencode"]),
    install_count: 4820,
  },
  {
    slug: "artifact-design",
    name: "artifact-design",
    description: "Carga las reglas de diseño para artefactos HTML/SVG antes de generar cualquier visualización.",
    type: "ui",
    author_handle: "@anthropic",
    version: "1.3.0",
    triggers: JSON.stringify(["/artifact-design", "diseñar artefacto", "crear visualización"]),
    tools: JSON.stringify(["Artifact"]),
    compatibility: JSON.stringify(["claude"]),
    install_count: 3210,
  },
  {
    slug: "graphify",
    name: "graphify",
    description: "Convierte cualquier input en un grafo de conocimiento estructurado usando Graphiti.",
    type: "ai",
    author_handle: "@ilver",
    version: "1.0.2",
    triggers: JSON.stringify(["/graphify", "crear grafo", "knowledge graph"]),
    tools: JSON.stringify(["mcp__graphiti_kb__ingest", "mcp__graphiti_kb__search"]),
    compatibility: JSON.stringify(["claude"]),
    install_count: 892,
  },
  {
    slug: "init",
    name: "init",
    description: "Inicializa un proyecto nuevo con estructura de carpetas, CLAUDE.md y git según las mejores prácticas.",
    type: "infra",
    author_handle: "@anthropic",
    version: "1.5.0",
    triggers: JSON.stringify(["/init", "inicializar proyecto", "nuevo proyecto"]),
    tools: JSON.stringify(["Write", "PowerShell", "Read"]),
    compatibility: JSON.stringify(["claude", "codex"]),
    install_count: 5430,
  },
  {
    slug: "gsd-plan",
    name: "gsd-plan",
    description: "Genera un plan de implementación estructurado con tareas atómicas y análisis de dependencias.",
    type: "code",
    author_handle: "@gsd",
    version: "3.0.1",
    triggers: JSON.stringify(["/gsd:plan-phase", "planificar", "crear plan"]),
    tools: JSON.stringify(["Read", "Write", "Glob", "Grep", "Agent"]),
    compatibility: JSON.stringify(["claude"]),
    install_count: 2180,
  },
  {
    slug: "docs-writer",
    name: "docs-writer",
    description: "Genera documentación técnica precisa a partir del código fuente: README, API docs y guías de uso.",
    type: "docs",
    author_handle: "@anthropic",
    version: "1.2.0",
    triggers: JSON.stringify(["/docs-writer", "escribir docs", "documentar", "generar README"]),
    tools: JSON.stringify(["Read", "Write", "Glob", "Grep"]),
    compatibility: JSON.stringify(["claude", "codex", "opencode", "agy"]),
    install_count: 1940,
  },
  {
    slug: "data-analyst",
    name: "data-analyst",
    description: "Analiza datasets CSV/JSON y genera visualizaciones estadísticas con insights accionables.",
    type: "data",
    author_handle: "@datalab",
    version: "2.0.0",
    triggers: JSON.stringify(["/data-analyst", "analizar datos", "explorar dataset"]),
    tools: JSON.stringify(["Read", "Write", "PowerShell", "Artifact"]),
    compatibility: JSON.stringify(["claude", "codex"]),
    install_count: 1560,
  },
  {
    slug: "security-review",
    name: "security-review",
    description: "Audita el código buscando vulnerabilidades OWASP Top 10, secretos expuestos y problemas de autenticación.",
    type: "code",
    author_handle: "@secops",
    version: "1.4.2",
    triggers: JSON.stringify(["/security-review", "auditar seguridad", "buscar vulnerabilidades"]),
    tools: JSON.stringify(["Read", "Grep", "Glob", "Agent"]),
    compatibility: JSON.stringify(["claude", "codex", "opencode"]),
    install_count: 3870,
  },
  {
    slug: "ui-review",
    name: "ui-review",
    description: "Audita la UI implementada contra 6 pilares de calidad visual y genera REVIEW.md con puntuación.",
    type: "ui",
    author_handle: "@gsd",
    version: "1.1.0",
    triggers: JSON.stringify(["/gsd:ui-review", "revisar UI", "auditar diseño"]),
    tools: JSON.stringify(["Read", "Write", "Glob", "Grep"]),
    compatibility: JSON.stringify(["claude"]),
    install_count: 980,
  },
  {
    slug: "db-migrate",
    name: "db-migrate",
    description: "Genera y aplica migraciones de base de datos seguras con rollback automático y validación de schema.",
    type: "infra",
    author_handle: "@devtools",
    version: "2.3.0",
    triggers: JSON.stringify(["/db-migrate", "migrar base de datos", "crear migración"]),
    tools: JSON.stringify(["Read", "Write", "PowerShell"]),
    compatibility: JSON.stringify(["claude", "codex", "opencode", "agy"]),
    install_count: 2340,
  },
  {
    slug: "claude-api",
    name: "claude-api",
    description: "Genera código para integrar la API de Anthropic con manejo de errores, streaming y tool use.",
    type: "ai",
    author_handle: "@anthropic",
    version: "1.0.5",
    triggers: JSON.stringify(["/claude-api", "integrar claude", "anthropic api"]),
    tools: JSON.stringify(["Read", "Write", "Edit", "WebFetch"]),
    compatibility: JSON.stringify(["claude", "codex"]),
    install_count: 4120,
  },
  {
    slug: "test-coverage",
    name: "test-coverage",
    description: "Analiza la cobertura de tests del proyecto y genera tests unitarios para los gaps identificados.",
    type: "code",
    author_handle: "@testlab",
    version: "1.2.1",
    triggers: JSON.stringify(["/test-coverage", "analizar cobertura", "generar tests"]),
    tools: JSON.stringify(["Read", "Write", "Glob", "Grep", "PowerShell"]),
    compatibility: JSON.stringify(["claude", "codex", "opencode"]),
    install_count: 1780,
  },
  {
    slug: "storybook-gen",
    name: "storybook-gen",
    description: "Genera stories de Storybook para componentes React existentes con variantes y controles automáticos.",
    type: "ui",
    author_handle: "@uicraft",
    version: "1.0.3",
    triggers: JSON.stringify(["/storybook-gen", "generar stories", "crear storybook"]),
    tools: JSON.stringify(["Read", "Write", "Glob"]),
    compatibility: JSON.stringify(["claude", "cursor"]),
    install_count: 730,
  },
  {
    slug: "api-spec",
    name: "api-spec",
    description: "Genera especificaciones OpenAPI 3.1 a partir de rutas y controladores existentes en el código.",
    type: "docs",
    author_handle: "@devtools",
    version: "2.0.0",
    triggers: JSON.stringify(["/api-spec", "documentar API", "generar openapi"]),
    tools: JSON.stringify(["Read", "Write", "Glob", "Grep"]),
    compatibility: JSON.stringify(["claude", "codex", "opencode", "agy", "cursor"]),
    install_count: 2890,
  },
  {
    slug: "infra-audit",
    name: "infra-audit",
    description: "Audita la configuración de infraestructura (Docker, CI/CD, env vars) buscando problemas de seguridad.",
    type: "infra",
    author_handle: "@secops",
    version: "1.1.0",
    triggers: JSON.stringify(["/infra-audit", "auditar infra", "revisar docker"]),
    tools: JSON.stringify(["Read", "Glob", "Grep"]),
    compatibility: JSON.stringify(["claude", "codex"]),
    install_count: 1230,
  },
];

async function seed() {
  console.log("🌱 Seeding SkillVault database...");
  const now = Math.floor(Date.now() / 1000);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      author_id TEXT,
      author_handle TEXT,
      version TEXT NOT NULL DEFAULT '1.0.0',
      schema_version TEXT NOT NULL DEFAULT '1.1',
      triggers TEXT NOT NULL DEFAULT '[]',
      tools TEXT NOT NULL DEFAULT '[]',
      compatibility TEXT NOT NULL DEFAULT '["claude"]',
      dependencies TEXT NOT NULL DEFAULT '[]',
      raw_content TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'published',
      install_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
      published_at INTEGER
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS skill_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_id INTEGER NOT NULL,
      version TEXT NOT NULL,
      raw_content TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS installs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_id INTEGER NOT NULL,
      user_id TEXT,
      harness TEXT NOT NULL DEFAULT 'claude',
      scope TEXT NOT NULL DEFAULT 'global',
      skill_version TEXT NOT NULL,
      installed_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  const existing = await client.execute("SELECT COUNT(*) as count FROM skills");
  const count = Number((existing.rows[0] as Record<string, unknown>)["count"]);
  if (count > 0) {
    console.log(`✓ Already seeded (${count} skills). Skipping.`);
    await client.close();
    return;
  }

  for (const skill of SKILLS) {
    await client.execute({
      sql: `INSERT INTO skills (slug, name, description, type, author_handle, version, triggers, tools, compatibility, install_count, published_at, raw_content)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '')`,
      args: [
        skill.slug, skill.name, skill.description, skill.type,
        skill.author_handle, skill.version, skill.triggers,
        skill.tools, skill.compatibility, skill.install_count, now,
      ],
    });
  }

  console.log(`✓ Seeded ${SKILLS.length} skills.`);
  await client.close();
}

seed().catch(console.error);

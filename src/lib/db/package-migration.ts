type MigrationClient = {
  execute: (input: string | { sql: string; args?: unknown[] }) => Promise<unknown>;
};

export type PackageMigrationDialect = "sqlite" | "mysql";

const sqliteStatements = [
  `CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    current_version TEXT,
    owner_team_id TEXT,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS package_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_id INTEGER NOT NULL,
    version TEXT NOT NULL,
    release_status TEXT NOT NULL DEFAULT 'draft',
    manifest_json TEXT NOT NULL DEFAULT '{}',
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    published_at INTEGER,
    UNIQUE(package_id, version)
  )`,
  `CREATE TABLE IF NOT EXISTS package_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_version_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    version_policy TEXT NOT NULL,
    pinned_version TEXT,
    position INTEGER NOT NULL,
    retired_at_publish INTEGER,
    UNIQUE(package_version_id, skill_id),
    UNIQUE(package_version_id, position)
  )`,
  `CREATE TABLE IF NOT EXISTS package_install_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_version_id INTEGER NOT NULL,
    harness TEXT NOT NULL,
    scope TEXT NOT NULL,
    requested_by TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    failure_code TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    expires_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS package_install_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id INTEGER NOT NULL,
    skill_id INTEGER NOT NULL,
    resolved_version TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    destination TEXT,
    error_code TEXT,
    position INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS package_download_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id TEXT,
    occurred_at INTEGER NOT NULL DEFAULT (unixepoch()),
    source_ip TEXT NOT NULL,
    package_slug TEXT NOT NULL,
    skill_slug TEXT,
    version TEXT NOT NULL,
    format TEXT NOT NULL,
    result TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS package_download_rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_key TEXT NOT NULL,
    source_ip TEXT NOT NULL,
    window_started_at INTEGER NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    UNIQUE(route_key, source_ip, window_started_at)
  )`,
  `CREATE TABLE IF NOT EXISTS package_download_rate_limit_config (
    id INTEGER PRIMARY KEY,
    max_downloads INTEGER NOT NULL DEFAULT 10,
    window_seconds INTEGER NOT NULL DEFAULT 1800,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  "INSERT OR IGNORE INTO package_download_rate_limit_config (id, max_downloads, window_seconds) VALUES (1, 10, 1800)",
  "CREATE INDEX IF NOT EXISTS idx_package_versions_package_version ON package_versions(package_id, version)",
  "CREATE INDEX IF NOT EXISTS idx_package_items_version_position ON package_items(package_version_id, position)",
  "CREATE INDEX IF NOT EXISTS idx_package_install_runs_expiry ON package_install_runs(expires_at)",
  "CREATE INDEX IF NOT EXISTS idx_package_download_audit_package ON package_download_audit(package_slug, occurred_at)",
  "CREATE INDEX IF NOT EXISTS idx_package_download_rate_limits_key ON package_download_rate_limits(route_key, source_ip, window_started_at)",
];

const mysqlStatements = sqliteStatements.map((statement) => statement
  .replaceAll("INTEGER PRIMARY KEY AUTOINCREMENT", "INT NOT NULL AUTO_INCREMENT PRIMARY KEY")
  .replaceAll("INTEGER", "BIGINT")
  .replaceAll("TEXT NOT NULL UNIQUE", "VARCHAR(255) NOT NULL UNIQUE")
  .replaceAll("TEXT NOT NULL", "TEXT NOT NULL")
  .replaceAll("TEXT,", "VARCHAR(255),")
  .replaceAll("TEXT\n", "TEXT\n")
  .replaceAll(" DEFAULT (unixepoch())", " DEFAULT 0")
  .replaceAll("TEXT NOT NULL DEFAULT '{}'", "TEXT NOT NULL")
  .replaceAll("status TEXT", "status VARCHAR(30)")
  .replaceAll("release_status TEXT", "release_status VARCHAR(30)")
  .replaceAll("version TEXT", "version VARCHAR(100)")
  .replaceAll("route_key TEXT", "route_key VARCHAR(255)")
  .replaceAll("source_ip TEXT", "source_ip VARCHAR(64)")
  .replaceAll("package_slug TEXT", "package_slug VARCHAR(255)")
  .replaceAll("route_key TEXT NOT NULL", "route_key VARCHAR(255) NOT NULL")
  .replaceAll("source_ip TEXT NOT NULL", "source_ip VARCHAR(64) NOT NULL")
  .replaceAll("package_slug TEXT NOT NULL", "package_slug VARCHAR(255) NOT NULL")
  .replaceAll("INSERT OR IGNORE INTO", "INSERT IGNORE INTO")
  .replaceAll("CREATE INDEX IF NOT EXISTS", "CREATE INDEX"));

export async function migratePackages(
  client: MigrationClient,
  dialect: PackageMigrationDialect = "sqlite"
): Promise<void> {
  const statements = dialect === "mysql" ? mysqlStatements : sqliteStatements;
  const structuralStatements = statements.filter((statement) => !statement.startsWith("CREATE INDEX"));
  const indexStatements = statements.filter((statement) => statement.startsWith("CREATE INDEX"));
  const mysqlSchemaFixes = dialect === "mysql" ? [
    "ALTER TABLE package_versions MODIFY COLUMN version VARCHAR(100) NOT NULL",
    "ALTER TABLE package_download_audit MODIFY COLUMN package_slug VARCHAR(255) NOT NULL, MODIFY COLUMN source_ip VARCHAR(64) NOT NULL",
    "ALTER TABLE package_download_rate_limits MODIFY COLUMN route_key VARCHAR(255) NOT NULL, MODIFY COLUMN source_ip VARCHAR(64) NOT NULL",
  ] : [];

  for (const statement of [...structuralStatements, ...mysqlSchemaFixes, ...indexStatements]) {
    try {
      await client.execute(statement);
    } catch (error) {
      const mysqlError = error as { code?: string; errno?: number };
      const duplicateKey = mysqlError.code === "ER_DUP_KEYNAME" || mysqlError.errno === 1061 || String(error).includes("1061");
      if (dialect !== "mysql" || !duplicateKey) throw error;
    }
  }
}

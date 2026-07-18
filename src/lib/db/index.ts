import path from "path";

const dbUrl = process.env.DATABASE_URL ?? "";
const isMysql = dbUrl.startsWith("mysql://") || dbUrl.startsWith("mysql2://");

type ExecuteArg = string | { sql: string; args?: unknown[] };

// ── MySQL (mysql2 + drizzle/mysql2) ──────────────────────────────────────────
async function createMysqlDb() {
  const mysql = await import("mysql2/promise");
  const { drizzle } = await import("drizzle-orm/mysql2");
  const schema = await import("./schema.mysql");

  const connection = await mysql.createConnection(dbUrl);
  const db = drizzle(connection, { schema, mode: "default" });

  const client = {
    execute: async (input: ExecuteArg) => {
      const sql = typeof input === "string" ? input : input.sql;
      const args = typeof input === "string" ? [] : (input.args ?? []);
      // mysql2 expects OkPacket or RowDataPacket[], cast appropriately
      const [rows] = await connection.execute(sql, args as (string | number | null)[]);
      return { rows: (Array.isArray(rows) ? rows : []) as Record<string, unknown>[] };
    },
    close: async () => { await connection.end(); },
  };
  return { db, client };
}

// ── SQLite / LibSQL (default) ─────────────────────────────────────────────────
async function createSqliteDb() {
  const { createClient } = await import("@libsql/client");
  const { drizzle } = await import("drizzle-orm/libsql");
  const schema = await import("./schema");

  const url = dbUrl ? `file:${dbUrl}` : `file:${path.join(process.cwd(), "skills-vault.db")}`;
  const libsqlClient = createClient({ url });
  const db = drizzle(libsqlClient, { schema });

  // Wrap libsql client to normalize execute signature
  const client = {
    execute: async (input: ExecuteArg) => {
      if (typeof input === "string") {
        return libsqlClient.execute(input);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return libsqlClient.execute(input as any);
    },
    close: async () => { await libsqlClient.close(); },
  };
  return { db, client };
}

// ── Singleton ─────────────────────────────────────────────────────────────────
type DbClient = {
  execute: (input: ExecuteArg) => Promise<{ rows: Record<string, unknown>[] }>;
  close: () => Promise<void>;
};

let _instance: { db: unknown; client: DbClient } | null = null;

async function init() {
  if (_instance) return _instance;
  const result = isMysql ? await createMysqlDb() : await createSqliteDb();
  _instance = result as { db: unknown; client: DbClient };
  return _instance;
}

export const client: DbClient = {
  execute: async (input) => {
    const { client: c } = await init();
    return c.execute(input);
  },
  close: async () => {
    if (_instance) await _instance.client.close();
  },
};

export async function getDb() {
  const { db } = await init();
  return db;
}

// Eager init to avoid first-request latency
if (typeof process !== "undefined") init().catch(() => {});

import path from "path";

const dbUrl = process.env.DATABASE_URL ?? "";
const isMysql = dbUrl.startsWith("mysql://") || dbUrl.startsWith("mysql2://");

type ExecuteArg = string | { sql: string; args?: unknown[] };

export type DbTransactionClient = {
  execute: (input: ExecuteArg) => Promise<{ rows: Record<string, unknown>[] }>;
};

export type DbClient = DbTransactionClient & {
  close: () => Promise<void>;
  transaction: <T>(fn: (txClient: DbTransactionClient) => Promise<T>) => Promise<T>;
};

// ── MySQL (mysql2 + drizzle/mysql2) ──────────────────────────────────────────
async function createMysqlDb() {
  const mysql = await import("mysql2/promise");
  const { drizzle } = await import("drizzle-orm/mysql2");
  const schema = await import("./schema.mysql");

  const pool = mysql.createPool(dbUrl);
  const db = drizzle(pool, { schema, mode: "default" });

  const client = {
    execute: async (input: ExecuteArg) => {
      const sql = typeof input === "string" ? input : input.sql;
      const args = typeof input === "string" ? [] : (input.args ?? []);
      // mysql2 expects OkPacket or RowDataPacket[], cast appropriately
      const [rows] = await pool.execute(sql, args as (string | number | null)[]);
      return { rows: (Array.isArray(rows) ? rows : []) as Record<string, unknown>[] };
    },
    transaction: async <T>(fn: (txClient: DbTransactionClient) => Promise<T>) => {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        const result = await fn({
          execute: async (input) => {
            const sql = typeof input === "string" ? input : input.sql;
            const args = typeof input === "string" ? [] : (input.args ?? []);
            const [rows] = await connection.execute(sql, args as (string | number | null)[]);
            return { rows: (Array.isArray(rows) ? rows : []) as Record<string, unknown>[] };
          },
        });
        await connection.commit();
        return result;
      } catch (error) {
        await connection.rollback().catch(() => undefined);
        throw error;
      } finally {
        connection.release();
      }
    },
    close: async () => { await pool.end(); },
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
    transaction: async <T>(fn: (txClient: DbTransactionClient) => Promise<T>) => {
      const transaction = await libsqlClient.transaction("write");
      try {
        const result = await fn({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          execute: async (input) => transaction.execute(input as any),
        });
        await transaction.commit();
        return result;
      } catch (error) {
        await transaction.rollback().catch(() => undefined);
        throw error;
      }
    },
    close: async () => { await libsqlClient.close(); },
  };
  return { db, client };
}

// ── Singleton ─────────────────────────────────────────────────────────────────
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
    if (_instance) {
      await _instance.client.close();
      _instance = null;
    }
  },
  transaction: async (fn) => {
    const { client: c } = await init();
    return c.transaction(fn);
  },
};

export async function transaction<T>(fn: (txClient: DbTransactionClient) => Promise<T>): Promise<T> {
  return client.transaction(fn);
}

export async function getDb() {
  const { db } = await init();
  return db;
}

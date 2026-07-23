import { client } from "@/lib/db";
import { APP_ROLES, type AppRole, type AppUser } from "./types";

export * from "./types";

function rowToUser(row: Record<string, unknown>): AppUser {
  let roles: AppRole[] = [];
  try {
    const parsed = JSON.parse(String(row.roles ?? "[]"));
    if (Array.isArray(parsed)) roles = parsed.filter((r): r is AppRole => APP_ROLES.includes(r));
  } catch {
    roles = [];
  }
  return {
    id: String(row.id),
    username: String(row.username),
    fullName: String(row.full_name ?? ""),
    email: String(row.email ?? ""),
    active: Number(row.active) === 1,
    roles,
    lastLoginAt: Number(row.last_login_at ?? 0),
  };
}

// Upserts the local profile row for the signed-in Keycloak user. Roles are
// preserved across logins — only identity fields and last_login_at refresh.
export async function ensureUser(user: { id: string; username: string; email: string }): Promise<void> {
  const existing = await client.execute({
    sql: "SELECT id FROM users WHERE id = ?",
    args: [user.id],
  });

  const now = Math.floor(Date.now() / 1000);

  if (existing.rows.length === 0) {
    await client.execute({
      sql: `INSERT INTO users (id, username, full_name, email, roles, last_login_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, '[]', ?, ?, ?)`,
      args: [user.id, user.username, user.username, user.email, now, now, now],
    });
    return;
  }

  await client.execute({
    sql: `UPDATE users SET username = ?, full_name = ?, email = ?, last_login_at = ?, updated_at = ?
          WHERE id = ?`,
    args: [user.username, user.username, user.email, now, now, user.id],
  });
}

export async function listUsers(): Promise<AppUser[]> {
  const result = await client.execute("SELECT * FROM users ORDER BY username ASC");
  return result.rows.map((r) => rowToUser(r as Record<string, unknown>));
}

export async function setUserRoles(id: string, roles: AppRole[]): Promise<AppUser> {
  const validRoles = roles.filter((r) => APP_ROLES.includes(r));
  const now = Math.floor(Date.now() / 1000);
  await client.execute({
    sql: "UPDATE users SET roles = ?, updated_at = ? WHERE id = ?",
    args: [JSON.stringify(validRoles), now, id],
  });
  const result = await client.execute({
    sql: "SELECT * FROM users WHERE id = ?",
    args: [id],
  });
  if (result.rows.length === 0) throw new Error("User not found");
  return rowToUser(result.rows[0] as Record<string, unknown>);
}

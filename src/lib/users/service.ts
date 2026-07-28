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
    createdAt: Number(row.created_at ?? 0),
    updatedAt: Number(row.updated_at ?? 0),
  };
}

// Upserts the local profile row for the signed-in Keycloak user. Roles are
// updated/overwritten with current Keycloak roles on each login (intersected
// with APP_ROLES).
export async function ensureUser(user: { id: string; username: string; email: string; keycloakRoles?: string[] }): Promise<void> {
  const whereClauses = ["id = ?", "username = ?"];
  const args: unknown[] = [user.id, user.username];
  if (user.email && user.email.trim() !== "") {
    whereClauses.push("email = ?");
    args.push(user.email);
  }

  const existing = await client.execute({
    sql: `SELECT * FROM users WHERE ${whereClauses.join(" OR ")} ORDER BY last_login_at DESC`,
    args,
  });

  const now = Math.floor(Date.now() / 1000);
  const currentRoles = (user.keycloakRoles ?? []).filter((r): r is AppRole => APP_ROLES.includes(r as AppRole));

  if (existing.rows.length === 0) {
    await client.execute({
      sql: `INSERT INTO users (id, username, full_name, email, roles, last_login_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [user.id, user.username, user.username, user.email, JSON.stringify(currentRoles), now, now, now],
    });
    return;
  }

  // Prioritize the exact Keycloak ID match to avoid primary key unique constraint failures on update
  const primary = (existing.rows.find((r) => String(r.id) === user.id) || existing.rows[0]) as Record<string, unknown>;
  const primaryId = String(primary.id);

  if (primaryId !== user.id) {
    // Cascading updates for orphaned records before primary ID is mutated
    await client.execute({
      sql: "UPDATE skills SET author_id = ? WHERE author_id = ?",
      args: [user.id, primaryId],
    });
    await client.execute({
      sql: "UPDATE skill_review_requests SET author_id = ? WHERE author_id = ?",
      args: [user.id, primaryId],
    });
  }

  await client.execute({
    sql: `UPDATE users SET id = ?, username = ?, full_name = ?, email = ?, roles = ?, last_login_at = ?, updated_at = ?
          WHERE id = ?`,
    args: [user.id, user.username, user.username, user.email, JSON.stringify(currentRoles), now, now, primaryId],
  });

  if (existing.rows.length > 1) {
    // Delete any duplicates other than the primary row we updated
    const duplicateIds = existing.rows
      .map((r) => String(r.id))
      .filter((id) => id !== primaryId);
    if (duplicateIds.length > 0) {
      const placeholders = duplicateIds.map(() => "?").join(",");
      await client.execute({
        sql: `DELETE FROM users WHERE id IN (${placeholders})`,
        args: duplicateIds,
      });
    }
  }
}

export async function listUsers(): Promise<AppUser[]> {
  const result = await client.execute("SELECT * FROM users ORDER BY last_login_at DESC, username ASC");
  const seen = new Set<string>();
  const uniqueUsers: AppUser[] = [];

  for (const row of result.rows) {
    const user = rowToUser(row as Record<string, unknown>);
    const key = (user.username || user.email || user.id).toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueUsers.push(user);
    }
  }

  return uniqueUsers;
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

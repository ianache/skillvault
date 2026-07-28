export const SKILLVAULT_ROLES = [
  "user",
  "admin",
  "author",
  "editor",
  "reviewer",
] as const;

export type SkillVaultRole = typeof SKILLVAULT_ROLES[number];

const roleSet = new Set<string>(SKILLVAULT_ROLES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function roleArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((role): role is string => typeof role === "string")
    : [];
}

export function normalizeSkillVaultRoles(values: unknown): SkillVaultRole[] {
  const roles = roleArray(values)
    .map((r) => r.toLowerCase())
    .filter(
      (role): role is SkillVaultRole => roleSet.has(role),
    );
  const unique = [...new Set(roles)];
  return unique.length > 0 ? unique : ["user"];
}

export function getEffectiveSkillVaultRoles(
  profile: Record<string, unknown>,
  clientId?: string,
): SkillVaultRole[] {
  const resourceAccess = isRecord(profile.resource_access)
    ? profile.resource_access
    : {};
  const clientAccess = clientId && isRecord(resourceAccess[clientId])
    ? resourceAccess[clientId]
    : {};
  const clientRoles = roleArray(clientAccess.roles);
  const flatRoles = roleArray(profile.roles);

  return normalizeSkillVaultRoles([...clientRoles, ...flatRoles]);
}

export type JwtRoleInput = {
  userRoles?: unknown;
  profile?: Record<string, unknown> | null;
  tokenRoles?: unknown;
  clientId?: string;
};

export function resolveSkillVaultJwtRoles(input: JwtRoleInput): SkillVaultRole[] {
  if (Array.isArray(input.userRoles)) {
    return normalizeSkillVaultRoles(input.userRoles);
  }
  if (input.profile) {
    return getEffectiveSkillVaultRoles(input.profile, input.clientId);
  }
  return normalizeSkillVaultRoles(input.tokenRoles);
}

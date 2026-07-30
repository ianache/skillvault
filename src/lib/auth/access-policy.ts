import type { SkillVaultRole } from "./role-policy";

export type SkillVaultCapability =
  | "catalog:read"
  | "rating:write"
  | "content:manage"
  | "publish:create"
  | "review:manage"
  | "admin:manage";

const ROLE_CAPABILITIES: Record<SkillVaultRole, readonly SkillVaultCapability[]> = {
  user: ["catalog:read", "rating:write"],
  author: ["catalog:read", "rating:write", "content:manage"],
  editor: ["catalog:read", "rating:write", "content:manage", "publish:create"],
  reviewer: ["catalog:read", "rating:write", "content:manage", "review:manage"],
  admin: [
    "catalog:read",
    "rating:write",
    "content:manage",
    "publish:create",
    "review:manage",
    "admin:manage",
  ],
};

export function hasCapability(
  roles: readonly string[],
  capability: SkillVaultCapability,
): boolean {
  return roles.some((role) => {
    const capabilities = ROLE_CAPABILITIES[role as SkillVaultRole];
    return capabilities?.includes(capability) ?? false;
  });
}

export type PageRule =
  | { kind: "public" }
  | { kind: "protected"; capability: SkillVaultCapability };

export type PageDecision = "allow" | "signin" | "catalog";

function isPath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getPageRule(pathname: string): PageRule {
  if (pathname === "/" || /^\/skills\/[^/]+\/?$/.test(pathname)) {
    return { kind: "public" };
  }
  if (/^\/skills\/[^/]+\/edit(?:\/|$)/.test(pathname)) {
    return { kind: "protected", capability: "content:manage" };
  }
  if (isPath(pathname, "/publish")) {
    return { kind: "protected", capability: "publish:create" };
  }
  if (isPath(pathname, "/dashboard") || isPath(pathname, "/proposals")) {
    return { kind: "protected", capability: "content:manage" };
  }
  if (isPath(pathname, "/review")) {
    return { kind: "protected", capability: "review:manage" };
  }
  if (isPath(pathname, "/categories") || isPath(pathname, "/users")) {
    return { kind: "protected", capability: "admin:manage" };
  }
  if (isPath(pathname, "/agents")) {
    return { kind: "protected", capability: "content:manage" };
  }
  if (isPath(pathname, "/skills")) {
    return { kind: "protected", capability: "content:manage" };
  }
  return { kind: "public" };
}

export function decidePageAccess(
  pathname: string,
  authenticated: boolean,
  roles: readonly string[],
): PageDecision {
  const rule = getPageRule(pathname);
  if (rule.kind === "public") return "allow";
  if (!authenticated) return "signin";
  return hasCapability(roles, rule.capability) ? "allow" : "catalog";
}

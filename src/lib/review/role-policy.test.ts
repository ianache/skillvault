import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getEffectiveSkillVaultRoles,
  normalizeSkillVaultRoles,
  resolveSkillVaultJwtRoles,
} from "@/lib/auth/role-policy";

test("extracts recognized roles from the configured Keycloak client", () => {
  const roles = getEffectiveSkillVaultRoles({
    resource_access: {
      skillvault: { roles: ["editor", "reviewer", "unknown"] },
    },
  }, "skillvault");

  assert.deepEqual(roles, ["editor", "reviewer"]);
});

test("extracts recognized roles from the dedicated flat roles claim", () => {
  assert.deepEqual(
    getEffectiveSkillVaultRoles({ roles: ["admin", "admin", "offline_access"] }, "skillvault"),
    ["admin"],
  );
});

test("ignores realm roles even when they match SkillVault role names", () => {
  assert.deepEqual(
    getEffectiveSkillVaultRoles({
      realm_access: { roles: ["admin", "reviewer"] },
      resource_access: { skillvault: { roles: [] } },
    }, "skillvault"),
    ["user"],
  );
});

test("falls back to user for absent malformed or unknown client roles", () => {
  assert.deepEqual(getEffectiveSkillVaultRoles({}, "skillvault"), ["user"]);
  assert.deepEqual(getEffectiveSkillVaultRoles({ roles: "admin" }, "skillvault"), ["user"]);
  assert.deepEqual(
    getEffectiveSkillVaultRoles({
      resource_access: { skillvault: { roles: ["offline_access"] } },
    }, "skillvault"),
    ["user"],
  );
});

test("does not add user when a recognized role exists", () => {
  assert.deepEqual(normalizeSkillVaultRoles(["author"]), ["author"]);
  assert.deepEqual(normalizeSkillVaultRoles(["editor", "editor"]), ["editor"]);
});

test("resolves JWT roles from user profile or existing token in priority order", () => {
  assert.deepEqual(resolveSkillVaultJwtRoles({
    userRoles: ["editor"],
    profile: { roles: ["admin"] },
    tokenRoles: ["reviewer"],
    clientId: "skillvault",
  }), ["editor"]);

  assert.deepEqual(resolveSkillVaultJwtRoles({
    profile: { resource_access: { skillvault: { roles: ["reviewer"] } } },
    tokenRoles: ["admin"],
    clientId: "skillvault",
  }), ["reviewer"]);

  assert.deepEqual(resolveSkillVaultJwtRoles({
    tokenRoles: [],
    clientId: "skillvault",
  }), ["user"]);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const source = readFileSync(join(process.cwd(), "src", "auth.ts"), "utf8");

test("NextAuth uses the central role policy for profile JWT and session", () => {
  assert.match(source, /getEffectiveSkillVaultRoles/);
  assert.match(source, /resolveSkillVaultJwtRoles/);
  assert.match(
    source,
    /roles:\s*getEffectiveSkillVaultRoles\([^;]+AUTH_KEYCLOAK_ID[\s\S]*?\)/,
  );
  assert.match(
    source,
    /token\.roles\s*=\s*resolveSkillVaultJwtRoles\(/,
  );
  assert.match(
    source,
    /session\.user\.roles\s*=\s*normalizeSkillVaultRoles\(token\.roles\)/,
  );
  assert.doesNotMatch(source, /realm_access/);
});

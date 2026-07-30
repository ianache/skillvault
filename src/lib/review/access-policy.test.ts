import assert from "node:assert/strict";
import { test } from "node:test";
import {
  decidePageAccess,
  hasCapability,
} from "@/lib/auth/access-policy";

test("user can browse and rate but cannot manage content", () => {
  assert.equal(hasCapability(["user"], "catalog:read"), true);
  assert.equal(hasCapability(["user"], "rating:write"), true);
  assert.equal(hasCapability(["user"], "content:manage"), false);
  assert.equal(hasCapability(["user"], "publish:create"), false);
});

test("role capabilities match the approved access matrix", () => {
  assert.equal(hasCapability(["author"], "content:manage"), true);
  assert.equal(hasCapability(["author"], "publish:create"), false);
  assert.equal(hasCapability(["editor"], "publish:create"), true);
  assert.equal(hasCapability(["reviewer"], "review:manage"), true);
  assert.equal(hasCapability(["reviewer"], "admin:manage"), false);
  assert.equal(hasCapability(["admin"], "admin:manage"), true);
});

test("catalog and skill details are public", () => {
  assert.equal(decidePageAccess("/", false, []), "allow");
  assert.equal(decidePageAccess("/skills/demo-skill", false, []), "allow");
});

test("skill editing is distinct from public skill detail", () => {
  assert.equal(decidePageAccess("/skills/demo-skill/edit", false, []), "signin");
  assert.equal(decidePageAccess("/skills/demo-skill/edit", true, ["user"]), "catalog");
  assert.equal(decidePageAccess("/skills/demo-skill/edit", true, ["author"]), "allow");
});

test("authenticated user is returned to catalog from disallowed pages", () => {
  for (const pathname of [
    "/publish",
    "/dashboard",
    "/proposals",
    "/review",
    "/categories",
    "/users",
  ]) {
    assert.equal(decidePageAccess(pathname, true, ["user"]), "catalog", pathname);
  }
});

test("unauthenticated protected pages require sign in", () => {
  assert.equal(decidePageAccess("/publish", false, []), "signin");
  assert.equal(decidePageAccess("/review/12", false, []), "signin");
});

test("agents area requires content:manage, same tier as Mis Skills", () => {
  assert.equal(decidePageAccess("/agents", false, []), "signin");
  assert.equal(decidePageAccess("/agents", true, ["user"]), "catalog");
  assert.equal(decidePageAccess("/agents", true, ["author"]), "allow");
  assert.equal(decidePageAccess("/agents/create", true, ["user"]), "catalog");
  assert.equal(decidePageAccess("/agents/create", true, ["editor"]), "allow");
  assert.equal(decidePageAccess("/agents/chat/agent-1", true, ["user"]), "catalog");
  assert.equal(decidePageAccess("/agents/chat/agent-1", true, ["reviewer"]), "allow");
});

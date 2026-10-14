import assert from "node:assert/strict";
import { test } from "node:test";
import { getNavigationGroups } from "@/components/shell/navigation";

function hrefs(roles: string[]): string[] {
  return getNavigationGroups(roles).flatMap((group) =>
    group.items.map((item) => item.href)
  );
}

test("user navigation contains the public Skills and packages catalogs", () => {
  assert.deepEqual(hrefs(["user"]), ["/", "/packages/public"]);
});

test("editor navigation includes publishing and owned content", () => {
  assert.deepEqual(hrefs(["editor"]), [
    "/",
    "/packages/public",
    "/agents",
    "/publish",
    "/dashboard",
    "/proposals",
    "/packages",
  ]);
});

test("reviewer navigation includes review but not administration", () => {
  assert.deepEqual(hrefs(["reviewer"]), [
    "/",
    "/packages/public",
    "/agents",
    "/dashboard",
    "/proposals",
    "/review",
    "/packages",
  ]);
});

test("admin navigation includes every protected area", () => {
  assert.deepEqual(hrefs(["admin"]), [
    "/",
    "/packages/public",
    "/agents",
    "/publish",
    "/dashboard",
    "/proposals",
    "/review",
    "/categories",
    "/users",
    "/packages",
  ]);
});


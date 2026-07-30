import assert from "node:assert/strict";
import { test } from "node:test";
import { getNavigationGroups } from "@/components/shell/navigation";

function hrefs(roles: string[]): string[] {
  return getNavigationGroups(roles).flatMap((group) =>
    group.items.map((item) => item.href)
  );
}

test("user navigation contains only Catalog", () => {
  assert.deepEqual(hrefs(["user"]), ["/"]);
});

test("editor navigation includes publishing and owned content", () => {
  assert.deepEqual(hrefs(["editor"]), [
    "/",
    "/agents",
    "/publish",
    "/dashboard",
    "/proposals",
  ]);
});

test("reviewer navigation includes review but not administration", () => {
  assert.deepEqual(hrefs(["reviewer"]), [
    "/",
    "/agents",
    "/dashboard",
    "/proposals",
    "/review",
  ]);
});

test("admin navigation includes every protected area", () => {
  assert.deepEqual(hrefs(["admin"]), [
    "/",
    "/agents",
    "/publish",
    "/dashboard",
    "/proposals",
    "/review",
    "/categories",
    "/users",
  ]);
});


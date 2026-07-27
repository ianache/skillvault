import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const source = (path: string) => readFile(new URL(path, import.meta.url), "utf8");

test("users page guard delegates to central page access policy", async () => {
  const usersPage = await source("../../app/users/page.tsx");

  assert.match(usersPage, /decidePageAccess/);
  assert.match(usersPage, /redirect\("\/"\)/);
  assert.doesNotMatch(usersPage, /roles\?\.includes\("admin"\)/);
  assert.doesNotMatch(usersPage, /redirect\("\/unauthorized"\)/);
});

test("review page guards delegate reviewer authorization to review capability", async () => {
  const [reviewQueuePage, reviewDetailPage] = await Promise.all([
    source("../../app/review/page.tsx"),
    source("../../app/review/[id]/page.tsx"),
  ]);

  for (const page of [reviewQueuePage, reviewDetailPage]) {
    assert.match(page, /hasCapability/);
    assert.match(page, /"review:manage"/);
    assert.doesNotMatch(page, /roles\.includes\("reviewer"\)/);
    assert.doesNotMatch(page, /roles\.includes\("admin"\)/);
  }
});

import assert from "node:assert/strict";
import test from "node:test";

test("review dashboard routes export page components", async () => {
  const [queue, detail] = await Promise.all([
    import("@/app/dashboard/review/page"),
    import("@/app/dashboard/review/[id]/page"),
  ]);

  assert.equal(typeof queue.default, "function");
  assert.equal(typeof detail.default, "function");
});

test("proposal dashboard routes export page components", async () => {
  const [list, detail] = await Promise.all([
    import("@/app/dashboard/proposals/page"),
    import("@/app/dashboard/proposals/[id]/page"),
  ]);

  assert.equal(typeof list.default, "function");
  assert.equal(typeof detail.default, "function");
});

import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { canReview } from "./auth";

describe("canReview permission helper", () => {
  test("allows user with reviewer role", () => {
    assert.strictEqual(canReview({ id: "u1", roles: ["reviewer"] }), true);
  });

  test("allows user with admin role", () => {
    assert.strictEqual(canReview({ id: "u2", roles: ["admin"] }), true);
  });

  test("denies user with only editor role", () => {
    assert.strictEqual(canReview({ id: "u3", roles: ["editor"] }), false);
  });
});

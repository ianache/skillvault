import test from "node:test";
import assert from "node:assert/strict";
import { validateReviewFilePath } from "./files";

test("rejects absolute paths", () => {
  assert.throws(() => validateReviewFilePath("C:\\\\temp\\\\x.md"), /relative/);
  assert.throws(() => validateReviewFilePath("/tmp/x.md"), /relative/);
});

test("rejects traversal paths", () => {
  assert.throws(() => validateReviewFilePath("../secret.md"), /traversal/);
  assert.throws(() => validateReviewFilePath("docs/../../secret.md"), /traversal/);
});

test("accepts nested relative paths", () => {
  assert.equal(validateReviewFilePath("resources/reference.md"), "resources/reference.md");
});

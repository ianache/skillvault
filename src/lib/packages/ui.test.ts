import assert from "node:assert/strict";
import test from "node:test";
import { filterPackageSummaries, packageStatusLabel } from "./ui";

test("packageStatusLabel exposes the governed package states", () => {
  assert.equal(packageStatusLabel("draft"), "Borrador");
  assert.equal(packageStatusLabel("published"), "Publicado");
  assert.equal(packageStatusLabel("retired"), "Retirado");
});

test("filterPackageSummaries filters by text, role and status", () => {
  const packages = [
    { id: 1, slug: "qa-starter", name: "QA Starter", description: "QA", role: "QA", status: "published", currentVersion: "1.0.0" },
    { id: 2, slug: "data-kit", name: "Data Kit", description: "Data", role: "Data", status: "draft", currentVersion: null },
  ];

  assert.deepEqual(filterPackageSummaries(packages, { query: "qa", role: "QA", status: "published" }).map((item) => item.slug), ["qa-starter"]);
  assert.deepEqual(filterPackageSummaries(packages, { query: "", role: "Todos", status: "Todos" }).map((item) => item.slug), ["qa-starter", "data-kit"]);
});

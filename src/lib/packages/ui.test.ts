import assert from "node:assert/strict";
import test from "node:test";
import { filterPackageSummaries, formatPackageVersion, formatSkillCount, packageCardHref, packageStatusLabel, parsePackageStatus, retiredSkillsNote } from "./ui";

test("packageCardHref builds the maintenance and public routes from a valid slug", () => {
  assert.equal(packageCardHref("qa-starter", "maintenance"), "/packages/qa-starter");
  assert.equal(packageCardHref("qa-starter", "public-readonly"), "/packages/public/qa-starter");
});

test("packageCardHref returns null for an invalid slug so no link is rendered", () => {
  assert.equal(packageCardHref("../admin", "maintenance"), null);
  assert.equal(packageCardHref("a/b", "public-readonly"), null);
  assert.equal(packageCardHref("", "maintenance"), null);
  assert.equal(packageCardHref("Has Spaces", "maintenance"), null);
});

test("formatSkillCount handles singular, plural and missing counts", () => {
  assert.equal(formatSkillCount(1), "1 skill");
  assert.equal(formatSkillCount(8), "8 skills");
  assert.equal(formatSkillCount(0), "0 skills");
  assert.equal(formatSkillCount(undefined), null);
});

test("retiredSkillsNote only appears when there are retired skills (D-15)", () => {
  assert.equal(retiredSkillsNote(1), "1 skill retirado");
  assert.equal(retiredSkillsNote(3), "3 skills retirados");
  assert.equal(retiredSkillsNote(0), null);
  assert.equal(retiredSkillsNote(undefined), null);
});

test("formatPackageVersion falls back when the package has no published version", () => {
  assert.equal(formatPackageVersion("1.2.0"), "v1.2.0");
  assert.equal(formatPackageVersion(null), "Sin versión");
  assert.equal(formatPackageVersion(""), "Sin versión");
});

test("parsePackageStatus accepts only the three governed states", () => {
  assert.equal(parsePackageStatus("draft"), "draft");
  assert.equal(parsePackageStatus("published"), "published");
  assert.equal(parsePackageStatus("retired"), "retired");
});

test("parsePackageStatus returns null for an unknown status instead of passing it through", () => {
  assert.equal(parsePackageStatus("archived"), null);
  assert.equal(parsePackageStatus(""), null);
  assert.equal(parsePackageStatus("Published"), null);
});

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

import assert from "node:assert/strict";
import test from "node:test";
import { filterPackageSummaries, filterPublicPackageSummaries, formatDownloadCount, formatPackageVersion, formatRating, packageMetadataErrors, formatSkillCount, packageCardHref, packageStatusLabel, parsePackageStatus, retiredSkillsNote } from "./ui";

test("formatDownloadCount abbreviates thousands and millions like the approved design", () => {
  assert.equal(formatDownloadCount(14200), "14.2k descargas");
  assert.equal(formatDownloadCount(1000), "1k descargas");
  assert.equal(formatDownloadCount(950), "950 descargas");
  assert.equal(formatDownloadCount(1), "1 descarga");
  assert.equal(formatDownloadCount(1250000), "1.3M descargas");
});

test("formatDownloadCount returns null when there is no valid count", () => {
  assert.equal(formatDownloadCount(undefined), null);
  assert.equal(formatDownloadCount(-5), null);
  assert.equal(formatDownloadCount(Number.NaN), null);
});

test("formatRating shows one decimal with a star and rejects out-of-range values", () => {
  assert.equal(formatRating(4.9), "★ 4.9");
  assert.equal(formatRating(4), "★ 4.0");
  assert.equal(formatRating(undefined), null);
  assert.equal(formatRating(5.4), null);
  assert.equal(formatRating(-1), null);
});

test("locked is not a governed state (Q-13): it is rejected like any unknown status", () => {
  assert.equal(parsePackageStatus("locked"), null);
});

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

test("filterPublicPackageSummaries keeps only published packages and applies query and role", () => {
  const packages = [
    { id: 1, slug: "qa-starter", name: "QA Starter", description: "QA", role: "QA", status: "published", currentVersion: "1.0.0" },
    { id: 2, slug: "draft-kit", name: "Draft Kit", description: "QA", role: "QA", status: "draft", currentVersion: null },
  ];

  assert.deepEqual(filterPublicPackageSummaries(packages, { query: "qa", role: "QA" }).map((item) => item.slug), ["qa-starter"]);
});

test("packageMetadataErrors evaluates current editor values immediately", () => {
  assert.deepEqual(packageMetadataErrors({ name: "", description: "", role: "" }), {
    name: "El nombre del paquete es obligatorio.",
    description: "La descripción y propósito son obligatorios.",
    role: "Selecciona un rol destinatario.",
  });
  assert.deepEqual(packageMetadataErrors({ name: "QA", description: "Starter", role: "QA" }), {});
});

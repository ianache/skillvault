import type { ExcludedPackageItem, PackageItemManifest, PackageManifest } from "./types";

const PACKAGE_SLUG_RE = /^[a-z0-9][a-z0-9._-]*$/;
const SKILL_SLUG_RE = /^[a-z0-9][a-z0-9._-]*$/;
const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export function validatePackageSlug(slug: string): string {
  if (typeof slug !== "string" || !PACKAGE_SLUG_RE.test(slug) || slug.includes("..")) {
    throw new Error(`Invalid package slug: ${slug}`);
  }
  return slug;
}

export function validatePackageItem(item: PackageItemManifest): PackageItemManifest {
  if (!item || typeof item.slug !== "string" || !SKILL_SLUG_RE.test(item.slug) || item.slug.includes("..")) {
    throw new Error("Invalid package item slug");
  }
  if (item.versionPolicy !== "pinned" && item.versionPolicy !== "latest") {
    throw new Error("Invalid package item version policy");
  }
  if (item.versionPolicy === "pinned" && (!item.version || !SEMVER_RE.test(item.version))) {
    throw new Error("Pinned item requires a valid pinned version");
  }
  if (item.version && !SEMVER_RE.test(item.version)) throw new Error("Invalid package item version");
  if (item.files?.some((file) => !file.path || file.path.startsWith("/") || file.path.includes(".."))) {
    throw new Error("Package item contains an unsafe file path");
  }
  return item;
}

export function validatePublishedManifest(value: PackageManifest): PackageManifest {
  if (!value || typeof value !== "object") throw new Error("Invalid package manifest");
  validatePackageSlug(value.package);
  if (!SEMVER_RE.test(value.version)) throw new Error("Invalid package version");
  if (!Array.isArray(value.items) || !Array.isArray(value.excludedItems)) throw new Error("Invalid package manifest items");
  const items = value.items.map(validatePackageItem);
  const slugs = new Set<string>();
  for (const item of items) {
    if (slugs.has(item.slug)) throw new Error(`Duplicate package item: ${item.slug}`);
    slugs.add(item.slug);
  }
  const excludedItems: ExcludedPackageItem[] = value.excludedItems.map((item) => {
    if (!item || typeof item.slug !== "string" || typeof item.reason !== "string") throw new Error("Invalid excluded package item");
    validatePackageSlug(item.slug.replace(/^skill-/, "skill-"));
    return item;
  });
  return { ...value, items, excludedItems };
}

export function isSemver(value: string): boolean {
  return SEMVER_RE.test(value);
}

import type { PackageSummary } from "./types";
import { validatePackageSlug } from "./validation";

export type PackageFilters = { query: string; role: string; status: string };

export const PACKAGE_STATUSES = ["draft", "published", "retired"] as const;
export type PackageStatusValue = (typeof PACKAGE_STATUSES)[number];

/** Boundary guard: `PackageSummary.status` is a plain string; unknown values become null, never a silent fallback. */
export function parsePackageStatus(status: string): PackageStatusValue | null {
  return (PACKAGE_STATUSES as readonly string[]).includes(status) ? (status as PackageStatusValue) : null;
}

export type PackageCardVariant = "maintenance" | "public-readonly";

/** Route of the package detail, or null when the slug is not valid (the card then renders no link). */
export function packageCardHref(slug: string, variant: PackageCardVariant): string | null {
  try {
    const valid = validatePackageSlug(slug);
    return variant === "public-readonly" ? `/packages/public/${valid}` : `/packages/${valid}`;
  } catch {
    return null;
  }
}

export function formatSkillCount(count: number | undefined): string | null {
  if (count === undefined) return null;
  return `${count} ${count === 1 ? "skill" : "skills"}`;
}

/** D-15: the retired-skills warning is driven by `retiredSkillCount`. */
export function retiredSkillsNote(count: number | undefined): string | null {
  if (!count || count < 1) return null;
  return `${count} ${count === 1 ? "skill retirado" : "skills retirados"}`;
}

export function formatPackageVersion(version: string | null): string {
  return version ? `v${version}` : "Sin versión";
}

export function packageStatusLabel(status: string): string {
  return ({ draft: "Borrador", published: "Publicado", retired: "Retirado" } as Record<string, string>)[status] ?? status;
}

export function filterPackageSummaries(packages: PackageSummary[], filters: PackageFilters): PackageSummary[] {
  const query = filters.query.trim().toLowerCase();
  return packages.filter((item) => {
    const matchesQuery = !query || [item.name, item.slug, item.description, item.role].some((value) => value.toLowerCase().includes(query));
    const matchesRole = !filters.role || filters.role === "Todos" || item.role === filters.role;
    const matchesStatus = !filters.status || filters.status === "Todos" || item.status === filters.status;
    return matchesQuery && matchesRole && matchesStatus;
  });
}

export function packageWarning(manifest: { excludedItems?: unknown[] }): string | null {
  return manifest.excludedItems?.length ? "⚠️ Este paquete contiene Skills retirados; serán omitidos durante la instalación." : null;
}

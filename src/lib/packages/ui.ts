import type { PackageSummary } from "./types";

export type PackageFilters = { query: string; role: string; status: string };

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

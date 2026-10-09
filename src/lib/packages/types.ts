export type PackageVersionPolicy = "pinned" | "latest";

export type PackageItemManifest = {
  slug: string;
  versionPolicy: PackageVersionPolicy;
  version?: string;
  rawContent?: string;
  files?: Array<{ path: string; content: string; fileType?: string }>;
};

export type ExcludedPackageItem = { slug: string; reason: string };

export type PackageManifest = {
  package: string;
  version: string;
  generatedAt: string;
  items: PackageItemManifest[];
  excludedItems: ExcludedPackageItem[];
};

export type PackageActor = { id: string; handle?: string | null };

export type PackageDatabaseClient = {
  execute: (input: string | { sql: string; args?: unknown[] }) => Promise<{ rows: Record<string, unknown>[] }>;
};

export type PackageSummary = {
  id: number;
  slug: string;
  name: string;
  description: string;
  role: string;
  status: string;
  currentVersion: string | null;
  skillCount?: number;
  retiredSkillCount?: number;
  updatedAt?: number;
};

export type CreatePackageInput = {
  slug: string;
  name: string;
  description: string;
  role: string;
};

export type UpdatePackageInput = Partial<Omit<CreatePackageInput, "slug">>;

export type PackageVersionInput = {
  version: string;
  items: Array<{ skillId: number; versionPolicy: PackageVersionPolicy; pinnedVersion?: string; position: number }>;
};

export type PackageDraftVersion = {
  version: string;
  releaseStatus: "draft" | "published";
  items: Array<{ skillId: number; versionPolicy: PackageVersionPolicy; pinnedVersion?: string; position: number }>;
};

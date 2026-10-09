import { validatePackageSlug, validatePublishedManifest, isSemver } from "./validation";
import type {
  CreatePackageInput,
  PackageActor,
  PackageDatabaseClient,
  PackageDraftVersion,
  PackageManifest,
  PackageSummary,
  PackageVersionInput,
  UpdatePackageInput,
} from "./types";

function number(value: unknown): number { return Number(value ?? 0); }
function nullableString(value: unknown): string | null { return value == null ? null : String(value); }
function unixTimestamp(): number { return Math.floor(Date.now() / 1000); }

function toSummary(row: Record<string, unknown>): PackageSummary {
  return {
    id: number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description),
    role: String(row.role),
    status: String(row.status),
    currentVersion: nullableString(row.current_version ?? row.currentVersion),
    skillCount: number(row.skill_count ?? row.skillCount),
    retiredSkillCount: number(row.retired_skill_count ?? row.retiredSkillCount),
    updatedAt: number(row.updated_at ?? row.updatedAt),
  };
}

const packageSummarySelect = `SELECT p.*,
  COALESCE((SELECT COUNT(*) FROM package_items pi WHERE pi.package_version_id = (
    SELECT pv.id FROM package_versions pv WHERE pv.package_id = p.id ORDER BY pv.created_at DESC, pv.id DESC LIMIT 1
  )), 0) AS skill_count,
  COALESCE((SELECT COUNT(*) FROM package_items pi JOIN skills s ON s.id = pi.skill_id WHERE pi.package_version_id = (
    SELECT pv.id FROM package_versions pv WHERE pv.package_id = p.id ORDER BY pv.created_at DESC, pv.id DESC LIMIT 1
  ) AND s.status = 'retired'), 0) AS retired_skill_count
  FROM packages p`;

export async function createPackage(input: CreatePackageInput, actor: PackageActor, client: PackageDatabaseClient): Promise<PackageSummary> {
  validatePackageSlug(input.slug);
  if (!input.name.trim() || !input.description.trim() || !input.role.trim()) throw new Error("Package metadata is required");
  await client.execute({
    sql: `INSERT INTO packages (slug, name, description, role, status, created_by) VALUES (?, ?, ?, ?, 'draft', ?)`,
    args: [input.slug, input.name.trim(), input.description.trim(), input.role.trim(), actor.id],
  });
  const result = await client.execute({ sql: "SELECT * FROM packages WHERE slug = ?", args: [input.slug] });
  if (!result.rows[0]) throw new Error("Package was not created");
  return toSummary(result.rows[0]);
}

export async function listPackages(client: PackageDatabaseClient, publicOnly = false): Promise<PackageSummary[]> {
  const result = await client.execute({
    sql: publicOnly ? `${packageSummarySelect} WHERE p.status = 'published' ORDER BY p.name ASC` : `${packageSummarySelect} ORDER BY p.updated_at DESC, p.id DESC`,
  });
  return result.rows.map(toSummary);
}

export async function getPackage(slug: string, client: PackageDatabaseClient): Promise<PackageSummary> {
  validatePackageSlug(slug);
  const result = await client.execute({ sql: "SELECT * FROM packages WHERE slug = ?", args: [slug] });
  if (!result.rows[0]) throw new Error("Package not found");
  return toSummary(result.rows[0]);
}

export async function getDraftPackageVersion(slug: string, client: PackageDatabaseClient): Promise<PackageDraftVersion | null> {
  validatePackageSlug(slug);
  const versionResult = await client.execute({
    sql: `SELECT pv.id, pv.version, pv.release_status
          FROM packages p JOIN package_versions pv ON pv.package_id = p.id
          WHERE p.slug = ? AND pv.release_status = 'draft'
          ORDER BY pv.created_at DESC, pv.id DESC LIMIT 1`,
    args: [slug],
  });
  const version = versionResult.rows[0];
  if (!version) return null;
  const itemResult = await client.execute({
    sql: `SELECT skill_id, version_policy, pinned_version, position
          FROM package_items WHERE package_version_id = ? ORDER BY position ASC`,
    args: [number(version.id)],
  });
  return {
    version: String(version.version),
    releaseStatus: String(version.release_status) as PackageDraftVersion["releaseStatus"],
    items: itemResult.rows.map((item) => ({
      skillId: number(item.skill_id),
      versionPolicy: String(item.version_policy) as PackageDraftVersion["items"][number]["versionPolicy"],
      ...(item.pinned_version == null ? {} : { pinnedVersion: String(item.pinned_version) }),
      position: number(item.position),
    })),
  };
}

export async function getLatestPackageVersion(slug: string, client: PackageDatabaseClient): Promise<PackageDraftVersion | null> {
  validatePackageSlug(slug);
  const versionResult = await client.execute({
    sql: `SELECT pv.id, pv.version, pv.release_status
          FROM packages p JOIN package_versions pv ON pv.package_id = p.id
          WHERE p.slug = ?
          ORDER BY pv.created_at DESC, pv.id DESC LIMIT 1`,
    args: [slug],
  });
  const version = versionResult.rows[0];
  if (!version) return null;
  const itemResult = await client.execute({
    sql: `SELECT skill_id, version_policy, pinned_version, position
          FROM package_items WHERE package_version_id = ? ORDER BY position ASC`,
    args: [number(version.id)],
  });
  return {
    version: String(version.version),
    releaseStatus: String(version.release_status) as PackageDraftVersion["releaseStatus"],
    items: itemResult.rows.map((item) => ({
      skillId: number(item.skill_id),
      versionPolicy: String(item.version_policy) as PackageDraftVersion["items"][number]["versionPolicy"],
      ...(item.pinned_version == null ? {} : { pinnedVersion: String(item.pinned_version) }),
      position: number(item.position),
    })),
  };
}

export async function updatePackage(slug: string, input: UpdatePackageInput, _actor: PackageActor, client: PackageDatabaseClient): Promise<PackageSummary> {
  const current = await getPackage(slug, client);
  if (current.status !== "draft") throw new Error("Published packages are immutable");
  const name = input.name?.trim() || current.name;
  const description = input.description?.trim() || current.description;
  const role = input.role?.trim() || current.role;
  await client.execute({ sql: "UPDATE packages SET name = ?, description = ?, role = ?, updated_at = ? WHERE slug = ? AND status = 'draft'", args: [name, description, role, unixTimestamp(), slug] });
  return getPackage(slug, client);
}

export async function retirePackage(slug: string, _actor: PackageActor, client: PackageDatabaseClient): Promise<void> {
  const current = await getPackage(slug, client);
  if (current.status === "retired") return;
  await client.execute({ sql: "UPDATE packages SET status = 'retired', updated_at = ? WHERE slug = ?", args: [unixTimestamp(), slug] });
}

export async function duplicatePackage(slug: string, actor: PackageActor, client: PackageDatabaseClient): Promise<PackageSummary> {
  const source = await getPackage(slug, client);
  let copySlug = `${source.slug}-copy`;
  let suffix = 2;
  while ((await client.execute({ sql: "SELECT id FROM packages WHERE slug = ?", args: [copySlug] })).rows.length) copySlug = `${source.slug}-copy-${suffix++}`;
  await client.execute({ sql: "INSERT INTO packages (slug, name, description, role, status, created_by) VALUES (?, ?, ?, ?, 'draft', ?)", args: [copySlug, `${source.name} (copia)`, source.description, source.role, actor.id] });
  return { id: 0, slug: copySlug, name: `${source.name} (copia)`, description: source.description, role: source.role, status: "draft", currentVersion: null };
}

export async function createPackageVersion(slug: string, input: PackageVersionInput, actor: PackageActor, client: PackageDatabaseClient): Promise<PackageManifest> {
  validatePackageSlug(slug);
  if (!isSemver(input.version)) throw new Error("Invalid package version");
  const packageResult = await client.execute({ sql: "SELECT * FROM packages WHERE slug = ?", args: [slug] });
  const pkg = packageResult.rows[0];
  if (!pkg) throw new Error("Package not found");
  if (!Array.isArray(input.items) || input.items.length === 0) throw new Error("Package must contain at least one Skill");
  const manifestItems: PackageManifest["items"] = [];
  const existingVersionResult = await client.execute({
    sql: "SELECT id, release_status FROM package_versions WHERE package_id = ? AND version = ? LIMIT 1",
    args: [number(pkg.id), input.version],
  });
  const existingVersion = existingVersionResult.rows[0];
  let versionId: number;
  if (existingVersion) {
    if (String(existingVersion.release_status) !== "draft") throw new Error(`Package version ${input.version} already exists and is immutable`);
    versionId = number(existingVersion.id);
    await client.execute({ sql: "DELETE FROM package_items WHERE package_version_id = ?", args: [versionId] });
    await client.execute({ sql: "UPDATE package_versions SET manifest_json = ? WHERE id = ?", args: ["{}", versionId] });
  } else {
    await client.execute({
      sql: "INSERT INTO package_versions (package_id, version, release_status, manifest_json, created_by) VALUES (?, ?, 'draft', ?, ?)",
      args: [number(pkg.id), input.version, "{}", actor.id],
    });
    const versionResult = await client.execute({ sql: "SELECT id FROM package_versions WHERE package_id = ? AND version = ?", args: [number(pkg.id), input.version] });
    versionId = number(versionResult.rows[0]?.id);
  }
  for (const item of [...input.items].sort((a, b) => a.position - b.position)) {
    const skillResult = await client.execute({ sql: "SELECT * FROM skills WHERE id = ? AND status = 'published'", args: [item.skillId] });
    const skill = skillResult.rows[0];
    if (!skill) throw new Error(`Published Skill not found: ${item.skillId}`);
    if (item.versionPolicy === "pinned" && item.pinnedVersion !== String(skill.version)) throw new Error("Pinned Skill version is not published");
    const manifestItem = {
      slug: String(skill.slug),
      versionPolicy: item.versionPolicy,
      ...(item.versionPolicy === "pinned" ? { version: item.pinnedVersion } : {}),
      rawContent: String(skill.raw_content ?? ""),
    } as PackageManifest["items"][number];
    manifestItems.push(manifestItem);
    await client.execute({
      sql: `INSERT INTO package_items (package_version_id, skill_id, version_policy, pinned_version, position)
            VALUES (?, ?, ?, ?, ?)`,
      args: [versionId, item.skillId, item.versionPolicy, item.pinnedVersion ?? null, item.position],
    });
  }
  const manifest = validatePublishedManifest({ package: slug, version: input.version, generatedAt: new Date().toISOString(), items: manifestItems, excludedItems: [] });
  await client.execute({ sql: "UPDATE package_versions SET manifest_json = ? WHERE id = ?", args: [JSON.stringify(manifest), versionId] });
  return manifest;
}

export async function getPublishedManifest(slug: string, version: string | undefined, client: PackageDatabaseClient): Promise<PackageManifest> {
  validatePackageSlug(slug);
  const result = await client.execute({
    sql: `SELECT p.*, pv.* FROM packages p JOIN package_versions pv ON pv.package_id = p.id
          WHERE p.slug = ? AND pv.release_status = 'published' ${version ? "AND pv.version = ?" : ""}
          ORDER BY pv.published_at DESC, pv.id DESC LIMIT 1`,
    args: version ? [slug, version] : [slug],
  });
  const row = result.rows[0];
  if (!row) throw new Error("Published package version not found");
  if (String(row.release_status ?? "") !== "published") throw new Error("Package version is not published");
  const manifest = JSON.parse(String(row.manifest_json ?? "{}")) as PackageManifest;
  return validatePublishedManifest(manifest);
}

export async function getDraftManifest(slug: string, version: string, client: PackageDatabaseClient): Promise<PackageManifest> {
  validatePackageSlug(slug);
  const result = await client.execute({
    sql: `SELECT p.slug, pv.version, pv.release_status, pv.manifest_json
          FROM packages p JOIN package_versions pv ON pv.package_id = p.id
          WHERE p.slug = ? AND pv.version = ? AND pv.release_status = 'draft' LIMIT 1`,
    args: [slug, version],
  });
  const row = result.rows[0];
  if (!row) throw new Error("Draft package version not found");
  return validatePublishedManifest(JSON.parse(String(row.manifest_json ?? "{}")) as PackageManifest);
}

import { DEFAULT_SERVER } from "./config.js";

async function apiFetch(path, server = DEFAULT_SERVER) {
  const url = `${server}${path}`;
  const res = await fetch(url).catch((e) => {
    throw new Error(`No se puede conectar al servidor ${server}\n  ${e.message}\n  ¿Está corriendo el portal? (pnpm dev --port 3010)`);
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status} en ${url}`);
  }
  return res.json();
}

export async function getSkill(slug, server) {
  return apiFetch(`/api/skills/${encodeURIComponent(slug)}`, server);
}

export async function getSkillFiles(slug, server) {
  const data = await apiFetch(`/api/skills/${encodeURIComponent(slug)}/files`, server);
  return data.files ?? [];
}

export async function searchSkills(query, server) {
  const data = await apiFetch(`/api/skills?q=${encodeURIComponent(query)}&sort=popular`, server);
  return data.skills ?? [];
}

export async function listSkills(server) {
  const data = await apiFetch(`/api/skills?sort=popular`, server);
  return data.skills ?? [];
}

export async function recordInstall(slug, server) {
  const url = `${server}/api/skills/${encodeURIComponent(slug)}/install`;
  await fetch(url, { method: "POST" }).catch(() => {}); // best-effort
}

export async function getPackageManifest(slug, { format = "json", version = "latest" } = {}, server = DEFAULT_SERVER) {
  const url = `${server}/api/packages/${encodeURIComponent(slug)}/download?format=${encodeURIComponent(format)}&version=${encodeURIComponent(version)}`;
  const res = await fetch(url).catch((e) => { throw new Error(`No se puede conectar al servidor ${server}\n  ${e.message}`); });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status} en ${url}`);
  }
  if (format === "json") return res.json();
  const JSZip = (await import("jszip")).default;
  const archive = await JSZip.loadAsync(await res.arrayBuffer());
  const manifestFile = archive.file("manifest.json");
  if (!manifestFile) throw new Error("El ZIP del paquete no contiene manifest.json");
  return JSON.parse(await manifestFile.async("string"));
}

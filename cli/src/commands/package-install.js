import { access, mkdir, rm, writeFile } from "fs/promises";
import { dirname, resolve } from "path";
import { getPackageManifest } from "../api.js";
import { resolveSkillTarget, validateSkillSlug } from "../config.js";
import { fmt, printInfo, printSuccess, printWarn } from "../ui.js";

async function exists(path) { return access(path).then(() => true).catch(() => false); }

async function defaultConfirm(message) {
  const readline = await import("node:readline/promises");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try { return (await rl.question(`${message} [s/N] `)).trim().toLowerCase() === "s"; }
  finally { rl.close(); }
}

function safeAttachedPath(skillDir, path) {
  if (typeof path !== "string" || !path || path.startsWith("/") || path.includes("..") || path.includes("\\")) {
    throw new Error(`Attached file path is outside the skill directory: ${path}`);
  }
  return resolve(skillDir, path);
}

export async function installPackage(slug, options) {
  validateSkillSlug(slug);
  const { format = "json", version = "latest", harness, scope, server, force = false } = options;
  const confirm = options.confirm ?? defaultConfirm;
  printInfo(`Descargando paquete ${fmt.cyan(slug)} en formato ${format}...`);
  const manifest = await getPackageManifest(slug, { format, version }, server);
  if (!manifest || !Array.isArray(manifest.items)) throw new Error("Manifiesto de paquete inválido");
  if (manifest.excludedItems?.length) printWarn(`⚠️ El paquete contiene ${manifest.excludedItems.length} Skill(s) retirado(s); serán omitidos.`);

  const plan = [];
  const skipped = (manifest.excludedItems ?? []).map((item) => item.slug);
  for (const item of manifest.items) {
    validateSkillSlug(item.slug);
    if (item.compatibility && !item.compatibility.includes(harness)) {
      if (!await confirm(`⚠️ ${item.slug} no es compatible con ${harness}. ¿Continuar sin este Skill?`)) throw new Error(`Instalación abortada por incompatibilidad de ${item.slug}`);
      skipped.push(item.slug);
      continue;
    }
    const target = resolveSkillTarget(harness, scope, item.slug);
    const files = [
      { path: target.skillFile, content: item.rawContent ?? "", existed: await exists(target.skillFile) },
      ...(item.files ?? []).map((file) => ({ path: safeAttachedPath(target.skillDir, file.path), content: file.content, existed: false })),
    ];
    for (const file of files.slice(1)) file.existed = await exists(file.path);
    if (!force && files.some((file) => file.existed) && !await confirm(`Ya existen archivos para ${item.slug}. ¿Sobreescribirlos?`)) throw new Error(`Instalación abortada por conflicto en ${item.slug}`);
    plan.push({ item, files });
  }
  if (!await confirm(`Se instalarán ${plan.length} Skill(s) en el scope ${scope}. ¿Continuar?`)) throw new Error("Instalación abortada por el usuario");

  const written = [];
  try {
    for (const entry of plan) for (const file of entry.files) {
      await mkdir(dirname(file.path), { recursive: true });
      await writeFile(file.path, file.content, "utf8");
      written.push(file);
      printSuccess(`${entry.item.slug} -> ${fmt.gray(file.path)}`);
    }
  } catch (error) {
    let incomplete = false;
    for (const file of written.reverse()) {
      if (file.existed) { incomplete = true; continue; }
      try { await rm(file.path, { force: true }); } catch { incomplete = true; }
    }
    throw new Error(`Instalación fallida; rollback ${incomplete ? "incompleto" : "completo"}: ${error.message}`);
  }
  return { package: manifest.package, version: manifest.version, installed: plan.map(({ item }) => item.slug), skipped, status: "succeeded" };
}

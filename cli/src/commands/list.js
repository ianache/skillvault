import { access, readdir, readFile } from "fs/promises";
import { join } from "path";
import { resolveInstallDir, VALID_HARNESSES } from "../config.js";
import { fmt, printSeparator } from "../ui.js";

async function readFrontmatterField(filePath, field) {
  try {
    const content = await readFile(filePath, "utf8");
    const match = content.match(new RegExp(`^${field}:\\s*(.+)$`, "m"));
    return match?.[1]?.trim().replace(/^["']|["']$/g, "") ?? null;
  } catch {
    return null;
  }
}

async function countAttachments(skillDir) {
  return readdir(skillDir, { recursive: true, withFileTypes: true })
    .then((entries) => entries.filter((entry) => entry.isFile() && !entry.name.startsWith("SKILL.")).length)
    .catch(() => 0);
}

async function scanDir(dir, ext) {
  const exists = await access(dir).then(() => true).catch(() => false);
  if (!exists) return [];

  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const skills = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillDir = join(dir, entry.name);
      const skillFile = join(skillDir, `SKILL.${ext}`);
      const exists = await access(skillFile).then(() => true).catch(() => false);
      if (!exists) continue;

      const name = await readFrontmatterField(skillFile, "name") ?? entry.name;
      const version = await readFrontmatterField(skillFile, "version") ?? "?";
      const description = await readFrontmatterField(skillFile, "description") ?? "";
      skills.push({
        slug: entry.name,
        name,
        version,
        description,
        path: skillFile,
        hasDir: true,
        legacy: false,
        adjuntos: await countAttachments(skillDir),
      });
    } else if (entry.isFile() && entry.name.endsWith(`.${ext}`)) {
      const slug = entry.name.slice(0, -(ext.length + 1));
      const filePath = join(dir, entry.name);
      const name = await readFrontmatterField(filePath, "name") ?? slug;
      const version = await readFrontmatterField(filePath, "version") ?? "?";
      const description = await readFrontmatterField(filePath, "description") ?? "";
      skills.push({ slug, name, version, description, path: filePath, hasDir: false, legacy: true });
    }
  }

  return skills;
}

export async function list({ harness, scope, server: _server }) {
  console.log(`\n${fmt.bold("SkillVault")} · list\n`);

  const harnessesToScan = harness ? [harness] : VALID_HARNESSES;
  let totalFound = 0;

  for (const h of harnessesToScan) {
    const { dir, ext } = resolveInstallDir(h, scope);
    const skills = await scanDir(dir, ext);

    if (skills.length === 0) {
      if (harness) {
        console.log(fmt.dim(`No hay skills instalados en ${fmt.gray(dir)}`));
      }
      continue;
    }

    totalFound += skills.length;
    console.log(`${fmt.bold(fmt.yellow(h))}  ${fmt.gray(dir)}`);
    printSeparator();

    for (const skill of skills) {
      const adjInfo = skill.hasDir && skill.adjuntos > 0 ? fmt.gray(` +${skill.adjuntos} archivos`) : "";
      const legacyInfo = skill.legacy ? fmt.gray(" legacy") : "";
      console.log(`  ${fmt.bold(fmt.white(skill.name))} ${fmt.gray(`v${skill.version}`)}${adjInfo}${legacyInfo}`);
      if (skill.description) {
        console.log(`  ${fmt.dim(skill.description.slice(0, 70))}${skill.description.length > 70 ? "..." : ""}`);
      }
      console.log(`  ${fmt.gray(skill.path)}`);
      console.log();
    }
  }

  if (totalFound === 0) {
    console.log(fmt.dim("No hay skills instalados localmente."));
    console.log(fmt.dim(`Instala uno con: ${fmt.cyan("skillvault install <slug>")}`));
  } else {
    printSeparator();
    console.log(fmt.gray(`\n${totalFound} skill${totalFound > 1 ? "s" : ""} instalado${totalFound > 1 ? "s" : ""}.\n`));
  }
}

import { readdir, readFile, access } from "fs/promises";
import { join } from "path";
import { HARNESS_PATHS } from "../config.js";
import { fmt, printSeparator, printError } from "../ui.js";

async function readFrontmatterField(filePath, field) {
  try {
    const content = await readFile(filePath, "utf8");
    const match = content.match(new RegExp(`^${field}:\\s*(.+)$`, "m"));
    return match?.[1]?.trim().replace(/^["']|["']$/g, "") ?? null;
  } catch {
    return null;
  }
}

async function scanDir(dir, ext) {
  const exists = await access(dir).then(() => true).catch(() => false);
  if (!exists) return [];

  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const skills = [];

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(`.${ext}`)) {
      const slug = entry.name.slice(0, -(ext.length + 1));
      const filePath = join(dir, entry.name);
      const name = await readFrontmatterField(filePath, "name") ?? slug;
      const version = await readFrontmatterField(filePath, "version") ?? "?";
      const description = await readFrontmatterField(filePath, "description") ?? "";
      skills.push({ slug, name, version, description, path: filePath, hasDir: false });
    } else if (entry.isDirectory()) {
      // Check for SKILL.md inside subdirectory (skills with adjuntos)
      const skillFile = join(dir, entry.name, `SKILL.${ext}`);
      const exists = await access(skillFile).then(() => true).catch(() => false);
      if (exists) {
        const slug = entry.name;
        const name = await readFrontmatterField(skillFile, "name") ?? slug;
        const version = await readFrontmatterField(skillFile, "version") ?? "?";
        const description = await readFrontmatterField(skillFile, "description") ?? "";
        // Count adjuntos
        const adjuntos = await readdir(join(dir, entry.name), { recursive: true, withFileTypes: true })
          .then((es) => es.filter((e) => e.isFile() && !e.name.startsWith("SKILL.")).length)
          .catch(() => 0);
        skills.push({ slug, name, version, description, path: skillFile, hasDir: true, adjuntos });
      }
    }
  }

  return skills;
}

export async function list({ harness, scope, server: _server }) {
  console.log(`\n${fmt.bold("SkillVault")} · list\n`);

  const harnessesToScan = harness ? [harness] : Object.keys(HARNESS_PATHS);
  let totalFound = 0;

  for (const h of harnessesToScan) {
    const hConfig = HARNESS_PATHS[h];
    const dir = scope === "local" ? hConfig.local : hConfig.global;
    const ext = hConfig.ext;

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

    for (const s of skills) {
      const adjInfo = s.hasDir && s.adjuntos > 0 ? fmt.gray(` +${s.adjuntos} archivos`) : "";
      console.log(
        `  ${fmt.bold(fmt.white(s.name))} ${fmt.gray(`v${s.version}`)}${adjInfo}`
      );
      if (s.description) {
        console.log(`  ${fmt.dim(s.description.slice(0, 70))}${s.description.length > 70 ? "…" : ""}`);
      }
      console.log(`  ${fmt.gray(s.path)}`);
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

import { access, rm } from "fs/promises";
import { join } from "path";
import { resolveInstallDir, validateSkillSlug } from "../config.js";
import { fmt, printSuccess, printWarn } from "../ui.js";

export async function remove(slug, { harness, scope }) {
  console.log(`\n${fmt.bold("SkillVault")} · remove\n`);
  validateSkillSlug(slug);

  const { dir, ext } = resolveInstallDir(harness, scope);
  const subDir = join(dir, slug);
  const skillFile = join(subDir, `SKILL.${ext}`);
  const singleFile = join(dir, `${slug}.${ext}`);

  const hasSub = await access(skillFile).then(() => true).catch(() => false);
  const hasSingle = await access(singleFile).then(() => true).catch(() => false);

  if (!hasSub && !hasSingle) {
    printWarn(`El skill ${fmt.cyan(slug)} no está instalado en ${fmt.gray(dir)}`);
    printWarn(`Harness: ${harness}  Scope: ${scope}`);
    process.exit(0);
  }

  if (hasSub) {
    await rm(subDir, { recursive: true, force: true });
    printSuccess(`Eliminado directorio ${fmt.gray(subDir)}`);
  }

  if (hasSingle) {
    await rm(singleFile, { force: true });
    printSuccess(`Eliminado ${fmt.gray(singleFile)}`);
  }

  console.log();
  console.log(fmt.dim(`Skill ${fmt.cyan(slug)} eliminado de ${harness} (${scope}).`));
  console.log();
}

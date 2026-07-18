import { mkdir, writeFile, access } from "fs/promises";
import { join, dirname } from "path";
import { getSkill, getSkillFiles, recordInstall } from "../api.js";
import { resolveInstallDir } from "../config.js";
import { fmt, printSuccess, printInfo, printWarn, printError } from "../ui.js";

export async function install(slug, { harness, scope, server, force }) {
  console.log(`\n${fmt.bold("SkillVault")} · install\n`);
  printInfo(`Buscando ${fmt.cyan(slug)} en ${server}…`);

  // 1. Fetch skill metadata + content
  let skill;
  try {
    skill = await getSkill(slug, server);
  } catch (e) {
    printError(e.message);
    process.exit(1);
  }

  if (!skill.rawContent) {
    printError(`El skill ${fmt.cyan(slug)} no tiene contenido SKILL.md en el portal.`);
    process.exit(1);
  }

  // 2. Resolve install path
  const { dir, ext } = resolveInstallDir(harness, scope);

  // Skills with adjuntos → install in a subdirectory
  // Skills without adjuntos → install as single file for backward compatibility
  let files;
  try {
    files = await getSkillFiles(slug, server);
  } catch {
    files = [];
  }

  const hasFiles = files.length > 0;
  // Always install into <dir>/<slug>/SKILL.<ext> — Claude Code requires the directory structure
  const skillDir  = join(dir, slug);
  const skillFile = join(skillDir, `SKILL.${ext}`);

  // 3. Check if already installed
  const alreadyExists = await access(skillFile).then(() => true).catch(() => false);
  if (alreadyExists && !force) {
    printWarn(`Ya instalado en ${fmt.gray(skillFile)}`);
    printWarn(`Usa ${fmt.cyan("--force")} para sobreescribir.`);
    process.exit(0);
  }

  // 4. Write SKILL.md
  await mkdir(dirname(skillFile), { recursive: true });
  await writeFile(skillFile, skill.rawContent, "utf8");
  printSuccess(`SKILL.md → ${fmt.gray(skillFile)}`);

  // 5. Write attached files
  if (hasFiles) {
    for (const f of files) {
      const destPath = join(skillDir, f.path);
      await mkdir(dirname(destPath), { recursive: true });
      await writeFile(destPath, f.content, "utf8");
      const icon = f.fileType === "script" ? "⚡" : "📄";
      printSuccess(`${icon} ${f.path} → ${fmt.gray(destPath)}`);
    }
  }

  // 6. Record install in portal (best-effort)
  await recordInstall(slug, server);

  // 7. Summary
  console.log();
  console.log(fmt.bold("Instalado:"));
  console.log(`  Skill    ${fmt.cyan(skill.name)}  ${fmt.gray(`v${skill.version}`)}`);
  console.log(`  Harness  ${fmt.yellow(harness)}`);
  console.log(`  Scope    ${scope}`);
  console.log(`  Ruta     ${fmt.gray(skillFile)}`);
  if (hasFiles) {
    console.log(`  Archivos ${files.length} adjunto${files.length > 1 ? "s" : ""}`);
  }

  console.log();
  console.log(fmt.bold("Invocar en Claude Code:"));
  console.log(`  ${fmt.cyan(`Skill({ skill: "${slug}" })`)}`);
  if (skill.triggers?.length) {
    console.log(`  ${fmt.dim("o simplemente escribe:")} ${fmt.cyan(skill.triggers[0])}`);
  }
  console.log();
}

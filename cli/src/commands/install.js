import { access, mkdir, writeFile } from "fs/promises";
import { dirname, isAbsolute, relative, resolve } from "path";
import { getSkill, getSkillFiles, recordInstall } from "../api.js";
import { resolveSkillTarget, validateSkillSlug } from "../config.js";
import { fmt, printError, printInfo, printSuccess, printWarn } from "../ui.js";

function resolveAttachedFile(skillDir, filePath) {
  if (typeof filePath !== "string" || filePath.length === 0 || isAbsolute(filePath)) {
    throw new Error(`Attached file path is outside the skill directory: ${filePath}`);
  }

  const skillRoot = resolve(skillDir);
  const destPath = resolve(skillRoot, filePath);
  const relativePath = relative(skillRoot, destPath);
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error(`Attached file path is outside the skill directory: ${filePath}`);
  }

  return destPath;
}

export async function install(slug, { harness, scope, server, force }) {
  console.log(`\n${fmt.bold("SkillVault")} · install\n`);
  validateSkillSlug(slug);
  printInfo(`Buscando ${fmt.cyan(slug)} en ${server}...`);

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

  const { skillDir, skillFile } = resolveSkillTarget(harness, scope, slug);

  let files;
  try {
    files = await getSkillFiles(slug, server);
  } catch {
    files = [];
  }

  const attachedFiles = files.map((file) => ({
    ...file,
    destPath: resolveAttachedFile(skillDir, file.path),
  }));

  const alreadyExists = await access(skillFile).then(() => true).catch(() => false);
  if (alreadyExists && !force) {
    printWarn(`Ya instalado en ${fmt.gray(skillFile)}`);
    printWarn(`Usa ${fmt.cyan("--force")} para sobreescribir.`);
    process.exit(0);
  }

  await mkdir(dirname(skillFile), { recursive: true });
  await writeFile(skillFile, skill.rawContent, "utf8");
  printSuccess(`SKILL.md -> ${fmt.gray(skillFile)}`);

  for (const file of attachedFiles) {
    await mkdir(dirname(file.destPath), { recursive: true });
    await writeFile(file.destPath, file.content, "utf8");
    const icon = file.fileType === "script" ? "*" : "-";
    printSuccess(`${icon} ${file.path} -> ${fmt.gray(file.destPath)}`);
  }

  await recordInstall(slug, server);

  console.log();
  console.log(fmt.bold("Instalado:"));
  console.log(`  Skill    ${fmt.cyan(skill.name)}  ${fmt.gray(`v${skill.version}`)}`);
  console.log(`  Harness  ${fmt.yellow(harness)}`);
  console.log(`  Scope    ${scope}`);
  console.log(`  Ruta     ${fmt.gray(skillFile)}`);
  if (attachedFiles.length > 0) {
    console.log(`  Archivos ${attachedFiles.length} adjunto${attachedFiles.length > 1 ? "s" : ""}`);
  }

  console.log();
  console.log(fmt.bold("Invocar en Claude Code:"));
  console.log(`  ${fmt.cyan(`Skill({ skill: "${slug}" })`)}`);
  if (skill.triggers?.length) {
    console.log(`  ${fmt.dim("o simplemente escribe:")} ${fmt.cyan(skill.triggers[0])}`);
  }
  console.log();
}

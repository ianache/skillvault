import { homedir } from "os";
import { join } from "path";

export const DEFAULT_SERVER = "http://localhost:3010";

// Install paths per harness + scope.
export const HARNESS_PATHS = {
  claude: { global: join(homedir(), ".claude", "skills"), local: join(".claude", "skills"), ext: "md" },
  codex: { global: join(homedir(), ".codex", "skills"), local: join(".codex", "skills"), ext: "md" },
  opencode: { global: join(homedir(), ".opencode", "skills"), local: join(".opencode", "skills"), ext: "md" },
  agy: { global: join(homedir(), ".agy", "skills"), local: join(".agy", "skills"), ext: "md" },
  cursor: { global: join(homedir(), ".cursor", "rules"), local: join(".cursor", "rules"), ext: "mdc" },
};

export const VALID_HARNESSES = Object.keys(HARNESS_PATHS);

const SKILL_SLUG_RE = /^[a-z0-9][a-z0-9._-]*$/;

export function validateSkillSlug(slug) {
  if (typeof slug !== "string" || slug.length === 0) {
    throw new Error("Skill slug must be a non-empty string.");
  }
  if (slug.includes("/") || slug.includes("\\") || slug === "." || slug === ".." || slug.includes("..")) {
    throw new Error(`Skill slug must be a single path segment: ${slug}`);
  }
  if (!SKILL_SLUG_RE.test(slug)) {
    throw new Error(`Skill slug contains unsupported characters: ${slug}`);
  }
}

export function resolveInstallDir(harness, scope, env = process.env) {
  const h = HARNESS_PATHS[harness];
  if (!h) {
    throw new Error(`Harness desconocido: ${harness}. Válidos: ${VALID_HARNESSES.join(", ")}`);
  }
  if (harness === "codex" && scope !== "local" && env.CODEX_HOME) {
    return { dir: join(env.CODEX_HOME, "skills"), ext: h.ext };
  }
  return { dir: h[scope] ?? h.global, ext: h.ext };
}

export function resolveSkillTarget(harness, scope, slug, env = process.env) {
  validateSkillSlug(slug);
  const { dir, ext } = resolveInstallDir(harness, scope, env);
  const skillDir = join(dir, slug);
  return {
    rootDir: dir,
    skillDir,
    skillFile: join(skillDir, `SKILL.${ext}`),
    ext,
  };
}

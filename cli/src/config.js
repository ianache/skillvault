import { homedir } from "os";
import { join } from "path";

export const DEFAULT_SERVER = "http://localhost:3010";

// Install paths per harness + scope
export const HARNESS_PATHS = {
  claude:   { global: join(homedir(), ".claude",   "skills"), local: join(".claude",   "skills"), ext: "md" },
  codex:    { global: join(homedir(), ".codex",    "skills"), local: join(".codex",    "skills"), ext: "md" },
  opencode: { global: join(homedir(), ".opencode", "skills"), local: join(".opencode", "skills"), ext: "md" },
  agy:      { global: join(homedir(), ".agy",      "skills"), local: join(".agy",      "skills"), ext: "md" },
  cursor:   { global: join(homedir(), ".cursor",   "rules"),  local: join(".cursor",   "rules"),  ext: "mdc" },
};

export const VALID_HARNESSES = Object.keys(HARNESS_PATHS);

export function resolveInstallDir(harness, scope) {
  const h = HARNESS_PATHS[harness];
  if (!h) throw new Error(`Harness desconocido: ${harness}. Válidos: ${VALID_HARNESSES.join(", ")}`);
  return { dir: h[scope] ?? h.global, ext: h.ext };
}

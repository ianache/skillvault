// Terminal color/format helpers — no external deps
const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  blue:   "\x1b[34m",
  cyan:   "\x1b[36m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  red:    "\x1b[31m",
  gray:   "\x1b[90m",
  white:  "\x1b[97m",
};

export const fmt = {
  bold:   (s) => `${C.bold}${s}${C.reset}`,
  dim:    (s) => `${C.dim}${s}${C.reset}`,
  blue:   (s) => `${C.blue}${s}${C.reset}`,
  cyan:   (s) => `${C.cyan}${s}${C.reset}`,
  green:  (s) => `${C.green}${s}${C.reset}`,
  yellow: (s) => `${C.yellow}${s}${C.reset}`,
  red:    (s) => `${C.red}${s}${C.reset}`,
  gray:   (s) => `${C.gray}${s}${C.reset}`,
  white:  (s) => `${C.white}${s}${C.reset}`,
};

export function printSkillCard(skill, index) {
  const TYPE_COLORS = {
    code: fmt.blue, docs: fmt.green, data: fmt.cyan,
    ui: (s) => `\x1b[35m${s}${C.reset}`, // magenta
    infra: fmt.yellow, ai: fmt.red,
  };
  const colorize = TYPE_COLORS[skill.type] ?? fmt.white;

  const prefix = index != null ? `${fmt.gray(`${String(index + 1).padStart(2)}.`)} ` : "   ";
  const badge = `[${skill.type}]`.padEnd(8);

  console.log(
    `${prefix}${fmt.bold(fmt.white(skill.name))} ${fmt.gray(`v${skill.version}`)}  ${colorize(badge)}  ${fmt.gray(`↓${skill.installCount}`)}`
  );
  console.log(`     ${fmt.dim(skill.description.slice(0, 72))}${skill.description.length > 72 ? "…" : ""}`);

  if (skill.triggers?.length) {
    const t = skill.triggers.slice(0, 3).map((t) => fmt.cyan(t)).join("  ");
    console.log(`     ${t}`);
  }
}

export function printSeparator() {
  console.log(fmt.gray("─".repeat(60)));
}

export function printSuccess(msg) {
  console.log(`${fmt.green("✓")} ${msg}`);
}

export function printError(msg) {
  console.error(`${fmt.red("✗")} ${msg}`);
}

export function printInfo(msg) {
  console.log(`${fmt.blue("·")} ${msg}`);
}

export function printWarn(msg) {
  console.log(`${fmt.yellow("!")} ${msg}`);
}

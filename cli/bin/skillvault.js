#!/usr/bin/env node
import { install } from "../src/commands/install.js";
import { search }  from "../src/commands/search.js";
import { list }    from "../src/commands/list.js";
import { remove }  from "../src/commands/remove.js";
import { DEFAULT_SERVER, VALID_HARNESSES } from "../src/config.js";
import { fmt, printError } from "../src/ui.js";

const HELP = `
${fmt.bold("skillvault")} — CLI para SkillVault portal de skills

${fmt.bold("USO")}
  skillvault <comando> [argumentos] [flags]

${fmt.bold("COMANDOS")}
  install <slug>    Instala un skill desde el portal
  search  <query>   Busca skills en el portal
  list              Lista skills instalados localmente
  remove  <slug>    Elimina un skill instalado

${fmt.bold("FLAGS GLOBALES")}
  --harness <name>  Harness destino: ${VALID_HARNESSES.join(", ")}  (default: claude)
  --scope <scope>   global | local                                 (default: global)
  --server <url>    URL del portal                                 (default: ${DEFAULT_SERVER})
  --force           Sobreescribir si ya está instalado

${fmt.bold("EJEMPLOS")}
  skillvault install db-migrate --harness claude --scope global
  skillvault install graphify   --harness claude --scope global --force
  skillvault search "database migration"
  skillvault list --harness claude
  skillvault remove db-migrate  --harness claude --scope global
`;

function parseArgs(argv) {
  const args = argv.slice(2); // drop node + script path
  const flags = {
    harness: "claude",
    scope:   "global",
    server:  DEFAULT_SERVER,
    force:   false,
  };
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--harness") { flags.harness = args[++i]; }
    else if (a === "--scope")   { flags.scope   = args[++i]; }
    else if (a === "--server")  { flags.server  = args[++i]; }
    else if (a === "--force")   { flags.force   = true; }
    else if (a === "--help" || a === "-h") { flags.help = true; }
    else if (!a.startsWith("--")) { positional.push(a); }
  }

  return { positional, flags };
}

function validateHarness(harness) {
  if (!VALID_HARNESSES.includes(harness)) {
    printError(`Harness desconocido: ${fmt.cyan(harness)}`);
    console.error(`  Válidos: ${VALID_HARNESSES.join(", ")}`);
    process.exit(1);
  }
}

function validateScope(scope) {
  if (scope !== "global" && scope !== "local") {
    printError(`Scope inválido: ${fmt.cyan(scope)}. Usar "global" o "local".`);
    process.exit(1);
  }
}

async function main() {
  const { positional, flags } = parseArgs(process.argv);

  if (flags.help || positional.length === 0) {
    console.log(HELP);
    process.exit(0);
  }

  const [command, ...rest] = positional;

  validateHarness(flags.harness);
  validateScope(flags.scope);

  switch (command) {
    case "install": {
      const slug = rest[0];
      if (!slug) {
        printError("Falta el slug del skill. Uso: skillvault install <slug>");
        process.exit(1);
      }
      await install(slug, flags);
      break;
    }
    case "search": {
      const query = rest.join(" ");
      if (!query) {
        printError("Falta el término de búsqueda. Uso: skillvault search <query>");
        process.exit(1);
      }
      await search(query, flags);
      break;
    }
    case "list": {
      await list(flags);
      break;
    }
    case "remove": {
      const slug = rest[0];
      if (!slug) {
        printError("Falta el slug del skill. Uso: skillvault remove <slug>");
        process.exit(1);
      }
      await remove(slug, flags);
      break;
    }
    default:
      printError(`Comando desconocido: ${fmt.cyan(command)}`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((e) => {
  printError(e.message);
  process.exit(1);
});

import { searchSkills } from "../api.js";
import { fmt, printSkillCard, printSeparator, printError } from "../ui.js";

export async function search(query, { server }) {
  console.log(`\n${fmt.bold("SkillVault")} · search  ${fmt.gray(`"${query}"`)}\n`);

  let skills;
  try {
    skills = await searchSkills(query, server);
  } catch (e) {
    printError(e.message);
    process.exit(1);
  }

  if (skills.length === 0) {
    console.log(fmt.dim(`Sin resultados para "${query}".`));
    console.log(fmt.dim(`Prueba con otro término o visita ${server}`));
    return;
  }

  console.log(fmt.gray(`${skills.length} resultado${skills.length > 1 ? "s" : ""}:\n`));
  printSeparator();

  for (let i = 0; i < skills.length; i++) {
    printSkillCard(skills[i], i);
    if (i < skills.length - 1) console.log();
  }

  printSeparator();
  console.log();
  console.log(fmt.dim(`Instalar un skill:`));
  console.log(`  ${fmt.cyan(`skillvault install <slug> --harness claude --scope global`)}`);
  console.log();
}

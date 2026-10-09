import { client } from "./index";
import { migratePackages } from "./package-migration";

async function migrate() {
  await migratePackages(client, "mysql");
  console.log("Package MySQL migration complete.");
  await client.close();
}

migrate().catch(async (error) => {
  console.error(error);
  await client.close();
  process.exit(1);
});

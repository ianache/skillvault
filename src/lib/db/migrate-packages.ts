import { client } from "./index";
import { migratePackages } from "./package-migration";

async function migrate() {
  await migratePackages(client, "sqlite");
  console.log("Package SQLite migration complete.");
  await client.close();
}

migrate().catch(async (error) => {
  console.error(error);
  await client.close();
  process.exit(1);
});

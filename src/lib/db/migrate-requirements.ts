import { client } from "./index";

async function migrate() {
  console.log("🔧 Running config_requirements migration...");

  // Add config_requirements column to skills table (idempotent)
  try {
    await client.execute(
      `ALTER TABLE skills ADD COLUMN config_requirements TEXT NOT NULL DEFAULT '[]'`
    );
    console.log("✓ Added config_requirements column to skills.");
  } catch {
    console.log("✓ config_requirements column already exists. Skipping.");
  }

  await client.close();
}

migrate().catch(console.error);

import { client } from "../src/lib/db";

async function run() {
  try {
    const { rows } = await client.execute("SELECT slug, name, type FROM skills WHERE slug = 'informe-mensual-horas-proyecto'");
    console.log("Matching skills:", rows);
  } catch (error) {
    console.error("Error executing query:", error);
  } finally {
    await client.close();
  }
}

run();

import { client } from "./index";

async function run() {
  console.log("🌱 Saneando e integrando IDs de autor en Skills y Solicitudes...");
  
  const usersRes = await client.execute("SELECT id, username FROM users");
  const users = usersRes.rows;

  for (const user of users) {
    const userId = String(user.id);
    const username = String(user.username);

    // Actualizar skills donde el author_handle coincide con el username, pero el author_id está huérfano o es diferente
    const skillsRes = await client.execute({
      sql: "UPDATE skills SET author_id = ? WHERE author_handle = ? AND (author_id IS NULL OR author_id != ?)",
      args: [userId, username, userId],
    });

    const requestsRes = await client.execute({
      sql: "UPDATE skill_review_requests SET author_id = ? WHERE author_handle = ? AND (author_id IS NULL OR author_id != ?)",
      args: [userId, username, userId],
    });

    console.log(`✓ Reasociados registros para handle "${username}" al ID "${userId}"`);
  }
}

run()
  .then(async () => {
    await client.close();
    console.log("✓ Saneamiento de base de datos completado con éxito.");
    process.exit(0);
  })
  .catch(async (e) => {
    await client.close().catch(() => {});
    console.error("❌ Error durante el saneamiento:", e);
    process.exit(1);
  });

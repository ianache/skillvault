import { client } from "./index";

async function run() {
  console.log("🌱 Saneando e integrando IDs de autor en base de datos de manera altamente optimizada...");

  // 1. Saneamiento de skills por author_handle
  console.log("- Actualizando skills...");
  await client.execute(`
    UPDATE skills
    SET author_id = (SELECT id FROM users WHERE users.username = skills.author_handle)
    WHERE author_handle IN (SELECT username FROM users)
      AND (author_id IS NULL OR author_id != (SELECT id FROM users WHERE users.username = skills.author_handle))
  `);

  // 2. Saneamiento de solicitudes de revisión por author_handle
  console.log("- Actualizando solicitudes de revisión (autor)...");
  await client.execute(`
    UPDATE skill_review_requests
    SET author_id = (SELECT id FROM users WHERE users.username = skill_review_requests.author_handle)
    WHERE author_handle IN (SELECT username FROM users)
      AND (author_id IS NULL OR author_id != (SELECT id FROM users WHERE users.username = skill_review_requests.author_handle))
  `);

  // 3. Saneamiento de solicitudes de revisión por reviewer_handle
  console.log("- Actualizando solicitudes de revisión (revisor)...");
  await client.execute(`
    UPDATE skill_review_requests
    SET reviewer_id = (SELECT id FROM users WHERE users.username = skill_review_requests.reviewer_handle)
    WHERE reviewer_handle IN (SELECT username FROM users)
      AND (reviewer_id IS NULL OR reviewer_id != (SELECT id FROM users WHERE users.username = skill_review_requests.reviewer_handle))
  `);

  // 4. Saneamiento de comentarios de revisión por author_handle
  console.log("- Actualizando comentarios de revisión (autor)...");
  await client.execute(`
    UPDATE skill_review_comments
    SET author_id = (SELECT id FROM users WHERE users.username = skill_review_comments.author_handle)
    WHERE author_handle IN (SELECT username FROM users)
      AND (author_id IS NULL OR author_id != (SELECT id FROM users WHERE users.username = skill_review_comments.author_handle))
  `);
}

run()
  .then(async () => {
    await client.close().catch(() => {});
    console.log("✓ Saneamiento de base de datos completado con éxito.");
    process.exit(0);
  })
  .catch(async (e) => {
    await client.close().catch(() => {});
    console.error("❌ Error durante el saneamiento:", e);
    process.exit(1);
  });

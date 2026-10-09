const mysql = require("mysql2/promise");
(async () => {
  const conn = await mysql.createConnection("mysql://skillvault:skillvault_secret_change_me@skillvault-mysql.database.svc.cluster.local:3306/skillvault");
  const [skills] = await conn.query("SELECT id, slug, name, author_id, author_handle, status FROM skills");
  console.log("UPDATED SKILLS:", JSON.stringify(skills, null, 2));
  const [reviewRequests] = await conn.query("SELECT id, slug, name, author_id, author_handle, status FROM skill_review_requests");
  console.log("UPDATED REVIEW_REQUESTS:", JSON.stringify(reviewRequests, null, 2));
  await conn.end();
})().catch(console.error);

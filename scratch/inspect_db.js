const { Database } = require('sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../skills-vault.db');
const db = new Database(dbPath);

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log("Tables:", tables.map(t => t.name));

  // Query skills table
  db.all("SELECT slug, name, category, status FROM skills WHERE slug LIKE '%informe%'", (err, rows) => {
    if (err) {
      console.error(err);
    } else {
      console.log("Matching skills:", rows);
    }
    db.close();
  });
});

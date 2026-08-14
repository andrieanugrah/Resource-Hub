const Database = require("better-sqlite3");
const path = require("node:path");
const fs = require("node:fs");

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "resource-hub.db");

function init() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const migrationsDir = path.join(process.cwd(), "drizzle", "migrations");
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Check if users table exists
  let needMigration = false;
  try {
    const check = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='users'").get();
    if (!check || check.count === 0) {
      needMigration = true;
    }
  } catch (_) {
    needMigration = true;
  }

  if (needMigration && fs.existsSync(migrationsDir)) {
    console.log("Initializing database tables...");
    const sqlFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
    for (const file of sqlFiles) {
      try {
        db.exec(fs.readFileSync(path.join(migrationsDir, file), "utf8"));
        console.log(`  ✓ ${file}`);
      } catch (err) {
        console.warn(`  - ${file} (skipped/already applied)`);
      }
    }
  }

  // Check if users table has records
  let needSeed = false;
  try {
    const userCount = db.prepare("SELECT count(*) as count FROM users").get();
    if (!userCount || userCount.count === 0) {
      needSeed = true;
    }
  } catch (_) {
    needSeed = true;
  }

  db.close();

  if (needSeed) {
    console.log("Database empty. Seeding initial demo data...");
    require("./seed.js");
  } else {
    console.log("Database ready.");
  }
}

init();

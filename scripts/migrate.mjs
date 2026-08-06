import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { config } from "dotenv";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "resource-hub.db");

function migrate() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const migrationsDir = path.join(process.cwd(), "drizzle", "migrations");
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    sqlite.exec(sql);
    console.log(`  ✓ ${file}`);
  }

  sqlite.close();
  console.log("Migration complete.");
}

migrate();

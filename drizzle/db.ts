import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "node:path";
import fs from "node:fs";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "resource-hub.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Ensure tables exist on initial connection
try {
  const check = sqlite.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='users'").get() as { count: number } | undefined;
  if (!check || check.count === 0) {
    const migrationsDir = path.join(process.cwd(), "drizzle", "migrations");
    if (fs.existsSync(migrationsDir)) {
      const sqlFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
      for (const file of sqlFiles) {
        try {
          sqlite.exec(fs.readFileSync(path.join(migrationsDir, file), "utf8"));
        } catch (_) {}
      }
    }
  }
} catch (_) {}

export const db = drizzle(sqlite, { schema });
export { schema };

import Database from "better-sqlite3";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), "data", "resource-hub.db");
const db = new Database(DB_PATH);

try {
  const catColumns = db.pragma("table_info(categories)");
  if (!catColumns.some((c) => c.name === "specifications")) {
    db.exec("ALTER TABLE `categories` ADD COLUMN `specifications` text;");
    console.log("✓ Added specifications column to categories table");
  }
} catch (e) {
  console.error("Categories alter failed:", e.message);
}

try {
  const assetColumns = db.pragma("table_info(assets)");
  if (!assetColumns.some((c) => c.name === "parent_asset_id")) {
    db.exec("ALTER TABLE `assets` ADD COLUMN `parent_asset_id` text;");
    console.log("✓ Added parent_asset_id column to assets table");
  }
} catch (e) {
  console.error("Assets alter failed:", e.message);
}

try {
  const reqColumns = db.pragma("table_info(requests)");
  if (!reqColumns.some((c) => c.name === "department_asset")) {
    db.exec("ALTER TABLE `requests` ADD COLUMN `department_asset` integer DEFAULT 0 NOT NULL;");
    console.log("✓ Added department_asset column to requests table");
  }
} catch (e) {
  console.error("Requests alter failed:", e.message);
}

db.close();
console.log("Database schema patch completed successfully.");

import { defineConfig } from "drizzle-kit";
import path from "node:path";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: path.join(process.cwd(), "data", "resource-hub.db"),
  },
});

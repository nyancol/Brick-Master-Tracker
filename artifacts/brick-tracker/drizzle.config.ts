import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // drizzle-kit resolves these relative to this config file's location.
  schema: "./server/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DB_PATH ?? "./brick.db",
  },
});
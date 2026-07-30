/**
 * Idempotent seed: ensures brick_state has one row for each colour. Safe to
 * re-run; existing rows are left alone via ON CONFLICT DO NOTHING.
 *
 * Run with `pnpm db:seed` (uses tsx to load the .ts directly).
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { brickStateTable } from "./schema.js";

const dbPath = process.env.DB_PATH ?? "./brick.db";
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

const now = new Date();
await db
  .insert(brickStateTable)
  .values([
    { color: "red", holder: "Yann", updatedAt: now },
    { color: "blue", holder: "Thomas", updatedAt: now },
  ])
  .onConflictDoNothing();

console.log(`Seeded initial brick state into ${dbPath}`);
process.exit(0);
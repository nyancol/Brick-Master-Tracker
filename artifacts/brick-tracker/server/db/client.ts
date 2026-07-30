/**
 * SQLite connection. better-sqlite3 is an in-process native addon, so no
 * connection pool, no env-var connection string, no separate process.
 *
 * The DB file path is configurable via DB_PATH; defaults to ./brick.db next
 * to the working directory. In the Docker image, the Dockerfile sets
 * DB_PATH=/app/deploy/data/brick.db so the volume mount at /app/deploy/data
 * persists the file across container recreations.
 */
import { mkdirSync } from "node:fs";
import { dirname, isAbsolute } from "node:path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema.js";

const dbPath = process.env.DB_PATH ?? "./brick.db";

// Make sure the parent directory exists. better-sqlite3 will not create it
// itself, and we want this to "just work" whether DB_PATH is "./brick.db",
// "./data/brick.db", or "/app/deploy/data/brick.db".
mkdirSync(dirname(isAbsolute(dbPath) ? dbPath : `./${dbPath}`), { recursive: true });

const sqlite = new Database(dbPath);

// WAL mode gives better concurrent-read behaviour and is the modern default
// for SQLite. The -wal and -shm files alongside the main DB are normal.
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
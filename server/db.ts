import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const dbPath = process.env.DB_PATH ?? "./brick.db";
mkdirSync(dirname(resolve(dbPath)), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS brick_state (
    color TEXT PRIMARY KEY NOT NULL,
    holder TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transfer_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    color TEXT NOT NULL,
    from_holder TEXT NOT NULL,
    to_holder TEXT NOT NULL,
    transferred_at INTEGER NOT NULL
  );
`);

// Idempotent seed — only inserts if brick_state is empty
const row = sqlite.prepare("SELECT COUNT(*) as count FROM brick_state").get() as {
  count: number;
};
if (row.count === 0) {
  const now = Date.now();
  const insert = sqlite.prepare(
    "INSERT INTO brick_state (color, holder, updated_at) VALUES (?, ?, ?)",
  );
  insert.run("red", "Yann", now);
  insert.run("blue", "Thomas", now);
  console.log(`Seeded brick_state into ${dbPath}`);
}

export default sqlite;
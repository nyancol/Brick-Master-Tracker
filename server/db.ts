import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const dbPath = process.env.DB_PATH ?? "./brick.db";
mkdirSync(dirname(resolve(dbPath)), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Create base tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sub TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TEXT NOT NULL
  );
`);

// Check if old TEXT column schema exists and migrate
function columnExists(table: string, column: string): boolean {
  const rows = sqlite.pragma(`table_info(${table})`) as Array<{ cid: number; name: string }>;
  return rows.some((r) => r.name === column);
}

function createTableIfNotExists(ddl: string) {
  sqlite.exec(ddl);
}

// brick_state: create with new schema, migrate if old columns exist
createTableIfNotExists(`
  CREATE TABLE IF NOT EXISTS brick_state (
    color TEXT PRIMARY KEY NOT NULL,
    holder_id INTEGER REFERENCES users(id),
    updated_at INTEGER NOT NULL
  );
`);

if (columnExists("brick_state", "holder")) {
  sqlite.exec(`
    INSERT OR IGNORE INTO users (sub, email, display_name, avatar_url, created_at)
    SELECT DISTINCT holder, holder, holder, NULL, unixepoch() * 1000
    FROM brick_state
    WHERE holder IS NOT NULL;

    INSERT OR IGNORE INTO users (sub, email, display_name, avatar_url, created_at)
    SELECT DISTINCT from_holder, from_holder, from_holder, NULL, unixepoch() * 1000
    FROM transfer_history
    WHERE from_holder IS NOT NULL;

    INSERT OR IGNORE INTO users (sub, email, display_name, avatar_url, created_at)
    SELECT DISTINCT to_holder, to_holder, to_holder, NULL, unixepoch() * 1000
    FROM transfer_history
    WHERE to_holder IS NOT NULL;
  `);

  const rows = sqlite
    .prepare("SELECT color, holder FROM brick_state")
    .all() as Array<{ color: string; holder: string }>;
  for (const r of rows) {
    const user = sqlite
      .prepare("SELECT id FROM users WHERE display_name = ?")
      .get(r.holder) as { id: number };
    sqlite
      .prepare("UPDATE brick_state SET holder_id = ? WHERE color = ?")
      .run(user.id, r.color);
  }

  console.log("Migrated brick_state.holder → holder_id");
}

// transfer_history: create with new schema, migrate if old columns exist
createTableIfNotExists(`
  CREATE TABLE IF NOT EXISTS transfer_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    color TEXT NOT NULL,
    from_id INTEGER REFERENCES users(id),
    to_id INTEGER REFERENCES users(id),
    transferred_by_id INTEGER REFERENCES users(id),
    transferred_at INTEGER NOT NULL
  );
`);

if (columnExists("transfer_history", "from_holder")) {
  const transfers = sqlite
    .prepare("SELECT id, from_holder, to_holder FROM transfer_history")
    .all() as Array<{ id: number; from_holder: string; to_holder: string }>;
  for (const t of transfers) {
    const fromUser = sqlite
      .prepare("SELECT id FROM users WHERE display_name = ?")
      .get(t.from_holder) as { id: number } | undefined;
    const toUser = sqlite
      .prepare("SELECT id FROM users WHERE display_name = ?")
      .get(t.to_holder) as { id: number } | undefined;
    if (fromUser && toUser) {
      sqlite
        .prepare(
          "UPDATE transfer_history SET from_id = ?, to_id = ?, transferred_by_id = ? WHERE id = ?",
        )
        .run(fromUser.id, toUser.id, fromUser.id, t.id);
    }
  }
  console.log("Migrated transfer_history from_holder/to_holder → from_id/to_id");
}

// Drop legacy TEXT columns if they still exist (after data migration)
const keepColumns = ["color", "holder_id", "updated_at"];
if (columnExists("brick_state", "holder")) {
  const existing = (
    sqlite.pragma("table_info(brick_state)") as Array<{ name: string }>
  ).map((c) => c.name);
  const toKeep = existing.filter((c) => keepColumns.includes(c));
  const remaining = ["color", "holder_id", "updated_at"];

  // SQLite doesn't support DROP COLUMN in older versions, but better-sqlite3
  // targets modern SQLite which does. Use ALTER TABLE DROP COLUMN.
  for (const col of existing) {
    if (!remaining.includes(col)) {
      try {
        sqlite.exec(`ALTER TABLE brick_state DROP COLUMN "${col}"`);
      } catch {
        // column doesn't exist or can't be dropped, ignore
      }
    }
  }
  console.log("Dropped legacy TEXT columns from brick_state");
}

const keepTransferColumns = [
  "id",
  "color",
  "from_id",
  "to_id",
  "transferred_by_id",
  "transferred_at",
];
if (columnExists("transfer_history", "from_holder")) {
  const existing = (
    sqlite.pragma("table_info(transfer_history)") as Array<{ name: string }>
  ).map((c) => c.name);
  for (const col of existing) {
    if (!keepTransferColumns.includes(col)) {
      try {
        sqlite.exec(`ALTER TABLE transfer_history DROP COLUMN "${col}"`);
      } catch {
        // ignore
      }
    }
  }
  console.log("Dropped legacy TEXT columns from transfer_history");
}

export default sqlite;
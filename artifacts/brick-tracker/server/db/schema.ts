import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const brickStateTable = sqliteTable("brick_state", {
  color: text("color").primaryKey().notNull(),
  holder: text("holder").notNull(),
  // SQLite stores datetimes as integers; Drizzle's `mode: "timestamp"` returns a
  // Date object via .toISOString() in the route handler.
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const transferHistoryTable = sqliteTable("transfer_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  color: text("color").notNull(),
  fromHolder: text("from_holder").notNull(),
  toHolder: text("to_holder").notNull(),
  transferredAt: integer("transferred_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type BrickState = typeof brickStateTable.$inferSelect;
export type Transfer = typeof transferHistoryTable.$inferSelect;
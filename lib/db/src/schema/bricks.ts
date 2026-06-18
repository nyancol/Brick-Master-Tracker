import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const brickStateTable = pgTable("brick_state", {
  color: text("color").primaryKey().notNull(),
  holder: text("holder").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transferHistoryTable = pgTable("transfer_history", {
  id: serial("id").primaryKey(),
  color: text("color").notNull(),
  fromHolder: text("from_holder").notNull(),
  toHolder: text("to_holder").notNull(),
  transferredAt: timestamp("transferred_at").defaultNow().notNull(),
});

export const insertTransferSchema = createInsertSchema(transferHistoryTable).omit({ id: true, transferredAt: true });
export type InsertTransfer = z.infer<typeof insertTransferSchema>;
export type BrickState = typeof brickStateTable.$inferSelect;
export type Transfer = typeof transferHistoryTable.$inferSelect;

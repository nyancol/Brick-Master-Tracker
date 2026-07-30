import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/client.js";
import { brickStateTable, transferHistoryTable } from "../db/schema.js";
import { TransferBrickBody, TransferBrickParams, FRIENDS } from "../validation.js";

export const bricksRouter: IRouter = Router();

bricksRouter.get("/bricks", async (req, res) => {
  try {
    const states = await db.select().from(brickStateTable);
    res.json(
      states.map((s) => ({
        color: s.color,
        holder: s.holder,
        updatedAt: s.updatedAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get brick states");
    res.status(500).json({ error: "Internal server error" });
  }
});

bricksRouter.post("/bricks/:color/transfer", async (req, res) => {
  const paramsResult = TransferBrickParams.safeParse(req.params);
  if (!paramsResult.success) {
    res.status(400).json({ error: "Invalid brick color" });
    return;
  }

  const bodyResult = TransferBrickBody.safeParse(req.body);
  if (!bodyResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { color } = paramsResult.data;
  const { to } = bodyResult.data;

  if (!(FRIENDS as readonly string[]).includes(to)) {
    res.status(400).json({ error: `Invalid friend name. Must be one of: ${FRIENDS.join(", ")}` });
    return;
  }

  try {
    const currentState = await db
      .select()
      .from(brickStateTable)
      .where(eq(brickStateTable.color, color))
      .limit(1);

    if (currentState.length === 0) {
      res.status(404).json({ error: "Brick not found" });
      return;
    }

    const current = currentState[0];

    if (current.holder === to) {
      res.status(400).json({ error: "Cannot transfer brick to the current holder" });
      return;
    }

    const [updated] = await db
      .update(brickStateTable)
      .set({ holder: to, updatedAt: new Date() })
      .where(eq(brickStateTable.color, color))
      .returning();

    await db.insert(transferHistoryTable).values({
      color,
      fromHolder: current.holder,
      toHolder: to,
    });

    res.json({
      color: updated.color,
      holder: updated.holder,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to transfer brick");
    res.status(500).json({ error: "Internal server error" });
  }
});

bricksRouter.get("/transfers", async (req, res) => {
  try {
    const transfers = await db
      .select()
      .from(transferHistoryTable)
      .orderBy(desc(transferHistoryTable.transferredAt));

    res.json(
      transfers.map((t) => ({
        id: t.id,
        color: t.color,
        fromHolder: t.fromHolder,
        toHolder: t.toHolder,
        transferredAt: t.transferredAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get transfers");
    res.status(500).json({ error: "Internal server error" });
  }
});
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

  try {
    const result = await db.transaction(async (tx) => {
      const currentState = await tx
        .select()
        .from(brickStateTable)
        .where(eq(brickStateTable.color, color))
        .limit(1);

      if (currentState.length === 0) {
        return { error: "Brick not found", status: 404 as const };
      }

      const current = currentState[0];

      if (current.holder === to) {
        return { error: "Cannot transfer brick to the current holder", status: 400 as const };
      }

      const [row] = await tx
        .update(brickStateTable)
        .set({ holder: to, updatedAt: new Date() })
        .where(eq(brickStateTable.color, color))
        .returning();

      await tx.insert(transferHistoryTable).values({
        color,
        fromHolder: current.holder,
        toHolder: to,
      });

      return { data: row };
    });

    if ("error" in result) {
      res.status(result.status!).json({ error: result.error });
      return;
    }

    res.json({
      color: result.data.color,
      holder: result.data.holder,
      updatedAt: result.data.updatedAt.toISOString(),
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
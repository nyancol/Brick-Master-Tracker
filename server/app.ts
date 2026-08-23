/**
 * Express app with API routes only — no static file serving.
 * In dev, Vite mounts this as middleware. In production, server/index.ts
 * wraps it with static file serving and SPA fallback.
 */
import express from "express";
import db from "./db.js";
import { FRIENDS } from "../shared/constants.js";

const VALID_COLORS = new Set(["red", "blue"]);

const app = express();
app.use(express.json());

// Simple request logger
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url?.split("?")[0]}`);
  next();
});

// GET /healthz
app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// GET /bricks
app.get("/bricks", (_req, res) => {
  try {
    const rows = db
      .prepare("SELECT color, holder, updated_at FROM brick_state")
      .all() as Array<{ color: string; holder: string; updated_at: number }>;
    res.json(
      rows.map((r) => ({
        color: r.color,
        holder: r.holder,
        updatedAt: new Date(r.updated_at).toISOString(),
      })),
    );
  } catch (err) {
    console.error("GET /bricks failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /bricks/:color/transfer
app.post("/bricks/:color/transfer", (req, res) => {
  const { color } = req.params;
  const { to } = req.body;

  if (!VALID_COLORS.has(color)) {
    res.status(400).json({ error: "Invalid brick color" });
    return;
  }

  if (!to || !(FRIENDS as readonly string[]).includes(to)) {
    res
      .status(400)
      .json({ error: `Invalid recipient. Must be one of: ${FRIENDS.join(", ")}` });
    return;
  }

  try {
    type TxResult =
      | { error: string; status: 404 | 400 }
      | { data: { color: string; holder: string; updatedAt: string } };

    const result = db.transaction((): TxResult => {
      const current = db
        .prepare("SELECT holder FROM brick_state WHERE color = ?")
        .get(color) as { holder: string } | undefined;

      if (!current) {
        return { error: "Brick not found", status: 404 };
      }

      if (current.holder === to) {
        return { error: "Cannot transfer brick to the current holder", status: 400 };
      }

      const now = Date.now();
      db.prepare(
        "UPDATE brick_state SET holder = ?, updated_at = ? WHERE color = ?",
      ).run(to, now, color);
      db.prepare(
        "INSERT INTO transfer_history (color, from_holder, to_holder, transferred_at) VALUES (?, ?, ?, ?)",
      ).run(color, current.holder, to, now);

      return { data: { color, holder: to, updatedAt: new Date(now).toISOString() } };
    })() as unknown as TxResult;

    if ("error" in result) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    res.json(result.data);
  } catch (err) {
    console.error("POST transfer failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /transfers
app.get("/transfers", (_req, res) => {
  try {
    const rows = db
      .prepare(
        "SELECT id, color, from_holder, to_holder, transferred_at FROM transfer_history ORDER BY transferred_at DESC",
      )
      .all() as Array<{
      id: number;
      color: string;
      from_holder: string;
      to_holder: string;
      transferred_at: number;
    }>;
    res.json(
      rows.map((r) => ({
        id: r.id,
        color: r.color,
        fromHolder: r.from_holder,
        toHolder: r.to_holder,
        transferredAt: new Date(r.transferred_at).toISOString(),
      })),
    );
  } catch (err) {
    console.error("GET /transfers failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
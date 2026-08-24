import express from "express";
import session from "express-session";
import createSqliteStore from "better-sqlite3-session-store";
import db from "./db.js";
import {
  initOidc,
  generateAuthUrl,
  consumeState,
  handleCallback,
  getSessionSecret,
  getAuthMe,
  getOidcConfig,
  getDiscoveryError,
} from "./auth.js";

const SqliteStore = createSqliteStore(session);

const app = express();

await initOidc();

app.use(express.json());
app.use(
  session({
    store: new SqliteStore({ client: db }),
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url?.split("?")[0]}`);
  next();
});

const VALID_COLORS = new Set(["red", "blue"]);

function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  if (!req.session.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

function qs(param: unknown): string | undefined {
  if (typeof param === "string") return param;
  if (Array.isArray(param)) return param[0];
  return undefined;
}

// GET /healthz
app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// GET /auth/login
app.get("/auth/login", (_req, res) => {
  const config = getOidcConfig();
  if (!config) {
    const err = getDiscoveryError() ?? "OIDC not configured";
    res.status(503).json({ error: err });
    return;
  }

  generateAuthUrl()
    .then((url) => res.redirect(url))
    .catch((err) => {
      console.error("Login redirect failed:", err);
      res.status(500).json({ error: "Internal server error" });
    });
});

// GET /auth/callback
app.get("/auth/callback", async (req, res) => {
  const state = qs(req.query.state);
  const oidcError = qs(req.query.error);
  const errorDescription = qs(req.query.error_description);

  if (oidcError) {
    res.status(401).json({ error: oidcError, description: errorDescription });
    return;
  }

  if (!state) {
    res.status(400).json({ error: "Missing state parameter" });
    return;
  }

  const stored = consumeState(state);
  if (!stored) {
    res.status(401).json({ error: "Invalid or expired state" });
    return;
  }

  try {
    const callbackUrl = new URL(
      req.protocol + "://" + req.get("host") + req.originalUrl,
    );
    const user = await handleCallback(callbackUrl, stored);
    req.session.user = { id: user.id, email: user.email };
    req.session.save((err) => {
      if (err) {
        console.error("Session save failed:", err);
        res.status(500).json({ error: "Failed to create session" });
        return;
      }
      res.redirect("/");
    });
  } catch (err) {
    console.error("Auth callback failed:", err);
    res
      .status(401)
      .json({ error: err instanceof Error ? err.message : "Authentication failed" });
  }
});

// GET /auth/logout
app.get("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout failed:", err);
    }
    res.redirect("/");
  });
});

// GET /auth/me
app.get("/auth/me", (req, res) => {
  if (!req.session.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const data = getAuthMe(req.session.user.id);
    res.json(data);
  } catch (err) {
    console.error("GET /auth/me failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /bricks
app.get("/bricks", (_req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT b.color, b.holder_id, b.updated_at,
                u.display_name as holder_name, u.avatar_url as holder_avatar_url
         FROM brick_state b
         LEFT JOIN users u ON b.holder_id = u.id`,
      )
      .all() as Array<{
      color: string;
      holder_id: number | null;
      updated_at: number;
      holder_name: string | null;
      holder_avatar_url: string | null;
    }>;
    res.json(
      rows.map((r) => ({
        color: r.color,
        holderId: r.holder_id,
        holderName: r.holder_name ?? "Unknown",
        holderAvatarUrl: r.holder_avatar_url,
        updatedAt: new Date(r.updated_at).toISOString(),
      })),
    );
  } catch (err) {
    console.error("GET /bricks failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /transfers
app.get("/transfers", (_req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT t.id, t.color, t.from_id, t.to_id, t.transferred_by_id, t.transferred_at,
                fu.display_name as from_name,
                tu.display_name as to_name,
                bu.display_name as transferred_by_name
         FROM transfer_history t
         LEFT JOIN users fu ON t.from_id = fu.id
         LEFT JOIN users tu ON t.to_id = tu.id
         LEFT JOIN users bu ON t.transferred_by_id = bu.id
         ORDER BY t.transferred_at DESC`,
      )
      .all() as Array<{
      id: number;
      color: string;
      from_id: number;
      to_id: number;
      transferred_by_id: number;
      transferred_at: number;
      from_name: string | null;
      to_name: string | null;
      transferred_by_name: string | null;
    }>;
    res.json(
      rows.map((r) => ({
        id: r.id,
        color: r.color,
        fromId: r.from_id,
        fromName: r.from_name ?? "Unknown",
        toId: r.to_id,
        toName: r.to_name ?? "Unknown",
        transferredById: r.transferred_by_id,
        transferredByName: r.transferred_by_name ?? "Unknown",
        transferredAt: new Date(r.transferred_at).toISOString(),
      })),
    );
  } catch (err) {
    console.error("GET /transfers failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /bricks/:color/transfer
app.post("/bricks/:color/transfer", requireAuth, (req, res) => {
  const color = req.params.color as string;
  const { to } = req.body;

  if (!VALID_COLORS.has(color)) {
    res.status(400).json({ error: "Invalid brick color" });
    return;
  }

  if (typeof to !== "number" || !Number.isInteger(to)) {
    res.status(400).json({ error: "Invalid recipient user ID" });
    return;
  }

  const currentUserId = req.session.user!.id;

  type TxResult =
    | { error: string; status: 404 | 400 | 403 }
    | { data: Record<string, unknown> };

  try {
    const result = db.transaction((): TxResult => {
      const current = db
        .prepare(
          `SELECT b.holder_id, u.display_name
           FROM brick_state b
           LEFT JOIN users u ON b.holder_id = u.id
           WHERE b.color = ?`,
        )
        .get(color) as
        | { holder_id: number | null; display_name: string | null }
        | undefined;

      if (!current) {
        return { error: "Brick not found", status: 404 };
      }

      if (current.holder_id !== currentUserId) {
        return {
          error: "Only the current holder can transfer this brick",
          status: 403,
        };
      }

      if (current.holder_id === to) {
        return { error: "Cannot transfer brick to the current holder", status: 400 };
      }

      const recipient = db
        .prepare("SELECT id, display_name, avatar_url FROM users WHERE id = ?")
        .get(to) as
        | { id: number; display_name: string; avatar_url: string | null }
        | undefined;

      if (!recipient) {
        return { error: "Invalid recipient", status: 400 };
      }

      const now = Date.now();
      db.prepare(
        "UPDATE brick_state SET holder_id = ?, updated_at = ? WHERE color = ?",
      ).run(to, now, color);
      db.prepare(
        "INSERT INTO transfer_history (color, from_id, to_id, transferred_by_id, transferred_at) VALUES (?, ?, ?, ?, ?)",
      ).run(color, current.holder_id, to, currentUserId, now);

      return {
        data: {
          color,
          holderId: to,
          holderName: recipient.display_name,
          holderAvatarUrl: recipient.avatar_url,
          updatedAt: new Date(now).toISOString(),
        },
      };
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

export default app;
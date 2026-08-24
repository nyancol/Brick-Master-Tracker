import express from "express";
import session from "express-session";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { mkdirSync, unlinkSync, existsSync } from "node:fs";
import { join, resolve, extname } from "node:path";
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

const dataPath = process.env.DATA_PATH ?? "./data";
const uploadsDir = resolve(dataPath, "uploads");
mkdirSync(uploadsDir, { recursive: true });

const VALID_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, _file, cb) => {
      const uuid = uuidv4();
      const ext = MIME_TO_EXT[_req.file?.mimetype ?? ""] ?? "";
      cb(null, `${uuid}${ext}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (VALID_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported image format. Accepted: JPEG, PNG, WebP, GIF"));
    }
  },
});

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

// GET /transfers — basic metadata only
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

// GET /transfers/:id/story — full story details
app.get("/transfers/:id/story", (req, res) => {
  try {
    const story = db
      .prepare(
        `SELECT ts.description, ts.edited_by, ts.edited_at,
                eu.display_name as edited_by_name
         FROM transfer_story ts
         LEFT JOIN users eu ON ts.edited_by = eu.id
         WHERE ts.transfer_id = ?`,
      )
      .get(Number(req.params.id)) as {
      description: string;
      edited_by: number;
      edited_at: number;
      edited_by_name: string | null;
    } | undefined;

    const images = db
      .prepare(
        "SELECT id, filename, original_name, mime_type, uploaded_at FROM transfer_images WHERE transfer_id = ? ORDER BY uploaded_at ASC",
      )
      .all(Number(req.params.id)) as Array<{
      id: number;
      filename: string;
      original_name: string;
      mime_type: string;
      uploaded_at: number;
    }>;

    if (!story) {
      res.json({ description: null, editedBy: null, editedByName: null, editedAt: null, images: [] });
      return;
    }

    res.json({
      description: story.description,
      editedBy: story.edited_by,
      editedByName: story.edited_by_name ?? "Unknown",
      editedAt: new Date(story.edited_at).toISOString(),
      images: images.map((img) => ({
        id: img.id,
        filename: img.filename,
        originalName: img.original_name,
        mimeType: img.mime_type,
        uploadedAt: new Date(img.uploaded_at).toISOString(),
      })),
    });
  } catch (err) {
    console.error("GET /transfers/:id/story failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /transfers/:id/story — upsert description (sender only, non-empty)
app.put("/transfers/:id/story", requireAuth, (req, res) => {
  try {
    const transferId = Number(req.params.id);
    const { description } = req.body;
    const userId = req.session.user!.id;

    if (!description || typeof description !== "string" || !description.trim()) {
      res.status(400).json({ error: "Description must be a non-empty string" });
      return;
    }

    const transfer = db
      .prepare("SELECT from_id FROM transfer_history WHERE id = ?")
      .get(transferId) as { from_id: number } | undefined;

    if (!transfer) {
      res.status(404).json({ error: "Transfer not found" });
      return;
    }

    if (transfer.from_id !== userId) {
      res.status(403).json({ error: "Only the sender can edit the story" });
      return;
    }

    const now = Date.now();
    const existing = db
      .prepare("SELECT transfer_id FROM transfer_story WHERE transfer_id = ?")
      .get(transferId);

    if (existing) {
      db.prepare(
        "UPDATE transfer_story SET description = ?, edited_by = ?, edited_at = ? WHERE transfer_id = ?",
      ).run(description, userId, now, transferId);
    } else {
      db.prepare(
        "INSERT INTO transfer_story (transfer_id, description, edited_by, edited_at, created_at) VALUES (?, ?, ?, ?, ?)",
      ).run(transferId, description, userId, now, now);
    }

    const user = db
      .prepare("SELECT display_name FROM users WHERE id = ?")
      .get(userId) as { display_name: string };

    res.json({
      description,
      editedBy: userId,
      editedByName: user.display_name,
      editedAt: new Date(now).toISOString(),
    });
  } catch (err) {
    console.error("PUT /transfers/:id/story failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /bricks/:color/transfer
app.post("/bricks/:color/transfer", requireAuth, (req, res) => {
  const color = req.params.color as string;
  const { to, description, imageIds } = req.body;

  if (!VALID_COLORS.has(color)) {
    res.status(400).json({ error: "Invalid brick color" });
    return;
  }

  if (typeof to !== "number" || !Number.isInteger(to)) {
    res.status(400).json({ error: "Invalid recipient user ID" });
    return;
  }

  if (!description || typeof description !== "string" || !description.trim()) {
    res.status(400).json({ error: "Description is required" });
    return;
  }

  const picIds: number[] = Array.isArray(imageIds) ? imageIds : [];
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
      const info = db.prepare(
        "INSERT INTO transfer_history (color, from_id, to_id, transferred_by_id, transferred_at) VALUES (?, ?, ?, ?, ?)",
      ).run(color, current.holder_id, to, currentUserId, now);

      const transferId = info.lastInsertRowid as number;

      db.prepare(
        "INSERT INTO transfer_story (transfer_id, description, edited_by, edited_at, created_at) VALUES (?, ?, ?, ?, ?)",
      ).run(transferId, description, currentUserId, now, now);

      for (const imgId of picIds) {
        db.prepare(
          "UPDATE transfer_images SET transfer_id = ? WHERE id = ? AND transfer_id IS NULL AND uploaded_by = ?",
        ).run(transferId, imgId, currentUserId);
      }

      return {
        data: {
          transferId,
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

// POST /api/uploads/staging — upload image before transfer exists
app.post("/uploads/staging", requireAuth, (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({ error: "File too large. Maximum size is 50 MB." });
          return;
        }
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(400).json({ error: err.message });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }

    const userId = req.session.user!.id;
    const now = Date.now();
    const info = db.prepare(
      "INSERT INTO transfer_images (transfer_id, filename, original_name, mime_type, uploaded_by, uploaded_at) VALUES (NULL, ?, ?, ?, ?, ?)",
    ).run(file.filename, file.originalname, file.mimetype, userId, now);

    res.json({
      id: info.lastInsertRowid as number,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
    });
  });
});

// DELETE /api/uploads/staging/:id — remove staging image
app.delete("/uploads/staging/:id", requireAuth, (req, res) => {
  try {
    const imgId = Number(req.params.id);
    const userId = req.session.user!.id;

    const img = db
      .prepare("SELECT id, filename, uploaded_by, transfer_id FROM transfer_images WHERE id = ?")
      .get(imgId) as { id: number; filename: string; uploaded_by: number; transfer_id: number | null } | undefined;

    if (!img) {
      res.status(404).json({ error: "Image not found" });
      return;
    }

    if (img.uploaded_by !== userId) {
      res.status(403).json({ error: "Only the uploader can delete this image" });
      return;
    }

    if (img.transfer_id !== null) {
      res.status(400).json({ error: "Image is already associated with a transfer. Use DELETE /api/transfers/:id/images/:imageId instead." });
      return;
    }

    const filePath = join(uploadsDir, img.filename);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
    db.prepare("DELETE FROM transfer_images WHERE id = ?").run(imgId);

    res.json({ deleted: true });
  } catch (err) {
    console.error("DELETE /uploads/staging/:id failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/transfers/:id/images — upload image to existing transfer
app.post("/transfers/:id/images", requireAuth, (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({ error: "File too large. Maximum size is 50 MB." });
          return;
        }
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(400).json({ error: err.message });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }

    const userId = req.session.user!.id;
    const transferId = Number(req.params.id);

    const transfer = db
      .prepare("SELECT from_id FROM transfer_history WHERE id = ?")
      .get(transferId) as { from_id: number } | undefined;

    if (!transfer) {
      res.status(404).json({ error: "Transfer not found" });
      return;
    }

    if (transfer.from_id !== userId) {
      res.status(403).json({ error: "Only the sender can upload images" });
      return;
    }

    const now = Date.now();
    const info = db.prepare(
      "INSERT INTO transfer_images (transfer_id, filename, original_name, mime_type, uploaded_by, uploaded_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(transferId, file.filename, file.originalname, file.mimetype, userId, now);

    res.json({
      id: info.lastInsertRowid as number,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      uploadedAt: new Date(now).toISOString(),
    });
  });
});

// DELETE /api/transfers/:id/images/:imageId
app.delete("/transfers/:id/images/:imageId", requireAuth, (req, res) => {
  try {
    const transferId = Number(req.params.id);
    const imgId = Number(req.params.imageId);
    const userId = req.session.user!.id;

    const transfer = db
      .prepare("SELECT from_id FROM transfer_history WHERE id = ?")
      .get(transferId) as { from_id: number } | undefined;

    if (!transfer) {
      res.status(404).json({ error: "Transfer not found" });
      return;
    }

    if (transfer.from_id !== userId) {
      res.status(403).json({ error: "Only the sender can delete images" });
      return;
    }

    const img = db
      .prepare("SELECT id, filename FROM transfer_images WHERE id = ? AND transfer_id = ?")
      .get(imgId, transferId) as { id: number; filename: string } | undefined;

    if (!img) {
      res.status(404).json({ error: "Image not found" });
      return;
    }

    const filePath = join(uploadsDir, img.filename);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
    db.prepare("DELETE FROM transfer_images WHERE id = ?").run(imgId);

    res.json({ deleted: true });
  } catch (err) {
    console.error("DELETE /transfers/:id/images/:imageId failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/uploads/:filename — serve image (authenticated)
app.get("/uploads/:filename", requireAuth, (req, res) => {
  try {
    const filename = req.params.filename;

    const img = db
      .prepare("SELECT filename, mime_type FROM transfer_images WHERE filename = ?")
      .get(filename) as { filename: string; mime_type: string } | undefined;

    if (!img) {
      res.status(404).json({ error: "Image not found" });
      return;
    }

    const filePath = join(uploadsDir, img.filename);
    if (!existsSync(filePath)) {
      res.status(404).json({ error: "Image file not found" });
      return;
    }

    res.type(img.mime_type).sendFile(filePath);
  } catch (err) {
    console.error("GET /uploads/:filename failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
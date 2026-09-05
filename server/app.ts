import express from "express";
import session from "express-session";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { mkdirSync, unlinkSync, existsSync } from "node:fs";
import { join, resolve, extname } from "node:path";
import { context, trace } from "@opentelemetry/api";
import createSqliteStore from "better-sqlite3-session-store";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import db from "./db.js";
import logger from "./logger.js";
import {
  initOidc,
  generateAuthUrl,
  consumeState,
  handleCallback,
  getSessionSecret,
  getAuthMe,
  getOidcConfig,
  getDiscoveryError,
  isDevLoginEnabled,
  seedDevUsers,
  bootstrapDevBricks,
  getDevTestUsers,
  findDevTestUser,
  upsertUser,
} from "./auth.js";

const SqliteStore = createSqliteStore(session);

const uploadsDir = resolve(process.env.IMAGE_PATH ?? "/app/data/upload");
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

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         sub:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         displayName:
 *           type: string
 *         username:
 *           type: string
 *         role:
 *           type: string
 *           enum: [knight, visitor]
 *           description: Participation role derived from OIDC group membership
 *         avatarUrl:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: integer
 *           description: Unix timestamp ms
 *     BrickState:
 *       type: object
 *       properties:
 *         color:
 *           type: string
 *           enum: [red, blue]
 *         holderId:
 *           type: integer
 *           nullable: true
 *         holderName:
 *           type: string
 *         holderAvatarUrl:
 *           type: string
 *           nullable: true
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Transfer:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         color:
 *           type: string
 *           enum: [red, blue]
 *         fromId:
 *           type: integer
 *           nullable: true
 *           description: Null for genesis rows (brick founding)
 *         fromName:
 *           type: string
 *           nullable: true
 *           description: Null for genesis rows (brick founding)
 *         toId:
 *           type: integer
 *         toName:
 *           type: string
 *         transferredById:
 *           type: integer
 *         transferredByName:
 *           type: string
 *         transferredAt:
 *           type: string
 *           format: date-time
 *     TransferStory:
 *       type: object
 *       properties:
 *         description:
 *           type: string
 *         editedBy:
 *           type: integer
 *           nullable: true
 *         editedByName:
 *           type: string
 *           nullable: true
 *         editedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         images:
 *           type: array
 *           items:
 *             $ref: "#/components/schemas/TransferImage"
 *     TransferImage:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         filename:
 *           type: string
 *         originalName:
 *           type: string
 *         mimeType:
 *           type: string
 *         uploadedAt:
 *           type: string
 *           format: date-time
 *     TransferComment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         authorId:
 *           type: integer
 *         authorName:
 *           type: string
 *         authorRole:
 *           type: string
 *           enum: [knight, visitor]
 *         body:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         blottedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         huzzahCount:
 *           type: integer
 *         huzzahedByMe:
 *           type: boolean
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 */

const app = express();

await initOidc();

if (isDevLoginEnabled()) {
  seedDevUsers();
  bootstrapDevBricks();
}

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

// Request-scoped logger: carries trace/span ids when telemetry is active
// so log records correlate with traces in the observability backend.
app.use((req, _res, next) => {
  const span = trace.getSpan(context.active());
  const spanContext = span?.spanContext();
  req.log = logger.child(
    spanContext
      ? {
          trace_id: spanContext.traceId,
          span_id: spanContext.spanId,
          trace_flags: spanContext.traceFlags,
        }
      : {},
  );
  req.log.info(`${req.method} ${req.url?.split("?")[0]}`);
  next();
});

// Generate OpenAPI spec from JSDoc annotations
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Brick Master Tracker API",
      version: "0.0.1",
      description:
        "API for tracking transfers of the Brick of Honor (red) and Brick of Shame (blue) " +
        "between three friends. Each transfer includes a story and optional images.\n\n" +
        "Authentication is session-based via OIDC (Pocket-ID). In development, test-user " +
        "login is available at `/auth/dev/login`.",
    },
    servers: [{ url: "/api" }],
    tags: [
      { name: "Health", description: "Health check endpoints" },
      { name: "Site", description: "Site-wide counters and statistics" },
      { name: "Authentication", description: "Login, logout, and session management" },
      { name: "Bricks", description: "Current brick state and holder info" },
      { name: "Transfers", description: "Transfer history, stories, and brick transfer actions" },
      { name: "Marginalia", description: "Glosses (comments) on chronicle entries" },
      { name: "Uploads", description: "Image upload and management for transfer stories" },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "connect.sid",
        },
      },
    },
  },
  apis: [new URL("app.ts", import.meta.url).pathname],
});

// Mount Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve raw OpenAPI spec
app.get("/api-docs.json", (_req, res) => {
  res.json(swaggerSpec);
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
/**
 * @openapi
 * /healthz:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     operationId: healthz
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// POST /api/visits — register a page visit (deduplicated per browser session)
/**
 * @openapi
 * /visits:
 *   post:
 *     tags: [Site]
 *     summary: Register a page visit
 *     operationId: registerVisit
 *     description: >
 *       Increments the shared visitor count at most once per browser session.
 *       A session-scoped `counted` cookie marks the browser as counted; repeat
 *       requests within the same browser session return the current count
 *       without incrementing. No authentication required.
 *     responses:
 *       200:
 *         description: Current shared visit count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: Total registered visits across all visitors
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
app.post("/visits", (req, res) => {
  try {
    const counted = (req.headers.cookie ?? "")
      .split(";")
      .some((c) => c.trim() === "counted=1");

    if (!counted) {
      db.prepare(
        "INSERT INTO site_stats (key, value) VALUES ('visits', 1) ON CONFLICT(key) DO UPDATE SET value = value + 1",
      ).run();
      res.cookie("counted", "1", { httpOnly: true, sameSite: "lax" });
    }

    const row = db
      .prepare("SELECT value FROM site_stats WHERE key = 'visits'")
      .get() as { value: number } | undefined;

    res.json({ count: row?.value ?? 0 });
  } catch (err) {
    req.log.error({ err }, "POST /visits failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /auth/login
/**
 * @openapi
 * /auth/login:
 *   get:
 *     tags: [Authentication]
 *     summary: Initiate OIDC login
 *     operationId: authLogin
 *     responses:
 *       302:
 *         description: Redirect to OIDC provider
 *       503:
 *         description: OIDC not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
app.get("/auth/login", (req, res) => {
  const config = getOidcConfig();
  if (!config) {
    const err = getDiscoveryError() ?? "OIDC not configured";
    res.status(503).json({ error: err });
    return;
  }

  generateAuthUrl()
    .then((url) => res.redirect(url))
    .catch((err) => {
      req.log.error({ err }, "Login redirect failed");
      res.status(500).json({ error: "Internal server error" });
    });
});

// GET /auth/callback
/**
 * @openapi
 * /auth/callback:
 *   get:
 *     tags: [Authentication]
 *     summary: OIDC callback handler
 *     operationId: authCallback
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from OIDC provider
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State parameter for CSRF protection
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *         description: Error code from OIDC provider
 *       - in: query
 *         name: error_description
 *         schema:
 *           type: string
 *         description: Human-readable error description
 *     responses:
 *       302:
 *         description: Redirect to home on success
 *       400:
 *         description: Missing state parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *       401:
 *         description: Authentication failed or invalid state
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
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
    const appUrl = process.env.APP_URL;
    const callbackUrl = new URL(
      appUrl
        ? `${appUrl.replace(/\/+$/, "")}${req.originalUrl}`
        : req.protocol + "://" + req.get("host") + req.originalUrl,
    );
    const user = await handleCallback(callbackUrl, stored);
    req.session.user = { id: user.id, email: user.email };
    req.session.save((err) => {
      if (err) {
        req.log.error({ err }, "Session save failed");
        res.status(500).json({ error: "Failed to create session" });
        return;
      }
      res.redirect("/");
    });
  } catch (err) {
    req.log.error({ err }, "Auth callback failed");
    res
      .status(401)
      .json({ error: err instanceof Error ? err.message : "Authentication failed" });
  }
});

// GET /auth/logout
/**
 * @openapi
 * /auth/logout:
 *   get:
 *     tags: [Authentication]
 *     summary: Logout and destroy session
 *     operationId: authLogout
 *     responses:
 *       302:
 *         description: Redirect to home after logout
 */
app.get("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      req.log.error({ err }, "Logout failed");
    }
    res.redirect("/");
  });
});

// GET /auth/me
/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user and all users
 *     operationId: authMe
 *     responses:
 *       200:
 *         description: Current user and user list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: "#/components/schemas/User"
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/User"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
app.get("/auth/me", (req, res) => {
  if (!req.session.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const data = getAuthMe(req.session.user.id);
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "GET /auth/me failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /auth/dev — report whether dev test-user login is available
/**
 * @openapi
 * /auth/dev:
 *   get:
 *     tags: [Authentication]
 *     summary: Check if dev test-user login is available
 *     operationId: authDev
 *     responses:
 *       200:
 *         description: Dev login configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 enabled:
 *                   type: boolean
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *                       displayName:
 *                         type: string
 *                       role:
 *                         type: string
 *                         enum: [knight, visitor]
 */
app.get("/auth/dev", (_req, res) => {
  if (isDevLoginEnabled()) {
    res.json({ enabled: true, users: getDevTestUsers() });
    return;
  }
  res.json({ enabled: false, users: [] });
});

// POST /auth/dev/login — sign in as a dev test user (no OIDC)
/**
 * @openapi
 * /auth/dev/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Sign in as a dev test user (development only)
 *     operationId: authDevLogin
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username]
 *             properties:
 *               username:
 *                 type: string
 *                 description: One of the available dev test users
 *     responses:
 *       200:
 *         description: Logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: "#/components/schemas/User"
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/User"
 *       404:
 *         description: Dev login not available or unknown user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
app.post("/auth/dev/login", (req, res) => {
  if (!isDevLoginEnabled()) {
    res.status(404).json({ error: "Dev login not available" });
    return;
  }

  const username = typeof req.body?.username === "string" ? req.body.username : "";
  const devUser = findDevTestUser(username);
  if (!devUser) {
    res.status(404).json({ error: "Unknown dev test user" });
    return;
  }

  const user = upsertUser(
    devUser.sub,
    devUser.email,
    devUser.displayName,
    devUser.username,
    devUser.avatarUrl,
    devUser.role,
  );
  req.session.user = { id: user.id, email: user.email };
  req.session.save((err) => {
    if (err) {
      req.log.error({ err }, "Dev login session save failed");
      res.status(500).json({ error: "Failed to create session" });
      return;
    }
    res.json(getAuthMe(user.id));
  });
});

// GET /bricks
/**
 * @openapi
 * /bricks:
 *   get:
 *     tags: [Bricks]
 *     summary: Get current brick states
 *     operationId: getBricks
 *     responses:
 *       200:
 *         description: Array of brick states
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/BrickState"
 */
app.get("/bricks", (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT b.color, b.holder_id, b.updated_at,
                u.username as holder_name, u.avatar_url as holder_avatar_url
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
    req.log.error({ err }, "GET /bricks failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /transfers — basic metadata only
/**
 * @openapi
 * /transfers:
 *   get:
 *     tags: [Transfers]
 *     summary: Get transfer history
 *     operationId: getTransfers
 *     description: >
 *       Array of transfers ordered by date descending. Includes one synthetic
 *       genesis row per brick color anchoring the first holder's tenure; genesis
 *       rows have `fromId` and `fromName` set to null.
 *     responses:
 *       200:
 *         description: Array of transfers ordered by date descending
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Transfer"
 */
app.get("/transfers", (req, res) => {
  try {
    const rows = db
      .prepare(
        `SELECT t.id, t.color, t.from_id, t.to_id, t.transferred_by_id, t.transferred_at,
                fu.username as from_name,
                tu.username as to_name,
                bu.username as transferred_by_name
         FROM transfer_history t
         LEFT JOIN users fu ON t.from_id = fu.id
         LEFT JOIN users tu ON t.to_id = tu.id
         LEFT JOIN users bu ON t.transferred_by_id = bu.id
         ORDER BY t.transferred_at DESC`,
      )
      .all() as Array<{
      id: number;
      color: string;
      from_id: number | null;
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
        fromName: r.from_name,
        toId: r.to_id,
        toName: r.to_name ?? "Unknown",
        transferredById: r.transferred_by_id,
        transferredByName: r.transferred_by_name ?? "Unknown",
        transferredAt: new Date(r.transferred_at).toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "GET /transfers failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /transfers/:id/story — full story details
/**
 * @openapi
 * /transfers/{id}/story:
 *   get:
 *     tags: [Transfers]
 *     summary: Get transfer story with images
 *     operationId: getTransferStory
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transfer ID
 *     responses:
 *       200:
 *         description: Transfer story with images
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/TransferStory"
 */
app.get("/transfers/:id/story", (req, res) => {
  try {
    const story = db
      .prepare(
        `SELECT ts.description, ts.edited_by, ts.edited_at,
                eu.username as edited_by_name
         FROM transfer_story ts
         LEFT JOIN users eu ON ts.edited_by = eu.id
         WHERE ts.transfer_id = ?`,
      )
      .get(Number(req.params.id)) as {
      description: string;
      edited_by: number | null;
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
      editedByName: story.edited_by_name,
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
    req.log.error({ err }, "GET /transfers/:id/story failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /transfers/:id/story — upsert description (sender only, non-empty)
/**
 * @openapi
 * /transfers/{id}/story:
 *   put:
 *     tags: [Transfers]
 *     summary: Update transfer story description
 *     operationId: updateTransferStory
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transfer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [description]
 *             properties:
 *               description:
 *                 type: string
 *                 description: Non-empty story text
 *     responses:
 *       200:
 *         description: Updated story object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/TransferStory"
 *       400:
 *         description: Invalid description
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *       403:
 *         description: Only the sender can edit
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *       404:
 *         description: Transfer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
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
      .prepare("SELECT transferred_by_id FROM transfer_history WHERE id = ?")
      .get(transferId) as { transferred_by_id: number } | undefined;

    if (!transfer) {
      res.status(404).json({ error: "Transfer not found" });
      return;
    }

    if (transfer.transferred_by_id !== userId) {
      res.status(403).json({ error: "Only the transfer's actor can edit the story" });
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
      .prepare("SELECT username FROM users WHERE id = ?")
      .get(userId) as { username: string };

    res.json({
      description,
      editedBy: userId,
      editedByName: user.username,
      editedAt: new Date(now).toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "PUT /transfers/:id/story failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /bricks/:color/transfer
/**
 * @openapi
 * /bricks/{color}/transfer:
 *   post:
 *     tags: [Transfers]
 *     summary: Transfer a brick to a new holder
 *     operationId: transferBrick
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: color
 *         required: true
 *         schema:
 *           type: string
 *           enum: [red, blue]
 *         description: Brick color
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [to, description]
 *             properties:
 *               to:
 *                 type: integer
 *                 description: Recipient user ID
 *               description:
 *                 type: string
 *                 description: Story description for this transfer
 *               imageIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: IDs of staged images to associate
 *     responses:
 *       200:
 *         description: Transfer successful, returns updated brick state
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BrickState"
 *       400:
 *         description: Invalid color, recipient, or description
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *       403:
 *         description: >
 *           Only knights who are the current holder can transfer. The blue brick
 *           (Shame) cannot be transferred by anyone — it must be seized via
 *           /bricks/blue/seize.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
app.post("/bricks/:color/transfer", requireAuth, (req, res) => {
  const color = req.params.color as string;
  const { to, description, imageIds } = req.body;

  if (!VALID_COLORS.has(color)) {
    res.status(400).json({ error: "Invalid brick color" });
    return;
  }

  if (color === "blue") {
    res
      .status(403)
      .json({ error: "The Shame cannot be given — it must be seized" });
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

  const currentUser = db
    .prepare("SELECT role FROM users WHERE id = ?")
    .get(currentUserId) as { role: string } | undefined;

  if (!currentUser || currentUser.role !== "knight") {
    res.status(403).json({ error: "Only knights can transfer this brick" });
    return;
  }

  type TxResult =
    | { error: string; status: 404 | 400 | 403 }
    | { data: Record<string, unknown> };

  try {
    const result = db.transaction((): TxResult => {
      const current = db
        .prepare(
          `SELECT b.holder_id, u.username
           FROM brick_state b
           LEFT JOIN users u ON b.holder_id = u.id
           WHERE b.color = ?`,
        )
        .get(color) as
        | { holder_id: number | null; username: string | null }
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
        .prepare("SELECT id, username, avatar_url, role FROM users WHERE id = ?")
        .get(to) as
        | { id: number; username: string; avatar_url: string | null; role: string }
        | undefined;

      if (!recipient) {
        return { error: "Invalid recipient", status: 400 };
      }

      if (recipient.role !== "knight") {
        return {
          error: "Recipient is not a participant — only knights can hold the brick",
          status: 400,
        };
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
          holderName: recipient.username,
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
    req.log.error({ err }, "POST transfer failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /bricks/blue/seize
/**
 * @openapi
 * /bricks/blue/seize:
 *   post:
 *     tags: [Transfers]
 *     summary: Seize the Brick of Shame unto oneself
 *     description: >
 *       The Shame cannot be given by its holder — it must be claimed.
 *       Any authenticated knight other than the current holder may seize it,
 *       becoming the new holder. The description records the seizing knight's motive.
 *     operationId: seizeBlueBrick
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [description]
 *             properties:
 *               description:
 *                 type: string
 *                 description: Motive for claiming the Shame
 *               imageIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: IDs of staged images to associate
 *     responses:
 *       200:
 *         description: Seizure successful, returns updated brick state
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BrickState"
 *       400:
 *         description: Invalid or missing description
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *       403:
 *         description: Only knights other than the current holder may seize
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
app.post("/bricks/blue/seize", requireAuth, (req, res) => {
  const { description, imageIds } = req.body ?? {};

  if (!description || typeof description !== "string" || !description.trim()) {
    res.status(400).json({ error: "Description is required" });
    return;
  }

  const picIds: number[] = Array.isArray(imageIds) ? imageIds : [];
  const currentUserId = req.session.user!.id;

  const currentUser = db
    .prepare("SELECT role FROM users WHERE id = ?")
    .get(currentUserId) as { role: string } | undefined;

  if (!currentUser || currentUser.role !== "knight") {
    res.status(403).json({ error: "Only knights can seize the Shame" });
    return;
  }

  type TxResult =
    | { error: string; status: 404 | 403 }
    | { data: Record<string, unknown> };

  try {
    const result = db.transaction((): TxResult => {
      const current = db
        .prepare(
          `SELECT b.holder_id, u.username
           FROM brick_state b
           LEFT JOIN users u ON b.holder_id = u.id
           WHERE b.color = 'blue'`,
        )
        .get() as
        | { holder_id: number | null; username: string | null }
        | undefined;

      if (!current) {
        return { error: "Brick not found", status: 404 };
      }

      if (current.holder_id === currentUserId) {
        return {
          error: "Only another knight may seize the Shame",
          status: 403,
        };
      }

      const seizer = db
        .prepare("SELECT id, username, avatar_url FROM users WHERE id = ?")
        .get(currentUserId) as
        | { id: number; username: string; avatar_url: string | null }
        | undefined;

      if (!seizer) {
        return { error: "Only knights can seize the Shame", status: 403 };
      }

      const now = Date.now();
      db.prepare(
        "UPDATE brick_state SET holder_id = ?, updated_at = ? WHERE color = 'blue'",
      ).run(currentUserId, now);
      const info = db.prepare(
        "INSERT INTO transfer_history (color, from_id, to_id, transferred_by_id, transferred_at) VALUES ('blue', ?, ?, ?, ?)",
      ).run(current.holder_id, currentUserId, currentUserId, now);

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
          color: "blue",
          holderId: seizer.id,
          holderName: seizer.username,
          holderAvatarUrl: seizer.avatar_url,
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
    req.log.error({ err }, "POST seize failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/uploads/staging — upload image before transfer exists
/**
 * @openapi
 * /uploads/staging:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload a staging image before transfer creation
 *     operationId: uploadStagingImage
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, WebP, GIF, max 50 MB)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/TransferImage"
 *       400:
 *         description: Invalid or missing file
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
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
/**
 * @openapi
 * /uploads/staging/{id}:
 *   delete:
 *     tags: [Uploads]
 *     summary: Delete a staging image
 *     operationId: deleteStagingImage
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deleted:
 *                   type: boolean
 *       403:
 *         description: Only the uploader can delete
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *       404:
 *         description: Image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
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
    req.log.error({ err }, "DELETE /uploads/staging/:id failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/transfers/:id/images — upload image to existing transfer
/**
 * @openapi
 * /transfers/{id}/images:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload an image to an existing transfer
 *     operationId: uploadTransferImage
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transfer ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, WebP, GIF, max 50 MB)
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/TransferImage"
 *       403:
 *         description: Only the sender can upload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *       404:
 *         description: Transfer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
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
      .prepare("SELECT transferred_by_id FROM transfer_history WHERE id = ?")
      .get(transferId) as { transferred_by_id: number } | undefined;

    if (!transfer) {
      res.status(404).json({ error: "Transfer not found" });
      return;
    }

    if (transfer.transferred_by_id !== userId) {
      res.status(403).json({ error: "Only the transfer's actor can upload images" });
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
/**
 * @openapi
 * /transfers/{id}/images/{imageId}:
 *   delete:
 *     tags: [Uploads]
 *     summary: Delete an image from a transfer
 *     operationId: deleteTransferImage
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transfer ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deleted:
 *                   type: boolean
 *       403:
 *         description: Only the sender can delete
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *       404:
 *         description: Transfer or image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
app.delete("/transfers/:id/images/:imageId", requireAuth, (req, res) => {
  try {
    const transferId = Number(req.params.id);
    const imgId = Number(req.params.imageId);
    const userId = req.session.user!.id;

    const transfer = db
      .prepare("SELECT transferred_by_id FROM transfer_history WHERE id = ?")
      .get(transferId) as { transferred_by_id: number } | undefined;

    if (!transfer) {
      res.status(404).json({ error: "Transfer not found" });
      return;
    }

    if (transfer.transferred_by_id !== userId) {
      res.status(403).json({ error: "Only the transfer's actor can delete images" });
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
    req.log.error({ err }, "DELETE /transfers/:id/images/:imageId failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /transfers/:id/comments — marginalia glosses (oldest first)
/**
 * @openapi
 * /transfers/{id}/comments:
 *   get:
 *     tags: [Marginalia]
 *     summary: List glosses on a chronicle entry
 *     operationId: getTransferComments
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transfer ID
 *     responses:
 *       200:
 *         description: Glosses ordered chronologically (oldest first)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/TransferComment"
 *       404:
 *         description: Transfer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
app.get("/transfers/:id/comments", requireAuth, (req, res) => {
  try {
    const transferId = Number(req.params.id);
    const userId = req.session.user!.id;

    const transfer = db
      .prepare("SELECT id FROM transfer_history WHERE id = ?")
      .get(transferId);
    if (!transfer) {
      res.status(404).json({ error: "Transfer not found" });
      return;
    }

    const rows = db
      .prepare(
        `SELECT c.id, c.author_id, u.username as author_name, u.role as author_role,
                c.body, c.created_at, c.blotted_at,
                (SELECT COUNT(*) FROM transfer_comment_huzzahs h WHERE h.comment_id = c.id) as huzzah_count,
                EXISTS(SELECT 1 FROM transfer_comment_huzzahs h2 WHERE h2.comment_id = c.id AND h2.user_id = ?) as huzzahed_by_me
         FROM transfer_comments c
         JOIN users u ON c.author_id = u.id
         WHERE c.transfer_id = ?
         ORDER BY c.created_at ASC, c.id ASC`,
      )
      .all(userId, transferId) as Array<{
      id: number;
      author_id: number;
      author_name: string | null;
      author_role: string;
      body: string;
      created_at: number;
      blotted_at: number | null;
      huzzah_count: number;
      huzzahed_by_me: 0 | 1;
    }>;

    res.json(
      rows.map((r) => ({
        id: r.id,
        authorId: r.author_id,
        authorName: r.author_name ?? "Unknown",
        authorRole: r.author_role === "visitor" ? "visitor" : "knight",
        body: r.body,
        createdAt: new Date(r.created_at).toISOString(),
        blottedAt: r.blotted_at === null ? null : new Date(r.blotted_at).toISOString(),
        huzzahCount: r.huzzah_count,
        huzzahedByMe: r.huzzahed_by_me === 1,
      })),
    );
  } catch (err) {
    req.log.error({ err }, "GET /transfers/:id/comments failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /transfers/:id/comments — inscribe a gloss (any authenticated role)
/**
 * @openapi
 * /transfers/{id}/comments:
 *   post:
 *     tags: [Marginalia]
 *     summary: Inscribe a gloss on a chronicle entry
 *     operationId: addTransferComment
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transfer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [body]
 *             properties:
 *               body:
 *                 type: string
 *                 description: Gloss text (1-500 characters after trimming)
 *     responses:
 *       200:
 *         description: The created gloss
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/TransferComment"
 *       400:
 *         description: Empty or overlong gloss
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *       404:
 *         description: Transfer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
app.post("/transfers/:id/comments", requireAuth, (req, res) => {
  try {
    const transferId = Number(req.params.id);
    const userId = req.session.user!.id;
    const { body } = req.body;

    if (typeof body !== "string" || !body.trim()) {
      res.status(400).json({ error: "Gloss must be a non-empty string" });
      return;
    }
    const trimmed = body.trim();
    if (trimmed.length > 500) {
      res.status(400).json({ error: "Gloss must be 500 characters or fewer" });
      return;
    }

    const transfer = db
      .prepare("SELECT id FROM transfer_history WHERE id = ?")
      .get(transferId);
    if (!transfer) {
      res.status(404).json({ error: "Transfer not found" });
      return;
    }

    const now = Date.now();
    const info = db
      .prepare(
        "INSERT INTO transfer_comments (transfer_id, author_id, body, created_at) VALUES (?, ?, ?, ?)",
      )
      .run(transferId, userId, trimmed, now);

    const user = db
      .prepare("SELECT username, role FROM users WHERE id = ?")
      .get(userId) as { username: string; role: string };

    res.json({
      id: info.lastInsertRowid as number,
      authorId: userId,
      authorName: user.username,
      authorRole: user.role === "visitor" ? "visitor" : "knight",
      body: trimmed,
      createdAt: new Date(now).toISOString(),
      blottedAt: null,
      huzzahCount: 0,
      huzzahedByMe: false,
    });
  } catch (err) {
    req.log.error({ err }, "POST /transfers/:id/comments failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /transfers/:id/comments/:commentId/huzzah — one-shot reaction
/**
 * @openapi
 * /transfers/{id}/comments/{commentId}/huzzah:
 *   post:
 *     tags: [Marginalia]
 *     summary: Proclaim "Huzzah!" on a gloss (at most once per user)
 *     operationId: huzzahTransferComment
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transfer ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Huzzah recorded, returns the updated count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 huzzahCount:
 *                   type: integer
 *       404:
 *         description: Gloss not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *       409:
 *         description: Already huzzahed, or the gloss is blotted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
app.post("/transfers/:id/comments/:commentId/huzzah", requireAuth, (req, res) => {
  try {
    const transferId = Number(req.params.id);
    const commentId = Number(req.params.commentId);
    const userId = req.session.user!.id;

    const comment = db
      .prepare("SELECT id, blotted_at FROM transfer_comments WHERE id = ? AND transfer_id = ?")
      .get(commentId, transferId) as { id: number; blotted_at: number | null } | undefined;
    if (!comment) {
      res.status(404).json({ error: "Gloss not found" });
      return;
    }
    if (comment.blotted_at !== null) {
      res.status(409).json({ error: "This gloss is blotted" });
      return;
    }

    try {
      db.prepare(
        "INSERT INTO transfer_comment_huzzahs (comment_id, user_id, created_at) VALUES (?, ?, ?)",
      ).run(commentId, userId, Date.now());
    } catch (insertErr) {
      const code = (insertErr as { code?: string }).code ?? "";
      if (code.startsWith("SQLITE_CONSTRAINT")) {
        res.status(409).json({ error: "Thou hast already proclaimed thy huzzah!" });
        return;
      }
      throw insertErr;
    }

    const count = db
      .prepare("SELECT COUNT(*) as n FROM transfer_comment_huzzahs WHERE comment_id = ?")
      .get(commentId) as { n: number };

    res.json({ huzzahCount: count.n });
  } catch (err) {
    req.log.error({ err }, "POST /transfers/:id/comments/:commentId/huzzah failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /transfers/:id/comments/:commentId/blot — author-only soft delete
/**
 * @openapi
 * /transfers/{id}/comments/{commentId}/blot:
 *   post:
 *     tags: [Marginalia]
 *     summary: Blot out a gloss (author only, soft delete)
 *     operationId: blotTransferComment
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transfer ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Gloss blotted, returns the blot timestamp
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 blottedAt:
 *                   type: string
 *                   format: date-time
 *       403:
 *         description: Only the author can blot
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *       404:
 *         description: Gloss not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
app.post("/transfers/:id/comments/:commentId/blot", requireAuth, (req, res) => {
  try {
    const transferId = Number(req.params.id);
    const commentId = Number(req.params.commentId);
    const userId = req.session.user!.id;

    const comment = db
      .prepare("SELECT id, author_id, blotted_at FROM transfer_comments WHERE id = ? AND transfer_id = ?")
      .get(commentId, transferId) as { id: number; author_id: number; blotted_at: number | null } | undefined;
    if (!comment) {
      res.status(404).json({ error: "Gloss not found" });
      return;
    }
    if (comment.author_id !== userId) {
      res.status(403).json({ error: "Only the author can blot this gloss" });
      return;
    }

    const now = Date.now();
    db.prepare(
      "UPDATE transfer_comments SET blotted_at = ? WHERE id = ? AND blotted_at IS NULL",
    ).run(now, commentId);

    const row = db
      .prepare("SELECT blotted_at FROM transfer_comments WHERE id = ?")
      .get(commentId) as { blotted_at: number };

    res.json({ blottedAt: new Date(row.blotted_at).toISOString() });
  } catch (err) {
    req.log.error({ err }, "POST /transfers/:id/comments/:commentId/blot failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /transfers/:id/comments/:commentId — author-only hard delete (chisel)
/**
 * @openapi
 * /transfers/{id}/comments/{commentId}:
 *   delete:
 *     tags: [Marginalia]
 *     summary: Chisel a blotted gloss from the record (author only, hard delete)
 *     operationId: deleteTransferComment
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Transfer ID
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Gloss deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deleted:
 *                   type: boolean
 *       403:
 *         description: Only the author can chisel
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 *       404:
 *         description: Gloss not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
app.delete("/transfers/:id/comments/:commentId", requireAuth, (req, res) => {
  try {
    const transferId = Number(req.params.id);
    const commentId = Number(req.params.commentId);
    const userId = req.session.user!.id;

    const comment = db
      .prepare("SELECT id, author_id FROM transfer_comments WHERE id = ? AND transfer_id = ?")
      .get(commentId, transferId) as { id: number; author_id: number } | undefined;
    if (!comment) {
      res.status(404).json({ error: "Gloss not found" });
      return;
    }
    if (comment.author_id !== userId) {
      res.status(403).json({ error: "Only the author can chisel this gloss" });
      return;
    }

    db.transaction(() => {
      db.prepare("DELETE FROM transfer_comments WHERE id = ?").run(commentId);
    })();

    res.json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /transfers/:id/comments/:commentId failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/uploads/:filename — serve image (authenticated)
/**
 * @openapi
 * /uploads/{filename}:
 *   get:
 *     tags: [Uploads]
 *     summary: Serve an uploaded image file
 *     operationId: getUploadedImage
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Image filename
 *     responses:
 *       200:
 *         description: Image file
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Error"
 */
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
    req.log.error({ err }, "GET /uploads/:filename failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;
/**
 * Production entry point. Mounts the Express app from `./app` and serves the
 * built SPA from `dist/public` for everything that isn't `/api/*`.
 *
 * In development, `vite dev` mounts `./app` via `configureServer` middleware
 * instead — see `vite.config.ts`. The Express app itself is identical in both.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import app from "./app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "dist", "public");

// Serve built SPA assets (JS, CSS, images, fonts) for non-API paths.
app.use(express.static(distDir));

// SPA fallback: any GET that isn't an API call and didn't match a static file
// returns index.html so client-side routing (wouter) can take over.
app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path === "/api") return next();
  if (req.method !== "GET") return next();
  res.sendFile(path.join(distDir, "index.html"));
});

const rawPort = process.env.PORT;
if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, () => {
  console.log(`Brick Tracker listening on :${port}`);
});
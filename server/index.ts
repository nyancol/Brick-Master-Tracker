/**
 * Production entry point. Wraps the API app with static file serving and
 * SPA fallback, then starts the server.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import app from "./app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "dist", "public");

const server = express();
server.use("/api", app);
server.use(express.static(distDir));

// SPA fallback — any non-API GET returns index.html
server.use((req, res, next) => {
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

server.listen(port, () => {
  console.log(`Brick Tracker listening on :${port}`);
});
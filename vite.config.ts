import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import dotenv from "dotenv";

/**
 * Vite plugin that mounts the Express API (server/app.ts) onto /api in dev.
 *
 * NOTE: edits to server/ files do NOT hot-reload the API. Restart `pnpm dev`
 * after server changes.
 */
function apiPlugin(): Plugin {
  return {
    name: "brick-tracker-api",
    async configureServer(server) {
      dotenv.config();
      const mod = await server.ssrLoadModule("/server/app.ts");
      server.middlewares.use("/api", mod.default);
    },
  };
}

export default defineConfig({
  plugins: [apiPlugin(), react(), tailwindcss()],
  ssr: {
    external: ["better-sqlite3"],
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    fs: { strict: true },
  },
  preview: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
/**
 * Bundles the Express server (server/index.ts) into ESM files for
 * production. All npm packages are external — the runtime resolves them
 * from node_modules.
 *
 * Chunk layout:
 * - dist/logger.js     — the pino logger, shared by the two chunks below so
 *                        there is exactly ONE logger instance per process.
 * - dist/telemetry.mjs — OpenTelemetry bootstrap. Injected as a banner import
 *                        into server.mjs so it evaluates BEFORE every other
 *                        import. Bundling it into the server chunk would hoist
 *                        all external imports (express → http, …) above the
 *                        SDK bootstrap, and the OpenTelemetry require-hook
 *                        would miss the modules it needs to patch (no spans,
 *                        no metrics).
 * - dist/server.mjs    — the application entry point.
 */
import { build } from "esbuild";

const common = {
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  sourcemap: "linked",
  packages: "external",
  logLevel: "info",
};

await build({
  ...common,
  entryPoints: ["server/logger.ts"],
  outfile: "dist/logger.js",
  external: ["./logger.js"],
});

await build({
  ...common,
  entryPoints: ["server/telemetry.ts"],
  outfile: "dist/telemetry.mjs",
  external: ["./logger.js"],
});

await build({
  ...common,
  entryPoints: ["server/index.ts"],
  outfile: "dist/server.mjs",
  banner: {
    js: 'import "./telemetry.mjs";',
  },
  external: ["./logger.js"],
});

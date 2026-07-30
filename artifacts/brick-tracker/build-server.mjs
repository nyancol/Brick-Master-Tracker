/**
 * Bundles the Express server (server/index.ts) into a single ESM file for
 * production. All npm packages are external — the runtime image resolves
 * them from node_modules installed by `pnpm deploy --prod`.
 */
import { build } from "esbuild";

await build({
  entryPoints: ["server/index.ts"],
  outfile: "dist/server.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  sourcemap: "linked",
  packages: "external",
  logLevel: "info",
  banner: {
    // node --import tsx style loader isn't needed in prod; just ensure
    // .js extension on the relative imports between our own files works
    // when Node resolves the bundled output.
    js: "",
  },
});
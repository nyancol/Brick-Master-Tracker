# Brick Master Tracker

A simple webapp that tracks who currently holds the red brick and who holds the blue brick among three friends (Yann, Anselme, Thomas), with a transfer history.

## Run & Operate

- `pnpm dev` — start the app on `http://localhost:5173` (Vite dev server with API middleware; SQLite DB at `./brick.db` next to the working directory)
- `pnpm build` — typecheck and build the SPA (`dist/public/`) + bundle the server (`dist/server.mjs`)
- `pnpm start` — run the production bundle (requires `PORT` env var; serves SPA at `/` and API at `/api/*` from one process; reads `DB_PATH` for the SQLite file location)
- `pnpm typecheck` — TypeScript check
- `pnpm db:push` — create the SQLite tables (`brick_state`, `transfer_history`)
- `pnpm db:seed` — idempotent seed: insert initial brick holders (Yann→red, Thomas→blue) if they don't exist

First-time local setup:
```
pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Single deployable app under `artifacts/brick-tracker/`:
  - `src/` — React 19 SPA (Vite + Tailwind v4 + shadcn-derived components, i18next EN/FR)
  - `server/` — Express 5 + Drizzle ORM (SQLite via `better-sqlite3`) + Pino logging
  - `drizzle.config.ts` — Drizzle Kit config
  - `build-server.mjs` — esbuild config for the production server bundle
- DB: SQLite (`better-sqlite3`, in-process native addon)
- Validation: Zod (`zod/v4`)
- Build: Vite for the SPA, esbuild for the server (both output to `dist/`)

## Where things live

- `artifacts/brick-tracker/src/api/` — hand-written React Query hooks (`useBricks`, `useTransfers`, `useTransferBrick`) and types
- `artifacts/brick-tracker/server/` — Express app, routes, validation, Drizzle schema, client, and seed
- `artifacts/brick-tracker/server/routes/bricks.ts` — the only business-logic file (transfer brick, list state, list history)
- `artifacts/brick-tracker/server/db/schema.ts` — Drizzle table definitions (`brick_state`, `transfer_history`)
- `artifacts/brick-tracker/server/db/seed.ts` — idempotent initial-data seed
- `artifacts/brick-tracker/server/validation.ts` — Zod schemas for the API
- `artifacts/brick-tracker/public/` — brick images and other static assets
- `artifacts/brick-tracker/src/components/ui/` — the (trimmed) shadcn component set: `button`, `card`, `toast`, `toaster`, `tooltip`

## Architecture decisions

- **One app, one process.** The API is mounted in the Vite dev server via `configureServer` middleware, and the production Express bundle serves both `/api/*` and the static SPA from `dist/public`. No second process, no CORS, no separate build pipeline.
- **No codegen.** Hand-written `src/api/{queries,mutations,types}.ts` and `server/validation.ts`. The contract is small enough (3 routes, 2 tables) that generated Zod schemas and Orval React Query hooks were more code than they replaced.
- **SQLite over Postgres.** Three friends, one Node process, no multi-host writes needed. The DB is a single file in the working directory by default; in Docker the volume mount at `/app/deploy/data` persists it across container recreations. No separate DB process, no port 5432, no connection string.
- **Externalise npm packages in the server bundle.** `build-server.mjs` uses `packages: "external"` so the runtime image installs deps via `pnpm deploy --prod` and the bundle only contains our app code.

## Product

A landing page showing the current holder of each brick (red = "honor", blue = "shame"), with transfer buttons for the other two friends. Below the bricks is a history of every transfer, most recent first. Available in English and French.

## Gotchas

- **Editing server files does not hot-reload the API.** Vite invalidates the module in its graph, but the mounted Express middleware stays bound to the previous instance. Restart `pnpm dev` after any change under `server/`.
- **`better-sqlite3` is a native addon.** It's externalised in `vite.config.ts` so Vite's SSR loader doesn't try to bundle it, and it's whitelisted in `onlyBuiltDependencies` in `pnpm-workspace.yaml` so its install script (which verifies the prebuilt binary) runs during `pnpm install`.
- **Do not run multiple replicas of the brick-tracker container pointed at the same SQLite file.** SQLite assumes exclusive write access. If you autoscale to 2 instances, both Node processes will try to write to `brick.db` simultaneously → corruption. For this app (3 friends, single instance) this is not a concern.
- **The Express bundle is at `dist/server.mjs`.** Don't confuse with `dist/public/` which holds the SPA assets; both ship together in the Docker image.
- **`pino-pretty` is a dev-only transport** (gated on `NODE_ENV !== "production"`). It is correctly listed under `devDependencies` and won't be installed in the runtime image.
- **Container user is `appuser` (UID 1001).** If you bind-mount a host directory over `/app/deploy/data`, make sure the appuser can write to it (chown 1001:1001 on the host side, or just use a named volume which Docker manages permissions for).

## Pointers

- See `pnpm-workspace` skill for workspace structure and TypeScript setup details
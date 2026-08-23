# Brick Master Tracker

A full-stack tracking app for two legendary Lego bricks — the **Brick of Honor** and the **Brick of Shame** — passed between friends.

Built with React, Express, SQLite, and Tailwind CSS. Fully containerised, dark-themed, i18n-ready (EN/FR).

---

## Architecture Overview

```mermaid
graph TB
    subgraph Client["Browser (SPA)"]
        direction TB
        react["React 19 + Vite"]
        wouter["wouter (client-side router)"]
        query["@tanstack/react-query"]
        i18n["react-i18next (EN/FR)"]
        ui["Radix UI + Tailwind CSS v4"]
    end

    subgraph Server["Express Server (single process)"]
        direction TB
        pino["pino-http logger"]
        validator[("Zod v4 validators")]
        routes["/api/* routes"]
        tx["db.transaction (atomic)"]
        drizzle["Drizzle ORM"]
        sqlite[("better-sqlite3\n(WAL mode)")]
    end

    subgraph FileSystem["Host filesystem"]
        dbFile[("brick.db")]
        wal[("brick.db-wal")]
        shm[("brick.db-shm")]
    end

    Client -->|"GET /api/bricks\nGET /api/transfers\nPOST /api/bricks/:color/transfer"| Server
    Client -->|"SPA fallback — GET /*"| Server
    Server --> drizzle --> sqlite --> FileSystem
```

---

## Request Flow: Dev vs Production

In **development**, Vite's dev server mounts the Express API as middleware:

```mermaid
flowchart LR
    subgraph Dev["pnpm dev"]
        vite["Vite dev server (:5173)"]
        hmr["HMR + React Fast Refresh"]
        apiDev["API middleware\n(via vite.config.ts)"]
        vite --> hmr
        vite -->|"/api/*"| apiDev --> expressDev["Express app.ts"]
    end
    browser["Browser"] --> vite
```

In **production**, a single Express process serves both the SPA and API:

```mermaid
flowchart LR
    subgraph Prod["pnpm start (server/index.ts)"]
        expressProd["Express (:5000)"]
        apiProd["/api/* → app.ts"]
        static["dist/public/* (static files)"]
        fallback["SPA fallback → index.html"]
        expressProd --> apiProd
        expressProd --> static
        expressProd --> fallback
    end
    browser2["Browser"] --> expressProd
```

---

## Directory Structure

```
.
├── Dockerfile                           # Multi-stage build (node:24-alpine)
├── pnpm-workspace.yaml                  # Workspace root, catalog, onlyBuiltDependencies
├── tsconfig.base.json                   # Shared strict TS config
├── tsconfig.json                        # Project references → artifacts/brick-tracker
├── .env.example                         # PORT, DB_PATH
├── shell.nix                            # Nix dev shell (node 22, pnpm, git)
│
└── artifacts/brick-tracker/
    ├── package.json                     # @workspace/brick-tracker
    ├── tsconfig.json                    # includes src/, server/, shared/
    ├── vite.config.ts                   # Vite + API dev plugin + @ alias + SSR externals
    ├── build-server.mjs                 # esbuild bundle → dist/server.mjs
    ├── drizzle.config.ts                # drizzle-kit push (SQLite)
    ├── index.html                       # HTML shell
    │
    ├── shared/
    │   └── constants.ts                 # FRIENDS array — single source of truth
    │
    ├── server/
    │   ├── index.ts                     # Production entry: Express + static + SPA fallback
    │   ├── app.ts                       # Express app: pino-http + JSON + router mount
    │   ├── logger.ts                    # pino (pino-pretty in dev)
    │   ├── validation.ts                # Zod schemas (imports FRIENDS from shared/)
    │   ├── routes/
    │   │   ├── index.ts                 # Aggregates health + bricks routers
    │   │   ├── health.ts                # GET /healthz
    │   │   └── bricks.ts                # GET /bricks, POST /bricks/:color/transfer, GET /transfers
    │   └── db/
    │       ├── client.ts                # better-sqlite3 + Drizzle init (WAL pragma)
    │       ├── schema.ts                # brick_state + transfer_history tables
    │       └── seed.ts                  # Idempotent seed script
    │
    └── src/
        ├── main.tsx                     # React root mount
        ├── App.tsx                      # ErrorBoundary → QueryClient → Tooltip → Router
        ├── i18n.ts                      # i18next init (EN/FR, localStorage)
        ├── index.css                    # Tailwind v4 + custom dark theme + font faces
        ├── api/
        │   ├── types.ts                 # BrickState, Transfer, TransferInput
        │   ├── fetch.ts                 # Shared fetchJson helper
        │   ├── queries.ts              # useBricks, useTransfers (react-query)
        │   └── mutations.ts            # useTransferBrick (react-query)
        ├── components/
        │   ├── ErrorBoundary.tsx        # Class-based React error boundary
        │   └── ui/                      # shadcn-style primitives
        │       ├── button.tsx
        │       ├── card.tsx
        │       ├── toast.tsx
        │       ├── toaster.tsx
        │       └── tooltip.tsx
        ├── hooks/
        │   └── use-toast.ts            # Toast state manager (reducer pattern)
        ├── lib/
        │   └── utils.ts                # cn() helper (clsx + twMerge)
        ├── locales/
        │   ├── en.ts
        │   └── fr.ts
        └── pages/
            ├── home.tsx                # Main page: brick cards + transfer ledger
            └── not-found.tsx           # 404 page (dark themed, i18n)
```

---

## Component Tree

```mermaid
flowchart TD
    main["main.tsx\ncreateRoot()"] --> App
    App --> EB["ErrorBoundary"]
    EB --> QCP["QueryClientProvider"]
    QCP --> TP["TooltipProvider"]
    TP --> WR["WouterRouter (base path)"]
    WR --> Switch["Switch"]
    Switch --> Home["Home (/)"] & NotFound["NotFound (*)"]

    Home --> Cards["Brick Cards\ngrid md:grid-cols-2"]
    Home --> History["Transfer Ledger"]

    subgraph Home Composition
        direction LR
        useBricks["useBricks()"] --> Cards
        useTransfers["useTransfers()"] --> History
        useTransferBrick["useTransferBrick()"] --> Cards
        useToast["useToast()"] --> Cards
    end
```

---

## Database Schema

```mermaid
erDiagram
    BRICK_STATE {
        text color PK "red | blue"
        text holder "Yann | Anselme | Thomas"
        integer updated_at "timestamp → Date"
    }

    TRANSFER_HISTORY {
        integer id PK "auto-increment"
        text color "red | blue"
        text from_holder
        text to_holder
        integer transferred_at "timestamp → Date"
    }

    BRICK_STATE ||--o{ TRANSFER_HISTORY : "referenced by (color)"
```

There are exactly **two rows** in `brick_state` — seeded idempotently via `pnpm db:seed`:

| color | holder (default) |
|-------|-----------------|
| red   | Yann            |
| blue  | Thomas          |

`transfer_history` grows unbounded with every transfer.

---

## API Routes

| Method | Path | Body | Response | Notes |
|--------|------|------|----------|-------|
| `GET` | `/api/healthz` | — | `{ status: "ok" }` | Past-proven by Zod |
| `GET` | `/api/bricks` | — | `BrickState[]` | Current holder for each colour |
| `GET` | `/api/transfers` | — | `Transfer[]` | Descending by `transferredAt` |
| `POST` | `/api/bricks/:color/transfer` | `{ to: "Yann" \| "Anselme" \| "Thomas" }` | `BrickState` | Atomic transaction |

### Transfer endpoint flow

```mermaid
sequenceDiagram
    participant Client
    participant Express
    participant Zod
    participant Drizzle
    participant SQLite

    Client->>Express: POST /api/bricks/red/transfer { to: "Anselme" }
    Express->>Zod: safeParse(params + body)
    alt invalid
        Zod-->>Client: 400 Bad Request
    else valid
        Express->>Drizzle: db.transaction()
        Drizzle->>SQLite: SELECT ... WHERE color = 'red'
        SQLite-->>Drizzle: { holder: "Yann" }
        alt holder === to
            Drizzle-->>Client: 400 "Cannot transfer to current holder"
        else different holder
            Drizzle->>SQLite: UPDATE brick_state SET holder = 'Anselme'
            Drizzle->>SQLite: INSERT INTO transfer_history (...)
            Drizzle-->>Express: { updated row }
            Express-->>Client: 200 JSON
        end
    end
```

---

## Docker Build Pipeline

```mermaid
flowchart LR
    subgraph Stage1["Stage 1: build (node:24-alpine)"]
        deps["pnpm install\n(with build-base + python3)"] --> vite["vite build → dist/public/"]
        deps --> esbuild["esbuild → dist/server.mjs"]
        vite --> deploy["pnpm deploy --prod → /app/deploy/"]
        esbuild --> deploy
    end

    subgraph Stage2["Stage 2: production (node:24-alpine)"]
        copy["COPY --from=build /app/deploy"] --> run["node dist/server.mjs"]
        volume["/app/deploy/data/ (volume mount)"] --> run
    end

    Stage1 --> Stage2
```

Key details:
- **Multi-stage build** keeps the final image lean (no build tools).
- **`pnpm deploy --prod`** produces a self-contained directory with only runtime dependencies.
- **Non-root user** (`appuser:appgroup`, uid 1001) for security.
- **Volume mount** at `/app/deploy/data` persists the SQLite database across container restarts.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 24 |
| **Language** | TypeScript 5.9 (strict mode) |
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, Radix UI, wouter, @tanstack/react-query |
| **Backend** | Express 5, pino (structured logging) |
| **Database** | SQLite via better-sqlite3, Drizzle ORM |
| **Validation** | Zod v4 |
| **Bundling** | Vite (SPA), esbuild (server) |
| **i18n** | i18next + react-i18next (EN, FR) |
| **Container** | Docker multi-stage (Alpine) |
| **Dev env** | Nix shell (node, pnpm, git) |

---

## Development

```bash
# Install dependencies
pnpm install

# Start dev server (Vite + Express API on :5173)
pnpm dev

# Type-check only
pnpm typecheck

# Build for production
pnpm build

# Run production server
pnpm start

# Push database schema
pnpm db:push

# Seed initial data (idempotent)
pnpm --filter @workspace/brick-tracker db:seed
```

### Docker

```bash
docker build -t brick-tracker .
docker run -v brick-data:/app/deploy/data -p 5000:5000 brick-tracker
```
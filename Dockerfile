# =============================================================================
# Stage 1: Build — install deps, build the SPA, bundle the server.
# =============================================================================
FROM node:24-alpine AS build

RUN corepack enable && corepack prepare pnpm@9

WORKDIR /app

# Copy workspace configuration and lockfile first so pnpm can resolve
# workspace protocols and so dependency install is cacheable.
COPY package.json         ./
COPY pnpm-workspace.yaml  ./
COPY tsconfig.base.json   ./
COPY pnpm-lock.yaml       ./
COPY .npmrc               ./

# Copy the workspace package.
COPY artifacts/brick-tracker ./artifacts/brick-tracker

# build-base pulls in gcc/g++/binutils/libc-dev/make so node-gyp can compile
# native modules (better-sqlite3 has no prebuilt for arm64/musl/Node 24).
# python3 is required by node-gyp itself.
RUN apk add --no-cache build-base python3 && ln -sf python3 /usr/bin/python
RUN pnpm install --no-frozen-lockfile

# vite build writes the SPA to dist/public; build-server.mjs bundles the
# Express server into dist/server.mjs (with all npm deps externalised).
RUN pnpm --filter @workspace/brick-tracker run build

# Run `pnpm deploy` here (inside the workspace) so pnpm can resolve the
# runtime dependency tree for the @workspace/brick-tracker package into a
# self-contained directory. better-sqlite3's install script must run (it
# verifies/downloads the native binding); it is whitelisted via
# onlyBuiltDependencies in pnpm-workspace.yaml.
RUN pnpm --filter @workspace/brick-tracker deploy --prod --legacy ./deploy

# =============================================================================
# Stage 2: Production — bundled output + pre-built deploy dir + SQLite data.
# =============================================================================
FROM node:24-alpine AS production

RUN addgroup -g 1001 -S appgroup && \
    adduser  -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copy the pre-built self-contained deploy directory (runtime deps +
# dist/server.mjs + dist/public already copied in below).
COPY --from=build /app/deploy ./deploy

# Create the SQLite data directory and grant ownership to appuser. Mount a
# volume here in your run command to persist brick.db across container
# recreations:
#   docker run -v brick-data:/app/deploy/data -p 5000:5000 brick-tracker
# Or in compose:
#   volumes:
#     - brick-data:/app/deploy/data
RUN mkdir -p /app/deploy/data && chown -R appuser:appgroup /app/deploy/data
VOLUME /app/deploy/data

WORKDIR /app/deploy

ENV NODE_ENV=production
# The Express bundle requires PORT (see server/index.ts).
ENV PORT=5000
# Defaults the DB file location inside the volume-mounted data dir.
ENV DB_PATH=/app/deploy/data/brick.db

USER appuser

EXPOSE 5000

# The Express bundle serves both /api/* and the static SPA from dist/public.
CMD ["node", "./dist/server.mjs"]

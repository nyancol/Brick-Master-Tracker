# =============================================================================
# Stage 1: Build
# =============================================================================
# Full Node.js 24 toolchain: pnpm, devDependencies, esbuild, TypeScript, etc.
FROM node:24-alpine AS build

RUN corepack enable && corepack prepare pnpm@9

WORKDIR /app

# Copy workspace configuration so pnpm understands the workspace protocol
# and tsconfig.base.json is available for type-checking.
COPY package.json         ./
COPY pnpm-workspace.yaml  ./
COPY tsconfig.base.json  ./
COPY .npmrc              ./

# Copy all source — lib/ packages are tsconfig project-references used by
# api-server, and artifacts/ contains all workload packages.
COPY lib/       lib/
COPY artifacts/ artifacts/

# Install all dependencies (including devDependencies — esbuild, tsx, and
# other dev-only tooling are required by the build scripts).
RUN pnpm install --frozen-lockfile

# Build the monorepo.  Root `build` runs typecheck then `pnpm -r build` for
# every workspace package.  api-server's script uses esbuild to bundle
# src/index.ts → dist/index.mjs.
RUN pnpm run build

# =============================================================================
# Stage 2: Production
# =============================================================================
FROM node:24-alpine AS production

# Create a non-root user for security.
RUN addgroup -g 1001 -S appgroup && \
    adduser  -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copy the lockfile and the api-server package manifest from the build stage.
# The esbuild bundle (dist/index.mjs) is fully self-contained — all workspace
# source is inlined — but runtime packages (express, pino, pg, drizzle-orm,
# etc.) are external and must be installed here.
COPY --from=build /app/pnpm-lock.yaml                  ./pnpm-lock.yaml
COPY --from=build /app/artifacts/api-server/package.json ./package.json

# pnpm deploy reads package.json from the deploy root, resolves workspace://
# URLs from the lockfile, and copies only the actual runtime dependencies
# (no devDependencies, no source files) into ./deploy/.
RUN pnpm deploy --prod --ignore-scripts ./deploy

# Copy the esbuild bundle into the deploy root.
COPY --from=build /app/artifacts/api-server/dist ./deploy/dist

WORKDIR /app/deploy

ENV NODE_ENV=production

USER appuser

EXPOSE 5000

# api-server's start script: node --enable-source-maps ./dist/index.mjs
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]

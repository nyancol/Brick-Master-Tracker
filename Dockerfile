# =============================================================================
# Stage 1: Build dependencies, compile SPA, bundle server.
# =============================================================================
FROM node:24-alpine AS build

RUN corepack enable && corepack prepare pnpm@9
RUN apk add --no-cache build-base python3 && ln -sf python3 /usr/bin/python

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Type-check + Vite SPA build + esbuild server bundle
RUN pnpm build

# Strip devDependencies from node_modules for the production stage
RUN pnpm prune --prod

# =============================================================================
# Stage 2: Production — compiled binaries + runtime deps only.
# =============================================================================
FROM node:24-alpine AS production

RUN addgroup -g 1001 -S appgroup && adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist          ./dist
COPY --from=build /app/package.json  ./

RUN mkdir -p /app/data && chown -R appuser:appgroup /app
VOLUME /app/data

ENV NODE_ENV=production
ENV PORT=5000
ENV DB_PATH=/app/data/brick.db

USER appuser
EXPOSE 5000

CMD ["node", "dist/server.mjs"]
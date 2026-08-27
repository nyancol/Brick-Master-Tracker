# =============================================================================
# Stage 1: Build the SPA + bundle the server.
# =============================================================================
FROM node:24-alpine AS build

RUN corepack enable
RUN apk add --no-cache build-base python3 && ln -sf python3 /usr/bin/python

WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./
ENV PNPM_CI=true
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# =============================================================================
# Stage 2: Production.
# =============================================================================
FROM node:24-alpine AS production

RUN corepack enable
RUN apk add --no-cache build-base python3 && ln -sf python3 /usr/bin/python && npm install -g node-gyp

WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./
ENV PNPM_CI=true

# Ignore build scripts during install, then manually compile native modules
RUN pnpm install --frozen-lockfile --prod --ignore-scripts && \
    cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 && \
    node-gyp rebuild

# Copy built artifacts from build stage
COPY --from=build /app/dist ./dist

RUN mkdir -p /app/data
VOLUME /app/data

ENV NODE_ENV=production
ENV PORT=5000

USER node
EXPOSE 5000

CMD ["node", "dist/server.mjs"]

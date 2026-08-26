## Context

The app authenticates exclusively via OIDC (`server/auth.ts` + `/api/auth/login`/`/callback`). In local development without a reachable provider, `initOidc()` fails discovery and `/api/auth/login` returns 503, so there is no way to sign in and exercise the multi-user transfer flow (who holds each brick, the recipient picker, transfer authorization). Testing currently requires real provider accounts.

The `users` table already stores `sub`, `email`, `display_name`, `username`, and `avatar_url`, and `upsertUser(sub, email, displayName, username, avatarUrl)` already provides idempotent upsert semantics. We can reuse this rather than introducing new storage.

## Goals / Non-Goals

**Goals:**
- Let a developer sign in as one of the three canonical friends (Yann, Anselme, Thomas) with one click, no OIDC provider required.
- Make the transfer flow immediately testable in dev by seeding users and bootstrapping brick ownership on a fresh DB.
- Keep the production surface unchanged: no dev login routes or seeded users in production.

**Non-Goals:**
- No changes to the OIDC login/callback/session flow itself.
- No new database tables or schema migrations.
- No admin/user management UI — only a fixed set of three test users.
- No auto-login (the developer explicitly picks a user).

## Decisions

### Test users as a fixed, code-defined list
Define the three test users in `server/auth.ts` (or a small `server/dev-users.ts`) with synthetic subjects under a `dev:` namespace (e.g. `dev:yann`, `dev:anselme`, `dev:thomas`). Reuse `upsertUser` for idempotent seeding.
- **Alternative considered**: Read test users from env vars. Rejected — unnecessary config for a fixed, private app; three hard-coded friends match the app's domain.

### Enablement flag: `NODE_ENV !== "production"` plus `DEV_LOGIN` opt-out
`isDevLoginEnabled()` returns true iff `NODE_ENV !== "production"` AND `DEV_LOGIN !== "false"`. In the Vite dev server `NODE_ENV` is not `"production"`, so this is on by default in dev; the Docker production image sets `NODE_ENV=production`, so it is off. `DEV_LOGIN=false` allows explicit opt-out.
- **Alternative considered**: A separate `DEV_LOGIN=1` opt-in flag. Rejected — it would require editing env to get the out-of-the-box dev experience the request asks for.

### Two new routes mounted under the existing `/api` app
- `GET /api/auth/dev` — unauthenticated, always registered; returns `{ enabled, users }` (empty list when disabled). This is the client's availability flag.
- `POST /api/auth/dev/login` — registered only when `isDevLoginEnabled()`; body `{ username }`; upserts the user, writes `req.session.user`, returns the `getAuthMe(userId)` payload. Internally guarded to 404 when disabled (defense in depth).
- **Alternative considered**: A query param on `/auth/login` (e.g. `/auth/login?dev=yann`). Rejected — a POST with an explicit body keeps the OIDC GET flow clean and makes intent explicit.

### Seeding and bootstrap happen at startup
`seedDevUsers()` upserts the three test users and `bootstrapDevBricks()` assigns red→Yann, blue→Thomas when `brick_state` is empty. Both run from `app.ts` startup only when `isDevLoginEnabled()`, mirroring the existing `maybeBootstrapBricks` guard (only bootstraps an empty table).
- **Alternative considered**: Seed lazily on first dev login. Rejected — startup seeding guarantees the test users are present in the picker and recipient lists before any login.

### Client: fetch config, render picker, reload on success
`src/api.ts` gains `fetchDevLoginConfig()` (`GET /api/auth/dev`) and `devLogin(username)` (`POST /api/auth/dev/login`). `src/pages/login.tsx` fetches the config on mount and, when `enabled`, renders a button per test user alongside the existing OIDC "Sign in" button. On successful login it reloads the page so `useCurrentUser()` re-fetches `/api/auth/me`. The OIDC "Sign in" button is left in place so real login remains possible when a provider is configured.

## Risks / Trade-offs

- **Risk**: A developer forgets `DEV_LOGIN` and accidentally ships dev routes. → Mitigation: gating is also checked inside the endpoint; production `NODE_ENV=production` disables regardless; documented in README.
- **Risk**: Seeded test users colliding with a real OIDC user's `sub`. → Mitigation: synthetic `dev:`-prefixed subjects are disjoint from provider-issued subs.
- **Risk**: Bootstrap overwriting real data. → Mitigation: bootstrap only runs when `brick_state` is empty, identical to the existing bootstrap contract.
- **Risk**: `/api/auth/dev` leaking user lists in production. → Mitigation: returns `{ enabled: false, users: [] }` in production; leaks nothing.

## Migration Plan

- No DB migrations. Existing dev DBs get the three test users seeded on next dev startup; existing bricks are untouched because bootstrap only fires on empty `brick_state`.
- Rollback: revert the change; no cleanup required beyond optionally deleting seeded `dev:` users.

## Open Questions

None.

## Context

Brick Master Tracker is a full-stack app (React 19, Express 5, SQLite) for tracking two Lego bricks passed between friends. Currently there is zero authentication — the three friend names are hardcoded in `shared/constants.ts` and anyone with the URL can transfer bricks. The holder and transfer records use plain text names with no referential integrity.

We are adding OIDC authentication targeting Pocket ID (self-hosted generic OIDC provider). This introduces user identity, session management, and authorization rules to the system. The database schema changes from name-based strings to foreign keys referencing a `users` table.

**Constraints:**
- Single Express process, SQLite database — no Redis, no separate auth service
- Derive a minimal stack with few new dependencies
- Support generic OIDC (not Google-specific)
- Docker deployment behind Caddy
- No existing users or migrations — this is a clean break

## Goals / Non-Goals

**Goals:**
- Authenticate users via generic OIDC (the solution should support any OIDC service though know that it will be mostly used with Pocket ID) with login/logout
- Store user identity in SQLite, with session cookies via express-session
- Replace hardcoded FRIENDS with a dynamic users table
- Enforce that only the current brick holder can transfer their brick
- Track who performed each transfer (`transferred_by`)
- Seed initial brick owners via environment variables
- Gate app behind login — unauthenticated users see a login screen
- Any authenticated user can be a transfer recipient

**Non-Goals:**
- Multi-tenancy or multiple brick groups
- OAuth scopes or API access tokens (only ID tokens matter)
- Email providers beyond OIDC
- User registration/approval workflow (anyone who logs in via OIDC is a user)
- Server-side rendering of auth state (SPA handles login UI)
- Admin UI for managing users

## Decisions

### 1. Session strategy: express-session + SQLite store over JWT

**Chosen:** `express-session` with a SQLite-backed session store.

**Rationale:**
- Session cookies are httpOnly by default — immune to XSS token theft
- Session revocation is a single DELETE row — no blocklist or token invalidation needed
- No token management on the client side — browser sends the cookie automatically
- Fits the existing "SQLite for everything" pattern — one more table, zero new infrastructure
- Express 5 has first-class middleware for sessions

**Alternatives considered:**
- *JWT in httpOnly cookie*: Stateless but can't revoke individual sessions. Would need a blocklist table for logout — same complexity as sessions but less standard.
- *JWT in localStorage*: Rejected on security grounds (XSS-vulnerable).
- *OIDC-only session* (validate Pocket ID token on every request): Adds latency and creates a hard dependency on Pocket ID being reachable for every API call.

### 2. Session store: better-sqlite3-session-store

**Chosen:** `better-sqlite3-session-store` — a dedicated package that implements the express-session Store interface backed by better-sqlite3.

**Rationale:** Uses the same `better-sqlite3` instance as the rest of the app. A `sessions` table is created automatically. No network necessary.

**Alternatives considered:**
- *connect-sqlite3*: Less actively maintained, not specific to better-sqlite3
- *Cookie-session*: Stores session data in the cookie itself — limited to ~4KB, exposes session data to client. Not suitable for OIDC token storage.

### 3. OIDC library: openid-client over passport

**Chosen:** `openid-client` — the certified Node.js OIDC Relying Party library.

**Rationale:**
- Handles discovery (`/.well-known/openid-configuration`), PKCE (optional), token exchange, JWKS verification, and ID token validation
- Full OIDC spec compliance — works with any provider (Pocket ID, Google, Keycloak, etc.)
- Light enough for our needs without the abstraction layer of Passport
- Actively maintained by the OpenID Foundation

**Alternatives considered:**
- *Passport.js + passport-openidconnect*: Adds an abstraction layer we don't need. Passport's strategy pattern is overkill for a single OIDC provider.
- *Rolling our own* with `jose`: Feasible but error-prone. ID token validation, nonce verification, and state parameter management are easy to get wrong.

### 4. Database schema: FK-based user references

**Chosen:** Internal integer `users.id` as the PK with `users.sub` as the unique OIDC subject identifier. Brick holders and transfer history reference `users.id`.

```
users                brick_state           transfer_history
┌────────┐           ┌──────────────┐      ┌───────────────────┐
│ id     │◀──────────│ holder_id    │      │ from_id           │
│ sub    │           │ color        │◀─────│ to_id             │
│ email  │           │ updated_at   │      │ color             │
│ display│           └──────────────┘      │ transferred_by_id │
│ avatar │                                │ transferred_at   │
└────────┘                                └───────────────────┘
```

**Rationale:**
- `users.id` (INTEGER) is compact, fast for joins, and stable (never changes)
- `users.sub` (TEXT) is the OIDC identity anchor — unique, provider-assigned, survives email changes
- All FK references use `users.id` — internal consistency, referential integrity
- Display name is a user attribute, not a key — allows name changes without breaking FKs
- The UI resolves user IDs to display names via a user map fetched from `/api/auth/me`

**Alternatives considered:**
- *sub as PK*: Cleaner conceptually but long strings as FKs everywhere, slower joins
- *email as identity*: Emails can change, OIDC sub is the stable identifier

### 5. Bootstrap: OIDC_OWNER_RED and OIDC_OWNER_BLUE env vars

**Chosen:** Env vars mapping OIDC subjects to initial brick ownership on empty database.

```
OIDC_OWNER_RED="sub:yann@clients"    # OIDC sub of the person who owns the red brick
OIDC_OWNER_BLUE="sub:thomas@clients" # OIDC sub of the person who owns the blue brick
```

**Rationale:**
- Declarative — the deployer knows who should hold which brick
- Survives re-deploys (database stays but env vars are re-read on restart)
- Empty value = brick is unheld, first person to log in can claim it
- No need for a separate user mapping file or database

**Flow on startup when DB is empty:**
1. Users register on first login (upserted by OIDC sub)
2. On login, if the user's OIDC sub matches `OIDC_OWNER_RED`, they get assigned the red brick (if unheld)
3. After initial seeding, the env vars are irrelevant — bricks move via normal transfers

**Alternatives considered:**
- *Hardcoded email→name mapping in .env*: Binds to email which can change
- *Admin page for claiming bricks*: Adds UI complexity for a one-time setup

### 6. Transfer target selection: all users minus self

Any authenticated user is a valid transfer recipient. The UI shows all users except the current holder as transfer targets.

### 7. Client auth state: `/api/auth/me` endpoint

The SPA calls `GET /api/auth/me` on mount. If 200, the user is logged in and receives their user info plus the full users list (for transfer target buttons). If 401, render the login screen.

This avoids prop-drilling auth state and keeps the client simple — no auth context/provider needed at this scale.

### 8. No CSRF token for first iteration

Given: httpOnly session cookies + SameSite=Lax (default for express-session) + the cookie is never read by JavaScript. For a small internal app behind Caddy, this is adequate. CSRF tokens can be added later if the app grows.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| **OIDC provider down = app unusable** | Login only needed at session start. Session persists until expiry or logout. If Pocket ID is down but user already has a session, app continues working. |
| **SQLite as session store under high load** | App is for 3+ users, not thousands. SQLite with WAL handles this comfortably. |
| **Schema migration on existing DB** | If DB has existing data with the old TEXT columns, the startup migration must rename columns and resolve names to user IDs. This is one-time and idempotent. |
| **OIDC_OWNER_* sub values wrong/mismatched** | If the env var sub doesn't match any actual OIDC user, the brick remains unheld. A logged-in user without a brick sees "no bricks held" state. |
| **express-session store package quality** | `better-sqlite3-session-store` is community-maintained. The Store interface is simple — if the package has issues, we can inline the implementation (~30 lines). |

## Migration Plan

**Clean deployment (recommended):** Delete the old `brick.db`, deploy with new env vars. Users log in, their OIDC identities are created, bricks are seeded from env vars. Clean start.

**Migration with existing data:** The server startup detects the old schema (TEXT holder columns exist), runs a one-time migration:
1. Create `users` table with new schema
2. Create placeholder users for existing holder names (matching by display_name)
3. Rename `holder` → `holder_legacy`, add new `holder_id` column
4. Populate `holder_id` from `holder_legacy` via user lookup
5. Repeat for `transfer_history.from_holder → from_id`, `to_holder → to_id`
6. Drop legacy TEXT columns

Rollback: restore the old `brick.db` backup and deploy the previous image.

## Open Questions

- Should we add a "who has no bricks" display on the UI (for users who are logged in but neither hold nor are waiting for a brick)?
- Should the session cookie have a specific TTL or use express-session defaults?

# Design: Real Visitor Counter

## Context

`VisitorCounter` (src/components/kitsch/VisitorCounter.tsx) currently increments a per-browser `localStorage` key and displays `41,000 + local count`. The server (Express + better-sqlite3, WAL mode) has no visit tracking. Decisions from exploration: count starts from 0 (no kitsch base), dedup per browser session via a session-scoped cookie (option B), and no localStorage fallback on failure.

Relevant existing plumbing:
- `server/db.ts` owns all SQLite DDL, idempotent via `CREATE TABLE IF NOT EXISTS`.
- `server/app.ts` mounts session middleware; anonymous visitors currently get no session (`saveUninitialized: false`), so session-based dedup would miss lurkers — hence a separate lightweight cookie.
- `src/api.ts` centralizes all client fetches via `fetchJson`.
- Vite dev proxy forwards `/api` to the Express server.

## Goals / Non-Goals

**Goals:**
- One shared, server-persisted visit count starting at 0.
- Increment at most once per browser session (cookie dies with the browser session).
- Graceful, honest failure mode: `0000000` when the count can't be fetched.
- Zero visual change to the odometer and footer furniture.

**Non-Goals:**
- Analytics (no IPs, user agents, timestamps, or per-day breakdowns stored).
- Auth integration; anonymous and logged-in visitors are counted alike.
- Changes to odometer styling, i18n label text, or footer layout.
- Migrating old localStorage counts (they were never real).

## Decisions

### D1: Storage — single-row `site_stats` table in brick.db
```sql
CREATE TABLE IF NOT EXISTS site_stats (
  key TEXT PRIMARY KEY NOT NULL,
  value INTEGER NOT NULL
);
```
Increment with `INSERT ... ON CONFLICT(key) DO UPDATE SET value = value + 1` (atomic upsert), then `SELECT value`. better-sqlite3 is synchronous and single-connection, so no race window; WAL is already enabled.

*Alternatives:* dedicated `visit_count` table with one row (equally fine, more DDL for the same thing); counting `sessions` table rows (sessions expire and only exist for logged-in users); a real analytics table (overkill, rejected as non-goal).

### D2: Dedup — session-scoped cookie `counted=1`, not express-session
`POST /api/visits` checks for the `counted` cookie: present → return current count without incrementing; absent → increment and `Set-Cookie: counted=1` with **no maxAge/expires** (browser-session cookie — disappears when the browser fully closes). Set `httpOnly` and `sameSite: "lax"` to match the app's existing cookie posture. No `secure` flag (app runs plain HTTP behind the user's reverse proxy, consistent with the session cookie config).

*Alternatives:* flag on `req.session` (rejected — `saveUninitialized: false` means anonymous visitors have no session; creating sessions for every lurker bloats the sessions table); persistent 24h cookie (rejected in exploration — number would eventually stop moving); per-visit counting (rejected — refresh/bot inflation, option A discarded).

Note: browser-session cookies are imperfect dedup (new tab may share the cookie, browser restart resets it). Accepted: "real" here means honest intent, not forensic accuracy.

### D3: API shape — `POST /api/visits`, public, returns `{ count: number }`
POST (not GET) because the request has a side effect; response is the post-increment (or current) count. No auth, matching the public GET `/bricks` and `/transfers`. OpenAPI annotation added to `app.ts` in the existing JSDoc style; new tag not needed — group under Health-adjacent "no tag" or add `Site` tag if trivial.

*Alternatives:* GET endpoint (semantically wrong for a mutating call); serving the count as a generated GIF (delightful 1998 authenticity, rejected as scope creep).

### D4: Client — fetch on mount, render, fail quiet
`src/api.ts` gains `registerVisit(): Promise<number>` calling `POST /api/visits`. `VisitorCounter` switches from `useMemo` to `useState` + `useEffect` on mount: initial render is `0000000`, then the fetched count renders when it arrives. On error, state stays 0 — no retry, no localStorage. Rendering stays `String(count).padStart(7, "0")` through the existing odometer cells.

*Alternatives:* keep localStorage fallback (rejected in exploration — reintroduces fake local numbers); block render until fetch resolves (unnecessary spinner for footer furniture).

### D5: Display math — count is real, padding is presentational
No base constant. The stored value starts at 0; the first counted visitor sees `0000001`. If a kitsch base is ever wanted back, it's a display-layer change only — the stored number stays honest.

## Risks / Trade-offs

- [Browser restart, cookie cleared, or private window → device counts again] → Accepted; session-scoped dedup was explicitly chosen. Inflation is bounded by actual human intent, not refreshes.
- [Crawlers hitting the SPA inflate the count once per crawler session] → Accepted for a friends toy; cookies are rarely persisted by crawlers, so impact is minor.
- [Two rapid mounts (e.g. StrictMode double-invoke in dev) could double-count] → The cookie dedups server-side; second POST arrives with `counted=1` set by the first response. Also verify behavior under `npm run dev` StrictMode.
- [Display flashes `0000000` briefly before fetch resolves] → Footer furniture, below the fold; accepted. No spinner/animation added.
- [Odometer rollover] → 7 digits caps at 9,999,999. Not a realistic risk for three friends.

## Migration Plan

Deploy is additive: `CREATE TABLE IF NOT EXISTS site_stats` runs at startup in `db.ts`; count starts at 0 on first boot. Rollback = revert deploy; the table is harmless if orphaned. No data migration in either direction.

## Open Questions

(none — all decisions settled during exploration)

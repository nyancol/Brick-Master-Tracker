# Design: add-holder-tenure-ledger

## Context

`transfer_history` only records real transfers. Brick bootstrap (`server/auth.ts` `maybeBootstrapBricks` / `bootstrapDevBricks`) writes `brick_state` rows with `updated_at = Date.now()` and nothing else, so the first holder's tenure is unrecorded and unrecoverable (each transfer overwrites `updated_at`). The client's `computeDaysHeld()` (src/pages/home.tsx) derives "days held" from the latest transfer timestamp and returns null — "—" in the status bar — when no transfers exist. `GET /api/transfers` (server/app.ts) returns all rows, no pagination, joining `users` for display names.

Founding epoch chosen by the product owner: **2026-07-01T00:00:00Z** (stored as `Date.UTC(2026, 6, 1)`).

## Goals / Non-Goals

**Goals:**
- Complete, reconstructable tenure history for every brick (genesis → now).
- Per-brick tenure ledger: all users, leaderboard-sorted, zero-tenure shown with flavor, live per-second tick for the current holder.
- Status bar tenure from the same derivation (fixes the "—" bug).
- Genesis entries presented thematically in the Chronicle ("forged unto {name}").

**Non-Goals:**
- No changes to transfer authorization rules, transfer modal, marquee, footer furniture, login, or theming.
- No new API endpoints; no server-side stats aggregation.
- No historical backfill beyond the single genesis anchor (we do not invent intermediate periods).

## Decisions

### D1: Genesis row in `transfer_history` (not a new table/column)
A synthetic row with `from_id = NULL`, `to_id` = first holder, `transferred_by_id` = first holder, `transferred_at` = founding epoch. `from_id` is already nullable in the schema.
- *Alternatives*: `brick_state.held_since` column (overwritten by transfers — exactly the bug we're fixing); separate `brick_genesis` table (extra joins, no benefit; genesis then wouldn't appear in the Chronicle).
- *Consequence*: `GET /api/transfers` gains rows with `fromId`/`fromName` null; `transferredByName` still resolves because `transferred_by_id = to_id`.

### D2: Fixed founding epoch instead of captured bootstrap time
The user stipulated 1 July 2026 as ground truth. This lets the migration reconstruct genesis for *existing* databases too (bootstrap time is already lost there), keeping one constant instead of guesswork.
- *Alternatives*: `brick_state.updated_at` at bootstrap (lost after first transfer for existing DBs); `users.created_at` approximation (indeterminate).

### D3: Client-side derivation, one shared utility
New `src/lib/tenure.ts`: sort a color's transfers ascending, each `to_id` holds until the next `transferred_at` (latest holds until now), sum per user. Returns per-user totals plus the current holder's open tenure. Consumed by the ledger, the status bar, and (indirectly) nothing else. `computeDaysHeld`/`daysHeldLabel` in home.tsx are deleted.
- *Alternatives*: server `/stats` endpoint (more code, second fetch, no benefit for 3 users); SQL window functions (harder to keep live-updating).
- `date-fns` was considered for duration math but rejected during implementation: `intervalToDuration` splits elapsed time into *calendar* months (64 days becomes "2 months 2 days"), which breaks the `64d 03:12:45` format. The formatter is pure arithmetic; `date-fns` remains used only for date formatting in the Chronicle.

### D4: Scoped ticker component
A self-contained component (own `setInterval(1000)`, cleanup on unmount) renders only the ticking duration text for the current holder row and the status bar right segment. Home does not re-render each second.
- *Alternatives*: global interval in `Home` (re-renders the whole tree every second); `requestAnimationFrame` (wasteful for a 1 Hz update).
- Text-only update, no CSS animation — `prefers-reduced-motion` needs no special casing (verified by a spec scenario anyway).

### D5: Genesis visibility rules
- `GET /api/transfers`: includes genesis rows; the `from` join must be LEFT JOIN (null-safe). Frontend `Transfer` type: `fromId`/`fromName` become `| null`.
- `ChroniclesView`: `fromId === null` renders the "forged unto {name}" line (new i18n keys, EN/FR) with the brick color context; everything else unchanged.
- `HearYeMarquee`: normally picks the latest transfer so genesis never surfaces — *except on a fresh database, where the genesis row is the only/latest transfer*. Implementation added a `marquee.forged` template ("The {brick} was forged unto {to}!") used when `fromName` is null.
- Tenure derivation tie-break: a backfilled genesis row can share `transferred_at` with the first real transfer (and carries a higher row id despite being chronologically first, so id-ordering lies). The client sort anchors genesis first on timestamp ties, then orders by id.

### D6: Backfill migration in `server/db.ts` (existing idempotent pattern)
After table creation: for each color, if no `from_id IS NULL` row exists — `to_id` = earliest transfer's `from_id` for that color; if no transfers, `to_id` = `brick_state.holder_id`; if neither (fresh DB pre-bootstrap), skip (bootstrap path inserts it later). Guard: if the earliest transfer *predates* the founding epoch, use that transfer's timestamp as the genesis `transferred_at` instead (never negative tenure). Bootstrap functions gain one INSERT each, with the same idempotency guard.

### D7: Genesis founding story — French by charter, immutable by construction
Each genesis row is seeded with a `transfer_story` row containing a fixed French founding text (distinct for Honor and Shame). Stories are user content, not chrome — they render verbatim regardless of locale — so this does not conflict with the EN/FR i18n rule for UI strings. Immutability requires no new code: `PUT /transfers/:id/story` compares `from_id` to the session user, and NULL matches nobody → 403 for everyone. The Chronicle must simply not render the edit affordance for genesis entries.
Proposed wording (exact copy adjustable at implementation):
- Honor: « En l'an de grâce MMXXVI, le premier jour de juillet, le Brick d'Honneur fut forgé et confié à son premier détenteur. »
- Shame: « En l'an de grâce MMXXVI, le premier jour de juillet, le Brick de la Honte fut maudit et posé entre les mains de son premier porteur. »

## Risks / Trade-offs

- [Old clients / rolled-back code render genesis rows as transfers with a blank sender] → acceptable: additive data, worst case a cosmetic "null →" line; forward migration is the fix.
- [Client clock skew shifts the live tick] → all existing duration math already uses client `Date.now()`; friends share a timezone; accepted convention.
- [`GET /transfers` inner-join silently drops genesis rows] → explicit LEFT JOIN + spec scenario + API docs comment update in the same task.
- [Multiple genesis rows if migration and bootstrap both fire] → single guard query (`WHERE from_id IS NULL AND color = ?`) shared by both paths; spec scenario pins it.
- [Second-tick in both ledger and status bar doubles intervals] → one ticker per brick window reused by both surfaces; 2 timers total, negligible.

## Migration Plan

1. Migration runs at server startup (existing db.ts pattern), idempotent, additive-only.
2. No rollback script needed: genesis rows are inert for old code; feature removal can leave them in place.
3. Deploy order is trivial (single service, single container).

## Open Questions

- Exact flavor-line copy for zero-tenure users (EN/FR) — decide during implementation; spec only requires themed flavor + i18n.

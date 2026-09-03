# Proposal: add-holder-tenure-ledger

## Why

The app records every transfer but loses the first holder's tenure: `brick_state` bootstrap writes no `transfer_history` row, so the genesis period is invisible to history and to duration math (the status bar shows "—" for a genesis holder). Meanwhile the UI only surfaces a static whole-day count for the current holder. The friends want to see, per brick, how long *each* holder has held it — a live leaderboard.

## What Changes

- **Genesis ledger row**: every brick gets exactly one synthetic `transfer_history` row with `from_id = NULL`, `to_id` = first holder, `transferred_at = 2026-07-01T00:00:00Z` (the founding date of the realm).
  - Bootstrap (`auth.ts`) inserts it alongside the initial `brick_state` row.
  - A migration backfills missing genesis rows in existing databases: `to_id` = the `from_id` of the earliest known transfer for that color, or the bootstrap holder when no transfers exist.
- **Genesis founding story**: each genesis row is seeded with an immutable, French-language founding text in `transfer_story` (stories are user content, not chrome — shown verbatim in both locales); it cannot be edited since a genesis row has no sender.
- **API shape**: `GET /api/transfers` includes genesis rows; `fromId`/`fromName` are `null` for them.
- **Chronicle rendering**: genesis entries render as "The Brick of Honor was forged unto {name}" (EN/FR) instead of a from → to transfer line.
- **Tenure ledger** (new UI, inside each brick window): a Win98 group box listing all three friends with their total tenure for that brick, sorted leaderboard-style (longest first); zero-tenure friends show "0d" plus a themed flavor line; the current holder's row ticks every second.
- **Status bar**: the "days held" segment is replaced by the current holder's live tenure (d/h/m/s, ticking every second) computed from a shared genesis-aware tenure utility — replacing `computeDaysHeld` and fixing the genesis-holder "—" bug.

## Capabilities

### New Capabilities
- `holder-tenure`: Per-holder brick tenure — genesis record, tenure derivation, the per-brick tenure ledger UI with live per-second timer, and genesis entry rendering in the Chronicle.

### Modified Capabilities
- `window-chrome`: The brick window status bar's right segment changes from static whole "days held" (computed from the latest transfer) to the current holder's live, per-second-ticking tenure from the shared genesis-aware derivation.
- `authorized-transfers`: Transfer history now includes genesis rows; `GET /api/transfers` returns `fromId`/`fromName` as null for them (display names are otherwise unchanged).

## Impact

- `server/db.ts` — genesis backfill migration.
- `server/auth.ts` — bootstrap inserts genesis row (both `maybeBootstrapBricks` and `bootstrapDevBricks` paths).
- `server/app.ts` — `GET /transfers` must tolerate `from_id IS NULL` in its user joins.
- `shared/types.ts`, `src/api.ts` — `Transfer.fromId`/`fromName` become nullable.
- `src/pages/home.tsx` — status bar swap; new tenure ledger; `computeDaysHeld` removed.
- `src/components/ChroniclesView.tsx` — genesis entry special case.
- `src/locales/en.ts`, `src/locales/fr.ts` — new strings (ledger labels, flavor lines, forged-unto line).
- No new dependencies (`date-fns` already present for duration math).
- **Out of scope visual surfaces**: transfer modal, HearYe marquee, footer furniture (visitor counter, webring, badges), login page, theme system, visitor counter. None of these change.

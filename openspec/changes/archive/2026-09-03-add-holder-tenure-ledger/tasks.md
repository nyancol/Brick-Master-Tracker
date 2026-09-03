# Tasks: add-holder-tenure-ledger

## 1. Server: genesis record

- [x] 1.1 Add `GENESIS_MS = Date.UTC(2026, 6, 1)` constant and an idempotent `ensureGenesisRow(color, toId)` helper (guard: no existing `from_id IS NULL` row for that color) in `server/db.ts`
- [x] 1.2 Add startup backfill migration in `server/db.ts`: for each color with no genesis row, use earliest transfer's `from_id` (and its `transferred_at` if it predates the founding epoch) as `to_id`; fall back to `brick_state.holder_id`; skip when neither exists
- [x] 1.3 Insert genesis row in both bootstrap paths (`maybeBootstrapBricks`, `bootstrapDevBricks` in `server/auth.ts`) via the shared helper
- [x] 1.4 Seed the genesis founding story in the same helper: insert a `transfer_story` row with the fixed French founding text for the brick color (Honor/Shame variants per design D7)

## 2. API shape

- [x] 2.1 Make the `from` join in `GET /api/transfers` (server/app.ts) LEFT JOIN and null-safe so genesis rows return with `fromId: null`, `fromName: null`
- [x] 2.2 Update the OpenAPI comment block for `/transfers` to document genesis rows
- [x] 2.3 Update `shared/types.ts` and `src/api.ts`: `Transfer.fromId`/`fromName` become `| null`

## 3. Tenure derivation utility

- [x] 3.1 Create `src/lib/tenure.ts`: `computeTenures(transfers, color)` returning per-user total tenure (ms) plus the current holder's open tenure; sort transfers ascending, latest holds until now, genesis anchors the first period
- [x] 3.2 Add duration formatter (date-fns `intervalToDuration`, zero-padded `64d 03:12:45` / `64j 03:12:45`, locale-aware day suffix)
- [x] 3.3 Unit-check the math with a scratch script (multi-transfer chain, genesis-only color, zero-tenure user) — scratch file in /tmp, not committed

## 4. UI: ledger and status bar

- [x] 4.1 Add EN/FR i18n keys: ledger title/labels, zero-tenure flavor line, "forged unto" chronicle line, live tenure format helpers
- [x] 4.2 Create scoped `LiveTenure` ticker component (own 1s `setInterval`, cleanup on unmount, text-only update) that renders a shared derivation result
- [x] 4.3 Render the tenure ledger group box inside each brick window: all users, leaderboard-sorted, current holder row distinguished and live, zero-tenure "0d" + flavor; Win98 group-box styling per existing `fieldset.group-box` pattern
- [x] 4.4 Replace status bar "days held" with the same live tenure; delete `computeDaysHeld`/`daysHeldLabel` from `src/pages/home.tsx`

## 5. Chronicle genesis rendering

- [x] 5.1 In `ChroniclesView.tsx`, render genesis entries (`fromId === null`) as the "forged unto {name}" line; ensure no null-name breakage elsewhere (marquee unaffected by design)
- [x] 5.2 Ensure the Chronicle does not render the story edit affordance for genesis entries (server already returns 403 for them)

## 6. Verification (per project UX conventions)

- [x] 6.1 Build passes: `npm run typecheck` and `npm run build`
- [x] 6.2 Server smoke test with env overrides (PORT=3199, DATA_PATH/DB_PATH under /tmp/opencode/bmt-data): fresh DB → bootstrap inserts genesis rows; DB seeded with pre-existing transfers → backfill picks earliest `from_id`
- [x] 6.3 Browser verification via dev login + playwright-core scratch install: ledger renders for both bricks, ticks each second, zero-tenure flavor shows; before/after full-page screenshots
- [x] 6.4 Verification matrix: light + dark themes, en + fr locales, `prefers-reduced-motion` (tick still updates, no animation)
- [x] 6.5 `GET /api/transfers` returns genesis row with nulls; Chronicle shows "forged unto" line for it and unchanged rendering for regular entries

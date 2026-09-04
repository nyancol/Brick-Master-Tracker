# Tasks: Seize the Shame

## 1. Server: seizure endpoint

- [x] 1.1 Add `POST /bricks/blue/seize` in `server/app.ts` with OpenAPI annotation: requireAuth, validate description (non-empty string), optional `imageIds` array; inside `db.transaction()` read current blue holder, reject caller-is-holder (403 "Only another knight may seize the Shame"), reject role !== knight (403), update `brick_state.holder_id` to caller, insert `transfer_history` with `from_id` = old holder / `to_id` = `transferred_by_id` = caller, insert `transfer_story` with `edited_by` = caller, attach staged images (`uploaded_by` = caller), return BrickState-shaped payload
- [x] 1.2 Reject holder-initiated blue transfers: in `POST /bricks/:color/transfer`, after color validation, return 403 "The Shame cannot be given — it must be seized" when `color === "blue"`; add OpenAPI response note
- [x] 1.3 Grep for all callers of `transferBrick(` / `bricks/blue/transfer` and `bricks/blue/seize` to confirm nothing else calls the old blue path (design D2 risk item)

## 2. Server: authorization follows the actor

- [x] 2.1 Verify the invariant on a scratch DB fixture: assert `transferred_by_id = from_id` for every existing `transfer_history` row (per repo UX testing conventions, crafted fixture in /tmp, never the real data)
- [x] 2.2 Flip story-edit authorization in `PUT /transfers/:id/story` (server/app.ts:941) from `from_id` to `transferred_by_id`
- [x] 2.3 Flip image-upload authorization in `POST /transfers/:id/images` (server/app.ts:1389) from `from_id` to `transferred_by_id`
- [x] 2.4 Flip image-deletion authorization in `DELETE /api/transfers/:id/images/:imageId` (server/app.ts:1470) from `from_id` to `transferred_by_id`

## 3. Client: API + locales

- [x] 3.1 Add `seizeBlueBrick(description, imageIds)` to `src/api.ts` calling `POST /api/bricks/blue/seize`
- [x] 3.2 Add EN + FR locale strings in `src/locales/en.ts` and `fr.ts`: seize button label, seize modal title, blue-holder waiting variant ("The Shame clingeth to thee still…" register), and mappings for the two new server errors (bearer-cannot-seize, shame-cannot-be-given)

## 4. Client: SHAME.EXE inversion

- [x] 4.1 In `src/pages/home.tsx` blue column: for the current blue holder show only the holder-voiced waiting text (remove recipient buttons entirely); for other knights render a single Seize button (no recipient picker) that opens `TransferModal` with `color: "blue"` and seize title
- [x] 4.2 Wire a seize confirm handler (or branch in `handleTransferConfirm`) that calls `seizeBlueBrick`, keeps the existing sfx/refetch/chronicles-bump flow, and maps the two new server errors to localized toasts
- [x] 4.3 Verify red-brick column is untouched by the refactor

## 5. Verification

- [x] 5.1 `pnpm typecheck` and `pnpm build` pass
- [x] 5.2 Server API smoke test on scratch data (PORT=3199, /tmp DB): seize as non-holder knight (200 + history row with `to_id = transferred_by_id`), seize as holder → 403, seize as visitor → 403, seize without description → 400, blue transfer → 403, red transfer still works, non-actor story edit / image upload / image delete → 403, actor versions → 200
- [x] 5.3 Browser verification matrix with dev test users (scratch playwright-core + /tmp DB): as blue holder (waiting text, no buttons), as another knight (single Seize button, modal without recipient picker, seizure lands and chronicle records it), as visitor (no Seize) — each in light + dark and EN + FR, before/after screenshots
  - Note: fixed a stale-ledger flaw surfaced by verification — `useTransfers` refetch added to the confirm handler so the tenure ledger/marquee update immediately after a seizure
  - Note: Playwright `text=` matches textarea values — assertions assert rendered `.dropcap` story text after expanding the chronicle entry, not modal input
- [x] 5.4 Bump minor `version` in `package.json` (0.0.1 → 0.1.0)

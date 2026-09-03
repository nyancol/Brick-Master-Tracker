# Tasks: add-chronicle-marginalia

## 1. Data layer

- [x] 1.1 Add `transfer_comments` and `transfer_comment_huzzahs` tables to `server/db.ts` using the idempotent `CREATE TABLE IF NOT EXISTS` pattern, including the `UNIQUE(comment_id, user_id)` constraint and `ON DELETE CASCADE` on huzzahs (D1)

## 2. Shared types

- [x] 2.1 Add `TransferComment` to `shared/types.ts` (`id`, `authorId`, `authorName`, `authorRole`, `body`, `createdAt`, `blottedAt`, `huzzahCount`, `huzzahedByMe`) and mirror it in `src/api.ts` (client twin precedent)

## 3. API routes (server/app.ts)

- [x] 3.1 `GET /transfers/:id/comments` — 404 on unknown transfer; JOIN users for `authorName`/`authorRole`, `COUNT` for `huzzahCount`, `EXISTS` for `huzzahedByMe`; oldest-first; `@openapi` JSDoc
- [x] 3.2 `POST /transfers/:id/comments` — requireAuth; trim body; 400 empty / 400 >500 chars / 404 unknown transfer; insert with author + `created_at`; return created comment
- [x] 3.3 `POST /transfers/:id/comments/:commentId/huzzah` — 404 unknown comment; 409 if `blotted_at` set; insert huzzah, catch `SQLITE_CONSTRAINT` → 409 with the duplicate-huzzah error string; return updated count
- [x] 3.4 `POST /transfers/:id/comments/:commentId/blot` — 404 unknown comment; 403 non-author; set `blotted_at` if null (idempotent otherwise)
- [x] 3.5 `DELETE /transfers/:id/comments/:commentId` — 404 unknown comment; 403 non-author; delete row inside `db.transaction` (huzzahs cascade)

## 4. Pure helpers (src/lib)

- [x] 4.1 Extract `toRoman` from `src/components/ChroniclesView.tsx` into `src/lib/roman.ts` and update the year-heading import
- [x] 4.2 Create `src/lib/marginalia.ts` with pure `inkFor(authorId, role)`, `tiltFor(authorId, commentId)` (±1.5°), and `relativeGlossAge(createdAt, now)` returning a semantic bucket key; type-only imports only
- [x] 4.3 Verify the pure helpers with a scratch `/tmp/opencode` `.mjs` harness (determinism, tilt bounds, age buckets, roman numerals)

## 5. Ink & style plumbing (src/index.css)

- [x] 5.1 Define the medieval ink palette as CSS (Day + Dungeon values per ink: iron-gall, red ochre, lapis, verdigris, oak-gall, sepia) plus the graphite visitor ink, mapped by `inkFor` names
- [x] 5.2 Add blotted-gloss treatment (strike-through, low legibility, ink-blur) and the wax-seal disc styles (gold wax knight / muted wax visitor) with legibility in both themes
- [x] 5.3 Add the huzzah micro-animation with a `prefers-reduced-motion` fallback

## 6. Client data layer (src/api.ts)

- [x] 6.1 Add `fetchTransferComments(transferId)` plus mutations `addGloss`, `huzzahComment`, `blotComment`, `chiselComment` following the existing `fetchJson` mutation pattern

## 7. UI (src/components/ChroniclesView.tsx)

- [x] 7.1 Build the `Marginalia` section component: header ("In þe Margins" + roman gloss count), empty state, gloss list in a `bevel-in group-box`, wax seals, inks, tilt, period ages
- [x] 7.2 Add the composer (textarea placeholder, "Affix þy Seal" submit disabled while empty or in flight; clears + refetches on success)
- [x] 7.3 Add per-gloss actions: one-shot huzzah control (spent state after own huzzah, count), blot on own glosses (confirm dialog), chisel only on own blotted glosses
- [x] 7.4 Render blotted glosses as the struck-through blot line with localized copy — never the body
- [x] 7.5 Mount `Marginalia` inside the expanded `ChronicleEntry` below `PhotoGallery`, fetching on first expand and refetching after each mutation
- [x] 7.6 Map duplicate-huzzah (409) and other server errors to localized toasts

## 8. i18n

- [x] 8.1 Add the `marginalia.*` keys to `src/locales/en.ts` (header, count, placeholder, empty state, submit, blot copy, chisel copy, huzzah rebuke, confirm dialogs, timestamps "but now"/"this very day"/"yestereve"/"N days past")
- [x] 8.2 Add the matching French keys to `src/locales/fr.ts` and extend the `TKey` union in `src/hooks/use-translation.ts`

## 9. Full verification (UX Testing Conventions)

- [x] 9.1 Build and run the isolated test server (`PORT=3199 DATA_PATH/DB_PATH/IMAGE_PATH=/tmp/opencode/bmt-data`), stale-server hygiene (`fuser -k 3199/tcp` first); `pnpm typecheck` + `pnpm build` clean
- [x] 9.2 API matrix via dev-login sessions (yann/anselme/thomas knights, salma visitor): visitor can gloss, duplicate huzzah → 409, huzzah on blot → 409, non-author blot/chisel → 403, validation 400s, unknown transfer/comment → 404, chronological order
- [x] 9.3 Playwright-core harness: expand an entry, inscribe a gloss as knight and as visitor, huzzah from another user, blot + chisel; verify margin renders in light+dark × en+fr × normal+reduced-motion; eyeball before/after full-page screenshots with Read
- [x] 9.4 Confirm no regression to story editing, photo gallery, transfer flow, or page furniture; verify blotted copy renders in both languages
- [x] 9.5 Kill the test server and clean up `/tmp/opencode` scratch harnesses

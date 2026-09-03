# Design: add-chronicle-marginalia

## Context

Chronicle entries (transfers + `transfer_story` + `transfer_images`) are read-only for everyone except the story's sender. There is no commenting, messaging, or notification feature anywhere in the app — the closest precedents are the 1:1 `transfer_story` table (child of `transfer_history`, attribution columns, sender-only edit) and the 1:N `transfer_images` table (child rows with `uploaded_by` ownership checks). Roles are stored per user (`knight` | `visitor`); all authenticated users share the same session mechanics, so "visitors may write" needs no auth changes — only the absence of a role check.

Backend conventions to follow: all routes inline in `server/app.ts` with `@openapi` JSDoc, `requireAuth`, manual validation, prepared statements via better-sqlite3, snake_case rows mapped to camelCase, ISO timestamps in responses, `{ error: "..." }` errors. Frontend: hand-rolled `useData` hook, plain async mutation functions in `src/api.ts`, local state + refetch, toasts for errors, EN+FR locale keys + `TKey` union, both themes always working, `prefers-reduced-motion` respected.

## Goals / Non-Goals

**Goals:**

- Every authenticated user (knight or visitor) can gloss any chronicle entry
- Manuscript-authentic presentation: inks, seals, blots, roman numerals, period timestamps
- One-shot huzzahs with period rebuke on duplicates
- Blot (soft) / chisel (hard) lifecycle owned by the gloss author
- Pure-function helpers (ink, timestamps, roman numerals) that stay unit-testable without a test framework

**Non-Goals:**

- Editing gloss text (no PUT; blot is the remedy)
- Notifications of any kind (toasts remain the only feedback surface)
- Right-hand true-margin column layout on wide screens; image attachments on glosses; markdown; threading/replies; pagination
- New sound effects (the existing SfxToggle surface is untouched; a quill-scratch huzzah sound could be a later change)
- Any change to brick holding, transfers, or the story/images features

## Decisions

### D1: Two tables; uniqueness enforced by the database

```
transfer_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transfer_id INTEGER NOT NULL REFERENCES transfer_history(id),
  author_id   INTEGER NOT NULL REFERENCES users(id),
  body        TEXT NOT NULL,
  created_at  INTEGER NOT NULL,          -- unix ms
  blotted_at  INTEGER                    -- NULL until blotted
)

transfer_comment_huzzahs (
  comment_id INTEGER NOT NULL REFERENCES transfer_comments(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  UNIQUE(comment_id, user_id)
)
```

Rationale: a check-then-insert huzzah would race under concurrent clicks; the `UNIQUE` constraint makes the second insert fail deterministically (catch `SQLITE_CONSTRAINT` → 409). `ON DELETE CASCADE` clears huzzahs when a gloss is chiseled (better-sqlite3 honors it; foreign_keys pragma is already on in `server/db.ts`). Tables created with the codebase's idempotent `CREATE TABLE IF NOT EXISTS` pattern — no migration tool, no backfill.

### D2: Blot = column, chisel = DELETE

`blotted_at` (nullable) instead of a separate blots table or a `deleted` boolean: it keeps the *when* (useful for the blot copy and future "history of the page"), is idempotent, and distinguishes soft state from removal. Chisel (author-only, offered only on their own blotted glosses) deletes the row inside `db.transaction` — cascade removes huzzahs.

### D3: Blotted bodies still ship in the API response

`GET .../comments` returns the raw body even for blotted glosses; the UI never renders it (struck-through illegible line + "Here a word was blotted out"). Alternative considered: null the body server-side when blotted. Rejected for now: it complicates the response contract, and this is a closed circle of friends where "holding the page to the light" (view-source) is period-appropriate mischief. Revisit only if a user objects. Documented as a known trade-off (R1).

### D4: One GET, enriched by JOIN; everything nested under /transfers/:id/comments

```
GET    /api/transfers/:id/comments                     → gloss list (oldest first)
POST   /api/transfers/:id/comments                     → create (any role)
POST   /api/transfers/:id/comments/:commentId/huzzah   → one-shot reaction
POST   /api/transfers/:id/comments/:commentId/blot     → author-only soft delete
DELETE /api/transfers/:id/comments/:commentId          → author-only hard delete
```

The GET resolves `authorName`/`authorRole` via JOIN on `users`, `huzzahCount` via `COUNT` + `GROUP BY`, and `huzzahedByMe` via `EXISTS(... AND user_id = ?)` with the session user's id. Ordering is **oldest-first**: a margin accumulates downward like real manuscript glosses, and newest comments naturally get the freshest rotation. All five routes use `requireAuth` (sessions are universal; role is data, not a gate — except blot/chisel, which are author gates). 404 when the transfer or comment doesn't exist; 403 for non-authors; 400 for validation; 409 for duplicate huzzah / huzzah-on-blot.

### D5: Ink, rotation, and seals are pure client-side derivation

`src/lib/marginalia.ts` exports pure functions (type-only imports only — no React, no i18n, no localStorage — preserving the node-strips-types test path per project convention):

- `inkFor(authorId: number, role: UserRole): InkName` — hash (e.g. FNV-1a of the id) picks from a knight palette of ~6 medieval inks (iron-gall brown, red ochre, lapis, verdigris, oak-gall black, sepia); visitors always map to graphite. Each ink gets a Day and a Dungeon value (CSS-var-backed or two-tone map) for contrast in both themes.
- `tiltFor(authorId: number, commentId: number): number` — hash-derived degrees in ±1.5°, stable across renders.
- `relativeGlossAge(createdAt, now): "now" | "today" | "yestereve" | "past"` — semantic bucket only; the component maps buckets to localized strings. Returning a *key*, not prose, keeps the lib i18n-free.
- Roman numerals: extract the existing local `toRoman` from `ChroniclesView.tsx` into `src/lib/roman.ts` and reuse it for year headings, gloss counts, and "N days past".

Rationale: determinism is a spec requirement ("same author, same ink"), and pure modules are verifiable with a scratch `.mjs` harness instead of a test framework. Server involvement would be extra columns for zero benefit — the server already sends `authorId` and `authorRole`.

### D6: UI shape — a `Marginalia` component inside the expanded entry

Placed after `PhotoGallery` inside the expanded `ChronicleEntry` block in `src/components/ChroniclesView.tsx`:

- Header row: quill ornament + "In þe Margins" + "III glosses" (roman count via `toRoman`)
- Gloss list in a `bevel-in group-box` container; each gloss = wax-seal disc (initial letter over gold/muted wax), author name, graphite role mark for visitors, period age, body in the scribe's ink with the deterministic tilt; own glosses get blot/chisel affordances; everyone gets the huzzah seal
- Blotted glosses render a struck-through, low-legibility line with the blot copy — never the body
- Composer at the bottom: textarea + "Affix þy Seal" button, disabled when empty; after submit it clears and the list refetches
- Data flows through local state exactly like the story does: `Marginalia` receives `transferId` + `currentUser`, fetches on mount (mounted only when expanded), and refetches after each mutation — no react-query, matching `ChronicleEntry`'s existing lazy-load pattern

### D7: Copy and localization

New locale keys under a `marginalia.*` namespace in **both** `src/locales/en.ts` and `fr.ts`, with the `TKey` union in `use-translation.ts` extended (it will not compile otherwise — the union is the enforcement). Thorn characters only in headings/buttons ("In þe Margins", "Affix þy Seal"); meta-text stays readable per the herald copy register. Duplicate-huzzah and other server errors surface through the standard toast; the client maps known raw error strings to localized text (existing pattern in `home.tsx`).

## Risks / Trade-offs

- **[R1] Blotted bodies are readable at the network layer** → accepted per D3 for this closed friend group; if it ever matters, server-side body-nulling for blotted rows is a one-line change.
- **[R2] Margin bloat on popular entries** → counts in this friend group stay small; no pagination in v1. If a thread ever grows unwieldy, a "show older glosses" fold is the natural follow-up, not a schema change.
- **[R3] Ink legibility in Dungeon theme / on parchment** → each ink defines Day and Dungeon values; the verification matrix (light+dark, en+fr, both motions) applies with pixel-truth screenshots before merge.
- **[R4] `server/app.ts` keeps growing (1529 lines)** → consistent with the codebase's single-file route convention; the five routes are small. Splitting routes is a separate refactor, out of scope.
- **[R5] Double-click submits duplicate glosses** → disable the submit button while the POST is in flight (same pattern as the upload button in `PhotoGallery`); duplicates are also visible and blottable, so no server-side dedup needed.
- **[R6] Huzzah count drift after chisel** → after any mutation the whole gloss list refetches (D6), so counts self-correct; no optimistic counters to reconcile.

## Migration Plan

1. Add both tables in `server/db.ts` (idempotent `CREATE TABLE IF NOT EXISTS`, alongside the existing schema block). Existing data is untouched; no backfill — glosses start empty.
2. Deploy as usual (single build). Rollback: the tables are inert if the routes/UI are reverted; nothing else reads them.

## Open Questions

- Exact hex values for the ink palette in both themes — settle during implementation against real parchment/stone backgrounds (pixel truth over theory).
- Whether the wax-seal disc uses the user's initial (blackletter) or a tiny heraldic glyph — initial is the working choice; verify legibility at 24px in both themes.

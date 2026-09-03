# Proposal: add-chronicle-marginalia

## Why

Chronicle entries are read-only tales: knights and visitors can only look at them. The chronicle is the social heart of Brick Master Tracker, yet nobody but the original sender can add a single word to it. Marginalia gives every soul — knight and visitor alike — a place in the manuscript, turning the chronicle from a broadcast into a shared book. Historically, medieval readers did exactly this: they glossed the margins of manuscripts. The feature has a natural, period-authentic home already half-built by the illuminated chronicle layout.

## What Changes

- New **"In þe Margins"** section inside each expanded chronicle entry (below photos), listing "glosses" (comments) in manuscript style.
- **Any authenticated user** (knight *or* visitor) may inscribe a gloss on any chronicle entry. This is a deliberate expansion of visitor participation: visitors remain unable to hold or transfer bricks, but travelers may scribe in the margins.
- **Huzzahs**: a one-shot "Huzzah!" reaction per user per gloss (no toggle-off; a second attempt earns a period error message). Displayed as a roman-numeral count with a small seal.
- **Blotting**: an author may "blot out" their gloss — it remains visible as a struck-through, semi-illegible line reading "Here a word was blotted out." The author may later **chisel** it away entirely (hard delete). Blots are visible to everyone; only the author sees the chisel action.
- **No editing** of gloss text in v1 — a scribe's word is writ; regret is expressed by blotting.
- **Medieval styling**: per-user deterministic ink colors (knights draw from a colored ink palette, visitors a humble graphite), slight hand-written rotation per gloss, wax-seal avatar discs, period relative timestamps ("but now", "yestereve", "III days past"), roman-numeral counts ("III glosses") matching the year headings.
- New API: `GET/POST /api/transfers/:id/comments`, `POST /api/transfers/:id/comments/:commentId/huzzah`, `POST .../:commentId/blot`, `DELETE .../:commentId`; two new SQLite tables.
- **Out of scope (visual surfaces)**: brick cards, the transfer modal, header/footer page furniture (marquee, counter, webring, badges), the login page, and the photo gallery are untouched. No right-hand true-margin column layout on wide screens (below-photos section in v1). No comment editing UI, no notifications, no markdown/rich text, no image attachments on glosses.

## Capabilities

### New Capabilities

- `chronicle-marginalia`: Glosses (comments) on chronicle entries — who may write them, huzzah reactions, blot/chisel lifecycle, retrieval, and the illuminated-manuscript presentation rules (ink colors, period timestamps, roman numerals, reduced-motion behavior).

### Modified Capabilities

- *(none)* — the visitor-writes permission is defined as a requirement of the new capability; no existing requirement in `user-groups` (derivation, persistence, banner, badge) or elsewhere changes meaning.

## Impact

- **`server/db.ts`** — new tables `transfer_comments` and `transfer_comment_huzzahs` (created with the existing `CREATE TABLE IF NOT EXISTS` idempotent pattern).
- **`server/app.ts`** — five new routes with `@openapi` JSDoc, `requireAuth`, inline role/author checks, prepared statements.
- **`shared/types.ts`** — new `TransferComment` type (client twin in `src/api.ts`, following the existing precedent).
- **`src/api.ts`** — `useTransferComments` data hook + mutation functions (`addGloss`, `huzzahComment`, `blotComment`, `chiselComment`).
- **`src/components/ChroniclesView.tsx`** — new `Marginalia` section inside expanded `ChronicleEntry`; lazy-loads comments on first expand like the story does.
- **`src/index.css`** — ink palette CSS vars, blot text treatment, subtle rotation utility, huzzah micro-animation.
- **`src/locales/en.ts`, `src/locales/fr.ts`, `src/hooks/use-translation.ts`** — all new user-facing strings in both languages + extended `TKey` union.
- No new dependencies. No changes to auth, transfers, images, or session handling.

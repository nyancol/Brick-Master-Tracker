# Proposal: Real Visitor Counter

## Why

The footer visitor counter is a per-browser illusion: `VisitorCounter` increments a `localStorage` key and adds it to a base of 41,000, so every device sees its own private number and the server has no idea anyone visited. The counter should be real — a single, shared count of actual visitors persisted server-side, starting from 0.

## What Changes

- Replace the localStorage-based count with a server-persisted count stored in SQLite (single-row `site_stats` table, starts at 0).
- Add `POST /api/visits`: increments the count at most once per browser session (session-scoped `counted` cookie), returns the current count. No auth required — anonymous lurkers count.
- Remove the 41,000 base entirely: the displayed number is the real count, zero-padded to 7 odometer digits (first visitor sees `0000001`).
- Rewrite `VisitorCounter` to fetch the count on mount; on fetch failure it renders `0000000` (no localStorage fallback).
- Delete `readVisitCount`, the `localStorage["visits"]` key usage, and the `BASE` constant.

Out of scope (visual surfaces unchanged): odometer styling and cells, footer layout, webring, badges, marquee, i18n label text. The change is behavioral only — where the number comes from.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `medieval-theme`: The "Visitor counter increments" requirement changes from localStorage-per-browser counting (base 41,000) to a server-persisted shared count incremented at most once per browser session. The "Visitor counter display" requirement (odometer cells styling) is unchanged.

## Impact

- **Server** (`server/app.ts`, `server/db.ts`): new `site_stats` table + `POST /api/visits` endpoint (cookie set, no auth); OpenAPI annotation added.
- **Client** (`src/components/kitsch/VisitorCounter.tsx`, `src/api.ts`): component rewired to `POST /api/visits`; new API helper.
- **i18n**: none — `footer.counterLabel` text is unchanged (label no longer semantically "local", but wording stays).
- **Specs**: `openspec/specs/medieval-theme/spec.md` visitor counter requirement rewritten via delta.
- **Data**: fresh `site_stats` row starts at 0 on deploy; no migration of old localStorage counts (they were never real).
- **Deployment**: no new dependencies, no schema-breaking change (additive `CREATE TABLE IF NOT EXISTS`).

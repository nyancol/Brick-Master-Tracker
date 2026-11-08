## Why

The "Hear Ye!" herald marquee announcing the latest transfers sits at the top of the home page as plain scrolling text. For a 1998 GeoCities medieval-fansite aesthetic, a bare text ticker undersells the moment — flanking the announcement with heraldic horn GIFs (90s-style trumpeting heralds) makes the proclamation feel like a fanfare and strengthens the medieval identity of the page's most prominent banner.

## What Changes

- Flank the "Hear Ye!" latest-transfer marquee text with a period horn/herald GIF on the left and right (mirrored pair, 90s GIF style).
- Source one authentic horn/trumpet-herald GIF from GifCities into `public/gifs/` (e.g. `horn-herald.gif`); record its source URL in `public/gifs/CREDITS.md`. No hotlinking.
- Horns render at native pixel dimensions alongside (not inside) the scrolling text so the marquee animation is untouched.
- Honors `prefers-reduced-motion`: horns render statically (a looping GIF that cannot pause must fall back to a static first-frame rendering under reduced motion).
- Works in both Day and Dungeon themes; marquee copy and behavior unchanged.

## Capabilities

### New Capabilities
- None — no new behavior contract; this is ornamentation on an existing surface.

### Modified Capabilities
- `medieval-theme`: the "Kitsch Page Furniture" marquee requirement gains horn-herald flanking; the "Period GIF Ornamentation" requirement gains the new horn asset (local file + attribution).

## Impact

- Affected code: `src/components/kitsch/HearYeMarquee.tsx` (layout only), `src/index.css` (only if a small flanking-layout/reduced-motion rule is needed), `public/gifs/horn-herald.gif` + `public/gifs/CREDITS.md` (new asset + attribution row).
- No API, data, i18n string, or marquee-copy changes. Marquee message logic, scroll animation, and empty/loading states are untouched.
- Out of scope (visual surfaces unchanged): brick cards, transfer modal, chronicles layout, footer furniture (counter, webring, badges), login/404 pages, tenure ledger, sound/lute behavior.

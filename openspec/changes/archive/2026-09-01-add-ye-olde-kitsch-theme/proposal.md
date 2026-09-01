# Proposal: add-ye-olde-kitsch-theme

## Why

The current "manuscript" theme is tasteful medieval — restrained gold, EB Garamond, subtle textures. It behaves like a modern app wearing a costume. The app's true spirit (a silly brick tracker between friends, tracking tokens of Honor and Shame) is the 1998 GeoCities medieval-fandom fansite: blackletter headings, castle-stone tiled backgrounds, beveled buttons, a herald marquee, a visitor counter, a webring footer, and lute music on demand. The owner wants the site to become that, unreservedly — full replacement of the current aesthetic, with lovingly "broken" era details and authentic period GIF assets.

## What Changes

- **BREAKING (visual only):** The Manuscript/Scriptorium aesthetic is fully replaced by the "Ye Olde Kitsch" theme. No modern-minimal fallback mode remains.
- Typography shifts from Cinzel/EB Garamond/Cutive Mono to an era-faithful stack: blackletter display (UnifrakturMaguntia), Times New Roman body, Comic Sans for casual asides, with period-default link colors (#0000EE / #551A8B).
- Background becomes an obviously repeating tiled castle-stone texture (light) and a starfield "Dungeon" tile (dark).
- Chrome and buttons adopt Win98-style bevel styling (outset/inset borders, pressed states) recast as carved stone / brass plaques.
- Period animated GIFs (sourced from the Internet Archive's GifCities GeoCities corpus, downloaded into `/public/gifs/`) are used as ornamentation: dragon by the title, torches flanking brick cards, scroll for the Chronicle, skull for the Brick of Shame, knight for the "Under construction by þe King's Masons" footer badge.
- Classic 90s page furniture is added: scrolling "Hear Ye!" herald marquee, odometer-style visitor counter (localStorage visit count + large base), "Ye Olde Brick Webring" footer, "Best viewed in Netscape Navigator 4.0 at 800×600" badge, 88×31 web buttons.
- Chronicles entries gain illuminated drop caps and period layout quirks; era-fidelity "broken details" are applied deliberately (JPEG-crushed tiles, non-uniform GIF scaling, slightly inconsistent section margins).
- UI copy in EN and FR shifts register: "Bestow upon", "Set þe Seal", "Flee þe Keep", "Summoning þe bricks…" (thorns sparingly — headings and buttons only).
- Optional lute music: a single audio file behind a "♪" toggle button (never autoplays), preference persisted. Browser-native MIDI is not viable; the audio is shipped pre-rendered (spike to source FM-synth/OPL3-flavored rendition).
- The theme toggle survives as Day (stone wall) ⇄ Dungeon (starfield) with the existing three-mode light/dark/system behavior.

Explicitly excluded: cursor sparkle trail, "NEW!"/"CURSED!" starbursts, autoplaying sound.

## Capabilities

### New Capabilities
- `lute-music`: Optional medieval-flavored background music toggle — single pre-rendered audio file, explicit user opt-in, no autoplay, persisted preference.

### Modified Capabilities
- `medieval-theme`: The visual design system is replaced wholesale. Palette, typography hierarchy, background texture, ornamentation system, animation language, chronicles layout, login/404 theming, and copy register all change from "manuscript" to "1998 medieval kitsch". New requirements added for kitsch page furniture (marquee, visitor counter, webring, badges, construction notice), bevel chrome, period GIF ornamentation, era-fidelity broken details, and herald copy register.

## Impact

- `src/index.css` — full replacement of theme variables, fonts, keyframes; new kitsch utility layer (bevel, marquee, tiled backgrounds, drop caps, odometer).
- `index.html` — font imports, favicon, title register.
- `src/pages/home.tsx`, `src/pages/login.tsx`, `src/pages/not-found.tsx` — markup retrofits (marquee, counter, webring, badges, GIF placement).
- `src/components/ChroniclesView.tsx`, `src/components/TransferModal.tsx`, `src/components/ThemeToggle.tsx`, `src/components/ui/*` — bevel styling, GIF ornamentation, drop caps, scroll-themed toasts.
- `src/locales/en.ts`, `src/locales/fr.ts` — copy register shift (both languages).
- `public/gifs/` (new) — hunted period GIF assets; `public/audio/` (new) — lute music file.
- No backend, API, database, or auth changes. No new runtime dependencies (audio uses native HTMLAudioElement).

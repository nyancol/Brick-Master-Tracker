# Tasks: add-ye-olde-kitsch-theme

## 1. Asset Hunt (GifCities)

- [x] 1.1 Browse GifCities for candidate GIFs: dragon, castle gate, torch/flame, scroll/parchment, skull, knight/mason, harp/lute, swords/shield, divider bars; download picks into `public/gifs/`
- [x] 1.2 Verify each GIF ≤ ~150KB, keep native dimensions; reject broken/oversized finds
- [x] 1.3 Create `public/gifs/CREDITS.md` recording source URL and description per asset
- [x] 1.4 Create the JPEG-crushed stone-wall tile (~quality 15) and a starfield dungeon tile for the Day/Dungeon backgrounds

## 2. CSS Kit (src/index.css)

- [x] 2.1 Replace font imports (drop Cinzel/EB Garamond; add UnifrakturMaguntia + Comic Neue); swap palette variables to Day (stone wall) and Dungeon (starfield) values
- [x] 2.2 Add `.tile-stone` / `.tile-dungeon` body backgrounds with tile attachment; opaque parchment/dark-stone card surfaces
- [x] 2.3 Add bevel utilities (`.bevel`, `.bevel-in`) with pressed `:active` inset state for buttons and cards
- [x] 2.4 Add `.kitsch-marquee` keyframes (continuous horizontal scroll) honoring `prefers-reduced-motion`
- [x] 2.5 Add `.dropcap` (blackletter floated first letter), `.odometer` (mono digits in bordered cells), and rainbow/period divider class
- [x] 2.6 Add footer link colors (#0000EE/#551A8B, underlined) and blackletter heading shadow utility
- [x] 2.7 Keep unfurl, seal-stamp, gold-pulse keyframes; remove superseded manuscript textures

## 3. Components & Chrome

- [x] 3.1 Create `HearYeMarquee` component: latest transfer as herald announcement, static call as empty state
- [x] 3.2 Create `VisitorCounter` component: odometer cells, 41,000 base + localStorage visit count (increment per load)
- [x] 3.3 Create `WebringFooter` ("Ye Olde Brick Webring", prev/random/next, era-default links), `Badges88` (best-viewed notice + ≥2 88×31 badges), `ConstructionBadge` (knight GIF, ~103% width stretch)
- [x] 3.4 Retrofit `home.tsx`: dragon GIF beside title, torch GIFs flanking brick cards, skull GIF on Shame card, marquee under header, footer furniture assembled
- [x] 3.5 Retrofit `ChroniclesView.tsx`: parchment cards with visible seams, `.dropcap` on story text, scroll GIF in header; keep Roman-numeral year headings, unfurl animation
- [x] 3.6 Retrofit `TransferModal.tsx` and toaster: parchment/scroll surfaces, seal-stamp modal animation retained
- [x] 3.7 Retrofit `login.tsx` (castle-gate GIF, blackletter title, beveled button) and `not-found.tsx` ("Halt! Who goes there?")
- [x] 3.8 Reskin `ThemeToggle.tsx` to Day/Dungeon (behavior unchanged); reskin `Button`/`Card`/`Ornament` to bevel chrome
- [x] 3.9 Apply slightly inconsistent footer section margins (era-fidelity detail)

## 4. Lute Music

- [x] 4.1 Spike: search Archive.org for an FM-synth/OPL3-flavored medieval rendition (e.g. Greensleeves); fallback plan: render a period MIDI offline through an OPL3 emulator
- [x] 4.2 Ship chosen track as `public/audio/lute.mp3` (≤ ~2MB, loopable)
- [x] 4.3 Build `useLute` hook (HTMLAudioElement, loop, localStorage `lute` preference, default off, never autoplay) and ♪ toggle button in the header

## 5. Copy Register (i18n)

- [x] 5.1 Apply EN register shift in `src/locales/en.ts` ("Bestow upon", "Set þe Seal", "Flee þe Keep", "Summoning þe bricks...", "þe Grete Chronicle", not-found "Halt! Who goes there?"); brick names unchanged
- [x] 5.2 Apply FR register shift in `src/locales/fr.ts` ("Sceller à jamais", "Fuir le donjon", "Invocation des briques...", "la Grande Chronique", "Halte ! Qui va là ?"); brick names unchanged

## 6. Verification

- [ ] 6.1 Manual pass in Day and Dungeon modes: contrast over tiles, bevel states, marquee behavior, GIF placement at native sizes
- [x] 6.2 Verify `prefers-reduced-motion` renders marquee statically and pauses loops
- [x] 6.3 Check page-weight budget (≤ ~4MB new assets) and run lint/typecheck; exercise transfer flow end-to-end

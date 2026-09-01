# Design: add-ye-olde-kitsch-theme

## Context

The app currently uses the "manuscript" theme: Cinzel/EB Garamond/Cutive Mono typography, restrained gold accents, subtle CSS textures, tasteful medieval framing. The owner wants full replacement with a 1998 GeoCities medieval-fandom aesthetic — the conceit being that this brick-tracking guild homepage was lovingly hand-built in 1998 by a herald with FrontPage. Every classic 90s web crime is wanted, recast in medieval register, with deliberately "broken" era-fidelity details and authentic period GIF assets.

Current implementation surface: CSS-variable theming in `src/index.css` (Tailwind v4 `@theme inline`), `ThemeToggle` with light/dark/system modes + flicker-prevention script in `index.html`, components (`home`, `login`, `not-found`, `ChroniclesView`, `TransferModal`, `Toaster`, `Ornament`, `Card`, `Button`), i18n via `src/locales/{en,fr}.ts`.

## Goals / Non-Goals

**Goals:**
- Full visual replacement: no modern-minimal fallback mode.
- Era-authentic kitsh details: tiled stone background, bevel chrome, marquee, visitor counter, webring, 88×31 badges, "best viewed" notice, under-construction badge, drop caps.
- Real period GIFs sourced from the GeoCities archive corpus, downloaded locally.
- Deliberate broken details (JPEG-crushed tiles, non-uniform scaling, default link colors, uneven margins) — era-fidelity, lovingly wrong.
- Copy register shift in EN and FR.
- Optional lute music behind an explicit toggle (never autoplays).
- Dark mode survives as "Dungeon" (starfield, torch-lit).

**Non-Goals:**
- No backend/API/database changes.
- No cursor sparkle trail, no "NEW!"/"CURSED!" starbursts, no autoplaying sound.
- No "sane mode" toggle — the kitsch is the site.
- No runtime MIDI synthesis (browsers dropped native MIDI; soundfonts lose the soul).

## Decisions

### D1: Typography stack — era-default over refined
| Role | Font | Rationale |
|---|---|---|
| Display/headings | `UnifrakturMaguntia` (Google) | Blackletter, the canonical "ye olde" web heading font |
| Body | `"Times New Roman", Times, serif` | It was the browser default; Garamond is too refined. Zero load cost. |
| Webmaster asides | `"Comic Sans MS", "Comic Neue", cursive` | For casual footer asides ("best viewed…" fine print). Comic Neue (Google) covers Linux where Comic Sans MS is absent. |
| Counter/labels | existing `Cutive Mono` | Odometer digits, small labels |

Old fonts (Cinzel, EB Garamond) are dropped from the import. Serif body stays anti-aliased; headings get a hard 4px-ish drop shadow (no blur — era WordArt had crisp offsets), not the current subtle text effects.

### D2: Palette — two kitsch palettes on the existing CSS-var system
- **Day (light, default):** castle-stone wall. Greys/warm greys tiles, parchment content cards (opaque enough to guarantee contrast over the busy tile), deep red + navy for honor/shame, brass/gold primary, `#0000EE`/`#551A8B` default link colors in the footer webring zone.
- **Dungeon (dark):** near-black starfield tile, text in pale gold/bone, torch GIFs do the "lighting", cards in dark stone.
Reuse the existing `:root` / `:root.dark` variable blocks and `.dark` class mechanism — only the values and background images change. The flicker-prevention script in `index.html` stays untouched.

### D3: Assets — hunted period GIFs, downloaded, used at native size
Source: [GifCities](https://gifcities.org) (Internet Archive's GeoCities GIF search). Search terms per surface: `dragon` (title), `castle gate` (login), `torch`/`flame` (flanking brick cards), `scroll`/`parchment` (Chronicle header), `skull` (Brick of Shame), `knight`/`mason` (construction badge), `harp`/`lute` (music toggle), `swords crossed`/`shield` (badges), `divider bar`/`rainbow` (section dividers).
Rules: download into `public/gifs/` (never hotlink — Archive URLs are fragile); keep native pixel dimensions and place at native size (stretching only where a broken detail is wanted); ≤ ~150KB per file; record source URL per asset in `public/gifs/CREDITS.md`. Brick PNGs stay unchanged (existing preservation requirement).
Alternative rejected: pure CSS/SVG recreations — crisp and themeable but emotionally wrong; period GIFs *are* the aesthetic.

### D4: Broken details — the fidelity recipe
- Stone tile run through a JPEG-crusher (~quality 15) so compression artifacts are baked in; tile visibly repeats on large viewports.
- Construction GIF stretched ~103% wide.
- Footer links use era-default colors, always underlined.
- Section margins deliberately slightly inconsistent (e.g. `space-y-11` vs `space-y-12` where it doesn't hurt).
- Cards get solid-ish backgrounds so the busy tile doesn't kill readability; the tile stays busy on purpose.

### D5: Kitsch chrome — one utility layer + small components
New Tailwind v4 utilities/classes in `src/index.css`:
- `.bevel` / `.bevel-in` — Win98 outset/inset border styling (stone/brass recolor); buttons get `:active` pressed inset state.
- `.kitsch-marquee` — CSS keyframes marquee (no `<marquee>` element).
- `.dropcap` — `::first-letter` illuminated drop cap (blackletter, ~3em float).
- `.tile-stone` / `.tile-dungeon` — body background tiles.
- `.odometer` — mono digits in bordered cells.
- Rainbow/period divider class.
New small components: `HearYeMarquee`, `VisitorCounter`, `WebringFooter`, `Badges88` (best-viewed + 88×31 buttons), `ConstructionBadge`. The marquee content is the latest transfer ("Hear Ye! The Brick of Honor hath passed unto Sir Yann!") — real data, kitsch presentation; falls back to a static call when no transfers exist.
Visitor counter: `41,000 + localStorage visit count` (increments per load), rendered as odometer digits in bordered cells. No API change.

### D6: Component retrofit mapping
- `home.tsx` — marquee under header, torch GIFs flanking brick cards, skull on Shame card, counter + webring + badges + construction notice in footer, section dividers.
- `ChroniclesView.tsx` — parchment cards with visible tiled seams, drop caps on story text, year headings keep Roman numerals (fits both aesthetics), scroll GIF in header.
- `TransferModal.tsx` / `Toaster` — parchment/scroll styling; seal-stamp and unfurl animations retained (they read as era-plausible).
- `login.tsx` — castle-gate GIF, blackletter title, beveled sign-in button.
- `not-found.tsx` — kitsch error card ("Halt! Who goes there…").
- `ThemeToggle.tsx` — icons/labels reskin to Day/Dungeon, behavior unchanged.
- Keep: unfurl, seal-stamp, gold-pulse keyframes; drop nothing from animations, add marquee scroll.

### D7: Lute music — pre-rendered single file, explicit opt-in
`HTMLAudioElement` + one file in `public/audio/lute.mp3` (≤ ~2MB, loop). Source: spike during implementation — search Archive.org for an FM-synth/OPL3-flavored medieval rendition (e.g. Greensleeves); fallback: take a period MIDI and render it once offline through an OPL3 emulator, ship the MP3. Toggle button (♪) in the header; state persisted in localStorage (`lute`); default OFF; never autoplays; pauses when tab hidden is NOT required (loop is fine).

### D8: Copy register (EN + FR)
| Key | EN | FR |
|---|---|---|
| `honor.transferTo` | Bestow upon | Décerner à |
| `shame.offloadTo` | Offload upon (keep) | Re refiler à (keep) |
| `modal.confirm` | Set þe Seal | Sceller à jamais |
| `modal.descriptionLabel` | Inscribe thy tale in þe chronicle... | Inscris ton exploit dans la chronique... |
| `logout` | Flee þe Keep | Fuir le donjon |
| `loading` | Summoning þe bricks... | Invocation des briques... |
| `chronicles.title` | þe Grete Chronicle | la Grande Chronique |
| `notFound.title` | Halt! Who goes there? | Halte ! Qui va là ? |
Thorn (þ) usage: sparingly — headings and buttons only; meta-text stays readable. Brick names ("Brick of Honor"/"Brick of Shame") remain unchanged per the preserved requirement.

## Risks / Trade-offs

- **Motion sensitivity / annoyance (marquee)** → all marquee/blink-adjacent animation honors `prefers-reduced-motion` (marquee renders as static text).
- **Readability regression (busy tile, Times/Comic Sans)** → opaque parchment/dark-stone cards, checked contrast; tiles sit behind content, not under it.
- **Missing fonts on Linux (Comic Sans MS)** → Comic Neue fallback shipped via Google Fonts import.
- **GIF licensing murk (orphan GeoCities works)** → private fun app; assets downloaded locally with `CREDITS.md` citing source URLs; acceptable risk.
- **Page weight (GIFs + audio)** → budgets: ≤150KB/GIF, ≤2MB audio; total new assets ≤ ~4MB. Acceptable for a hobby app.
- **Kitsch fatigue for daily users** → accepted by owner (full replacement is the point); Day/Dungeon toggle remains as the only relief valve.

## Migration Plan

Single frontend deploy; no data or API migration. Order: asset hunt → CSS kit → component retrofits → copy pass → music spike. Rollback = `git revert`.

## Open Questions

- Final GIF picks (the hunt is inherently serendipitous; exact assets chosen during implementation).
- Final music track depends on the Archive.org spike outcome.
- Visitor counter base value: 41,000 (chosen) vs something funnier (e.g. 40,001) — trivial to change, decide at implementation.

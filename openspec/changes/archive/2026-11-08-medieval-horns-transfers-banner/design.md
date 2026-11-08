## Context

The home page top banner is `HearYeMarquee` (`src/components/kitsch/HearYeMarquee.tsx`): a single beveled bar whose inner `<span>` scrolls via the `.kitsch-marquee` keyframes in `src/index.css`. The message logic (latest transfer → herald template, genesis → forged template, empty/loading states) is settled and must not change. The user wants 90s horn GIFs flanking the announcement text to deepen the medieval style. All period GIFs live in `public/gifs/` at native dimensions with attribution in `public/gifs/CREDITS.md` (GifCities sources, no hotlinking) — the new asset must follow the same rule.

## Goals / Non-Goals

**Goals:**
- A mirrored pair of horn/herald GIFs flanks the marquee announcement (left + right), at native pixel size, in Day and Dungeon themes.
- Scrolling text behavior, message copy, and empty/loading states unchanged.
- `prefers-reduced-motion` gets a static rendering (animated GIFs cannot be paused by CSS alone).
- New asset sourced from GifCities, stored locally, attributed in CREDITS.md.

**Non-Goals:**
- No marquee copy, i18n, API, or tenure/chronicle changes.
- No sound fanfare, no new animation language, no layout changes elsewhere on the page.
- No new component library or image pipeline.

## Decisions

**1. Horns outside the scrolling element, mirrored pair.**
`HearYeMarquee` becomes a flex row: `<img horn/>` + existing marquee `<div class="kitsch-marquee flex-1">` + `<img horn mirrored/>`. The right horn gets `scale-x-[-1]` (Tailwind) so the pair faces inward like herald trumpeters. Alternative considered: background-image on the marquee bar or absolutely-positioned overlays — rejected because they would overlap/clip the scrolling text and break the bevel-in look. Alternative considered: putting the GIFs inside the scrolling span — rejected because they would scroll away with the text instead of framing it.

**2. One new GifCities asset, native dimensions.**
Hunt GifCities for a herald blowing a horn / crossed trumpets in 90s style (same sourcing ritual as `torch.gif`, `skull.gif`, etc.), save as `public/gifs/horn-herald.gif`, add one row to `public/gifs/CREDITS.md`. If no clean horn GIF exists, fallback priority: (a) trumpet/cornet GIF, (b) herald-with-banner figure. Rationale: keeps the "authentic period GIF, served locally" contract; native size avoids the deliberately-broken non-uniform scaling (that gag is reserved for the construction badge).

**3. Reduced motion via static first-frame swap.**
CSS cannot pause a GIF, so the design pre-generates `public/gifs/horn-herald-static.png` (first frame, via ffmpeg/ImageMagick at authoring time — a committed asset, not a build step) and swaps: the animated `<img>` is hidden and the static one shown under `@media (prefers-reduced-motion: reduce)`, matching the existing pattern where the marquee text itself goes static. Alternative considered: `loading=lazy`/decoding tricks or JS matchMedia swap — rejected; a pure CSS class swap has no JS, no hydration timing issues. A decorative `aria-hidden="true"` + empty `alt=""` on both images keeps the marquee's `aria-label` as the single accessible name.

**4. No theme-specific variants.**
The bevel bar already adapts via `bg-card text-card-foreground` CSS vars; the GIF is opaque pixel art like `torch.gif`/`skull.gif` and reads on both stone and starfield. No `.dark` overrides needed.

## Risks / Trade-offs

- [Risk] No suitable horn GIF on GifCities → Mitigation: documented fallback chain (trumpet → herald figure); change still shippable with any period brass GIF.
- [Risk] GIF native size too large/tall for the bar → Mitigation: constrain display height with `h-*` + `w-auto` (uniform scale, unlike the construction-badge gag) so the bar height stays ~single-line; verify by screenshot.
- [Risk] Static first-frame extraction looks bad → Mitigation: eyeball the PNG; if the first frame is a blank/transition frame, pick a representative frame instead and note it in CREDITS.
- [Risk] Doubling images (animated + static in DOM) bloats HTML slightly → Mitigation: negligible (two tiny `<img>` pairs, one hidden); keeps zero-JS swap.

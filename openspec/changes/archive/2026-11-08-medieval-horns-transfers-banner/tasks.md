## 1. Horn-herald asset

- [x] 1.1 Hunt GifCities for a 90s horn/herald GIF (herald blowing horn preferred; fallback: trumpet/cornet, then herald-with-banner figure) and save it as `public/gifs/horn-herald.gif` at native dimensions
- [x] 1.2 Add the source URL row for `horn-herald.gif` to `public/gifs/CREDITS.md`
- [x] 1.3 Extract a representative first frame to `public/gifs/horn-herald-static.png` for the reduced-motion fallback (ffmpeg/ImageMagick, committed asset)

## 2. Marquee flanking layout

- [x] 2.1 Restructure `HearYeMarquee` (`src/components/kitsch/HearYeMarquee.tsx`) into a flex row: horn `<img>` + existing scrolling bar (`kitsch-marquee flex-1`, message logic untouched) + mirrored horn `<img>` (`scale-x-[-1]`); both images `aria-hidden="true"` with empty `alt`
- [x] 2.2 Add sizing/reduced-motion rules in `src/index.css`: uniform height cap (`h-*` + `w-auto`, no non-uniform stretch) and animated/static swap under `@media (prefers-reduced-motion: reduce)`
- [x] 2.3 Run `npm run typecheck` and `npm run build` to confirm no regressions

## 3. Verification

- [x] 3.1 Start isolated test server (`PORT=3199 DATA_PATH=/tmp/opencode/bmt-data DB_PATH=/tmp/opencode/bmt-data/brick.db IMAGE_PATH=/tmp/opencode/bmt-data/upload node dist/server.mjs`, after `fuser -k 3199/tcp` + `ss` check) with dev-login cookie for user `yann`
- [x] 3.2 Playwright harness (scratch copy under /tmp/opencode, patched Firefox): capture before/after full-page screenshots across light + dark (via `theme` localStorage), en + fr (via `lang` localStorage), normal motion + `reducedMotion: "reduce"`; wait for `networkidle` + landmark selector before capture
- [x] 3.3 Eyeball PNGs via Read: horns flank the bar symmetrically at native size without clipping the scrolling text; static PNG shown under reduced motion; marquee copy/behavior unchanged; kill test server when done

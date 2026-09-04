# Tasks

## 1. Shared toggle component

- [x] 1.1 Create `src/components/language-toggle.tsx`: export `LanguageToggle({ onLangChange }: { onLangChange: (lang: "en" | "fr") => void })` rendering the EN/FR bevel buttons (active `bg-primary text-primary-foreground`, inactive `bg-card text-card-foreground hover:bg-muted`, `transition-colors`), active state via `getLanguage()`, click calls `changeLanguage(code)` then `onLangChange(code)` (per design decisions 1 and 4)
- [x] 1.2 Refactor `src/pages/home.tsx` to render `<LanguageToggle onLangChange={...}>` in the header, deleting the inline `LANGS` map and `handleLangChange` while keeping the existing `forceRender` bump in the callback; header layout unchanged

## 2. Gate page integration

- [x] 2.1 In `src/pages/login.tsx`, add a `forceRender` counter (same pattern as home) and render `<LanguageToggle>` in a fixed top-right wrapper (`absolute top-4 right-4`), wired to the counter; rest of the gate composition untouched (per design decision 2)

## 3. Verification

- [x] 3.1 `npm run typecheck` passes
- [x] 3.2 Build and run the isolated test server (`fuser -k 3199/tcp` first; `PORT=3199 DATA_PATH=/tmp/opencode/bmt-data DB_PATH=/tmp/opencode/bmt-data/brick.db IMAGE_PATH=/tmp/opencode/bmt-data/upload node dist/server.mjs`) and confirm the listening line in the log
- [x] 3.3 Playwright-core harness (scratch copy under `/tmp/opencode`), unauthenticated gate page: selector is visible; clicking FR on an `en` context re-renders gate strings to French; clicking EN re-renders to English; `localStorage["lang"]` equals the clicked code after each switch; active button (`bg-primary`) matches
- [x] 3.4 Same harness, authenticated home page: selector still present in header; switching persists across reload and across navigation (gate → home renders in chosen language); active indication follows the switch (spec: choice persists and wins)
- [x] 3.5 Full-page screenshots with `waitUntil:"networkidle"` + landmark `waitForSelector`, entry animations waited out: gate page × light+dark × fr+en (plus a 360px-wide light-fr shot to eyeball the corner overlap risk), home header before/after refactor for visual parity; eyeball via Read; kill the test server when done

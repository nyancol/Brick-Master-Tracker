# Tasks

## 1. Pure resolver

- [x] 1.1 Create `src/lib/language.ts` exporting `resolveDefaultLanguage(locale: string | undefined | null): "en" | "fr"` — case-insensitive primary-subtag prefix match (`fr*` → `fr`, `en*` → `en`, else `fr`); type-only imports only, no runtime dependencies (per design decision 2)
- [x] 1.2 Unit-test the resolver with a `/tmp/opencode` scratch `.mjs` importing the real `.ts` module (node type stripping): assert `fr-FR`, `fr`, `fr-CA`, `fr-Latn-CA` → `fr`; `en-US`, `en-GB` → `en`; `de-DE`, `es-MX`, `""`, `undefined`, `null` → `fr`

## 2. Wire into translation hook

- [x] 2.1 In `src/hooks/use-translation.ts`, change `getLang()` so the no-stored-preference branch returns `resolveDefaultLanguage(navigator.language)` instead of the hardcoded `"en"`; keep stored-value validation and everything else untouched
- [x] 2.2 Confirm `changeLanguage()` still persists to `localStorage` and that no code path writes the device-detected default to storage (spec: detection is a default, not a preference)

## 3. Verification

- [x] 3.1 `npm run typecheck` passes
- [x] 3.2 Build and run the isolated test server (`fuser -k 3199/tcp` first; `PORT=3199 DATA_PATH=/tmp/opencode/bmt-data DB_PATH=/tmp/opencode/bmt-data/brick.db IMAGE_PATH=/tmp/opencode/bmt-data/upload node dist/server.mjs`) and confirm the listening line in the log
- [x] 3.3 Playwright-core harness (scratch copy under `/tmp/opencode`): for each browser locale override — `fr-FR`, `en-US`, `de-DE` — load the home page with no `lang` key in storage (fresh context) and assert the rendered UI language matches the spec (fr, en, fr respectively)
- [x] 3.4 Same harness: set `localStorage.setItem("lang","en")` via `addInitScript` on a `fr-FR` context → page renders English; set `"lang","fr"` on an `en-US` context → page renders French; verify the `lang` key is absent from storage after a detection-only load and present after a toggle click
- [x] 3.5 Before/after full-page screenshots (`waitUntil:"networkidle"` + landmark `waitForSelector`, wait out entry animations) for light+dark × fr+en; eyeball via Read to confirm zero visual regression; kill the test server when done

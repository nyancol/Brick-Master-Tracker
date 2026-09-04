# Design: Device Language Default

## Context

`src/hooks/use-translation.ts` resolves the app language at module load: `getLang()` reads `localStorage["lang"]` and, when absent or invalid, returns the hardcoded `"en"`. The two supported locales are `en` and `fr` (dictionaries in `src/locales/`). The home page exposes an EN/FR toggle that calls `changeLanguage()`, persisting the choice. There is no server-side language handling and no SSR — this is a client-only SPA, so `navigator` is always available at module evaluation time in the browser.

## Goals / Non-Goals

**Goals:**

- On first visit (no stored preference), default to the device/browser language when it is French or English.
- French as the catch-all fallback when the device locale is neither.
- Keep explicit user choice (stored preference) authoritative over detection.

**Non-Goals:**

- No new locales, no locale dictionary changes.
- No runtime language switching based on server or URL signals; no `Accept-Language` negotiation (client-only app, no SSR).
- No UI changes to the language toggle.
- No persistence of the device-detected default (it stays a *default*, not a preference).

## Decisions

### 1. Detection source: `navigator.language`, primary subtag prefix match

Resolve the device default from `navigator.language` (e.g. `"fr-CA"`, `"en-US"`); match on the primary language subtag: starts with `fr` → `fr`, starts with `en` → `en`, anything else → `fr`.

- *Why `navigator.language` only?* It is the user's configured browser UI locale and is sufficient here. Walking `navigator.languages` adds ordering rules (e.g. `"de, fr;q=0.9"`) with no practical benefit for a two-locale, French-fallback product; revisit only if a second locale family is added.
- *Why prefix match?* Regional variants (`fr-CA`, `fr-CH`, `en-GB`) must map to their base language; exact-match against full tags would miss them. Case-insensitive comparison guards against exotic casing.

### 2. Extract a pure resolver into `src/lib/language.ts`

Implement `resolveDefaultLanguage(locale: string | undefined | null): "en" | "fr"` as a pure function with no runtime imports (no React, no `localStorage`, no `navigator`) — the locale string is passed in as a parameter. `getLang()` in `use-translation.ts` calls it with `navigator.language`.

- *Why?* Project convention: pure modules under `src/lib/*` (type-only imports) are unit-testable with plain `node` type stripping — the matching rules (prefixes, fallback) get direct test coverage without a browser.

### 3. Detection result is never written to storage

Only `changeLanguage()` (user action) writes `localStorage["lang"]`. Until then, device detection re-runs on every load, so the default follows the device.

- *Why not persist the detected default?* Persisting would freeze an incidental first-visit locale as a pseudo-preference and desync from the device (e.g. device language changed later). Detection is cheap and deterministic; re-running it is harmless.

### 4. Resolution order stays: stored preference → device → `fr`

`getLang()` keeps its shape: validate stored value first (`"en" | "fr"`), otherwise `resolveDefaultLanguage(navigator.language)`. The only behavioral change is the terminal fallback (`"en"` → French rule inside the resolver).

## Risks / Trade-offs

- [Returning French users who never toggled see a language change if their device locale is French] → Acceptable and desired: it is exactly the fix. Anyone who toggled already has a stored preference and is unaffected.
- [Browsers reporting non-French/English locales default to French, surprising English speakers on e.g. German systems] → Mitigated by the one-tap EN toggle; product decision per the proposal (French is the fallback language of the app).
- [`navigator.language` unavailable or empty in exotic embedded contexts] → `resolveDefaultLanguage(undefined)` returns `fr`; safe, deterministic.
- [Locale tags with script/region subtags like `fr-Latn-CA`] → Primary subtag prefix match handles them; no full BCP-47 parsing needed.

## Migration Plan

Single client commit; no data, API, or storage migration. Rollback = revert the commit; stored preferences and all existing behavior are untouched.

## Open Questions

None.

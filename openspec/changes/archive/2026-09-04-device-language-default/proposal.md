# Device Language Default

## Why

The app hardcodes English (`"en"`) as the fallback when no language preference is stored, so French-speaking users (the app's other fully supported locale) always start in English until they manually switch. First-time visitors should land in their device's language when it is one we support, instead of a fixed default.

## What Changes

- Replace the hardcoded `"en"` fallback in the language resolver with device-language detection: on first visit (no stored preference), the default language is `fr` if the device/browser locale is French, `en` if it is English.
- Change the catch-all fallback (device locale is neither French nor English) from English to French.
- An explicit user choice (persisted via the existing language toggle) still wins over device detection, exactly as today.

## Capabilities

### New Capabilities

- `language-default`: How the app resolves its initial/default language — device locale detection (French or English only), French as catch-all fallback, and stored user preference taking precedence.

### Modified Capabilities

<!-- None: no existing spec constrains default-language resolution. -->

## Impact

- `src/hooks/use-translation.ts` — `getLang()` default-resolution logic only; `t()`, `getLanguage()`, `changeLanguage()`, and the stored-preference behavior are untouched.
- No new dependencies; `navigator.language(s)` is a browser API.
- No server, API, or data changes. No locale dictionary changes (`en.ts`/`fr.ts` untouched).

### Out of scope (visual surfaces)

No visual or layout changes — the existing language toggle (EN/FR buttons on the home page), its styling, and all rendered strings stay exactly as they are. Only which language renders by default on first visit changes.

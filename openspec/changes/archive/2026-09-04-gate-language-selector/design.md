# Design: Gate Language Selector

## Context

Language switching today lives only in the home header (`src/pages/home.tsx`): an inline `LANGS` map (`en`/`fr`) renders two bevel buttons; `handleLangChange` calls `changeLanguage()` (which sets module state and persists to `localStorage["lang"]`) then bumps a local `forceRender` counter because `t()` is a plain, non-reactive function. The gate entry page (`src/pages/login.tsx`) renders `t()` strings but offers no switcher, and it is reachable without authentication. A `language-selector` capability spec does not exist yet; `language-default` covers only default resolution and already guarantees a stored choice wins.

## Goals / Non-Goals

**Goals:**

- EN/FR selector available on the gate entry page, before authentication.
- One shared `LanguageToggle` component used by both gate page and home header (no duplicated markup).
- Identical behavior everywhere: immediate re-render in the chosen language, persistence, active-state indication.

**Non-Goals:**

- No reactive-i18n refactor (no context/provider or `useSyncExternalStore` migration) — the `forceRender` convention stays.
- No changes to default-language resolution (`language-default`), locale dictionaries, or the gate page's existing composition.
- No new locales, no server/API changes.

## Decisions

### 1. Extract `src/components/language-toggle.tsx` with an `onLangChange` callback

`LanguageToggle` owns the `LANGS` map, button markup (`bevel font-mono text-xs px-3 py-1`, active = `bg-primary text-primary-foreground`, inactive = `bg-card text-card-foreground hover:bg-muted`), and calls `changeLanguage(lang)`; it then invokes an `onLangChange` prop so the embedding page can trigger its own re-render.

- *Why a callback instead of self-contained reactivity?* `t()` consumers are in the page components, so the page must re-render. A callback keeps the existing forceRender convention (home.tsx:156-159) with zero changes to the translation hook. A reactive store (context + `useSyncExternalStore`) would be cleaner long-term but is a cross-cutting refactor touching all 14 `t()` consumers — rejected as scope creep.
- *Why extract at all?* Adding a second copy of the button markup would duplicate active-state logic; the two surfaces must stay visually identical, which a shared component guarantees by construction.

### 2. Gate page placement: fixed top-right corner

On `login.tsx`, render `<LanguageToggle>` in a fixed top-right wrapper (`absolute top-4 right-4` within the page container), matching the home header's top-right position convention.

- *Why not inline in the column flow?* The gate page is a centered vertical composition (dragon + title, subtitle, gate GIF, sign-in, dev picker); a corner control reads as chrome, not content, and avoids shifting the composition or adding vertical space.
- *Why not identical flex-header markup?* The gate page has no header bar; absolute positioning within `min-h-screen` reproduces the same visual location without restructuring.

### 3. Home uses the shared component in place

Replace the inline `LANGS.map(...)` block in the home header with `<LanguageToggle onLangChange={...}>`; the existing `forceRender` bump moves into the callback. `LANGS`/`handleLangChange` inline definitions are removed from `home.tsx`.

### 4. No dictionary additions

`EN` and `FR` are language names, not translatable strings — both render identically in both locales, so `en.ts`/`fr.ts` and the `TKey` union stay untouched.

## Risks / Trade-offs

- [Callback forgotten by a future embedder → UI language silently doesn't re-render] → The component is the only sanctioned embed point; both current call sites pass the callback. TypeScript requires the prop (non-optional), making omission a compile error.
- [Duplicate state source: module-level `currentLang` vs component render] → Same as status quo; `getLanguage()` remains the single source of truth for the active indication, read during render.
- [Fixed overlay could overlap content on very narrow viewports] → Gate content is centered with `p-4`; the compact toggle (~70px wide) at top-4/right-4 clears the centered column at all supported widths. Verify at 360px viewport in the screenshot matrix.
- [`transition-colors` on buttons vs prefers-reduced-motion] → Color transitions are excluded from motion-reduction concerns (no movement); existing home toggle already ships this.

## Migration Plan

Single client commit; no data, API, or storage migration. Rollback = revert the commit. Stored preferences untouched.

## Open Questions

None.

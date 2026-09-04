# Gate Language Selector

## Why

The EN/FR language selector only exists in the home page header, which requires authentication. A first-time visitor landing on the gate entry (login) page in the wrong language has no way to switch languages before signing in — the page they must interact with is stuck in whatever the device detection resolved.

## What Changes

- Add the EN/FR language selector to the gate entry (login) page, visually consistent with the existing home header toggle (bevel buttons, active-state highlight).
- Extract the language toggle into a shared `LanguageToggle` component and reuse it in both the home header and the gate page, removing the duplicated inline markup from the home page.
- Selector behavior stays identical to today: switching updates the rendered strings immediately, persists the choice to storage, and the persisted choice wins on subsequent loads.

## Capabilities

### New Capabilities

- `language-selector`: The manual EN/FR language selector control — its presence on the gate entry page and the home header, active-language indication, immediate re-render of the UI in the chosen language, and persistence of the explicit choice.

### Modified Capabilities

<!-- None: language-default (default resolution) is unaffected — an explicit selector choice was already specified to persist and win; only the control's placement is new. -->

## Impact

- `src/pages/login.tsx` — add the selector to the gate page.
- New `src/components/language-toggle.tsx` — shared toggle component (extracted from the home header markup).
- `src/pages/home.tsx` — replace inline LANGS buttons with the shared component (behavior unchanged).
- No new dependencies; no server, API, or storage changes; no locale dictionary changes (the `EN`/`FR` labels are language names, identical in both locales).

### Out of scope (visual surfaces)

No changes to the gate page's existing composition (dragon, title, gate GIF, sign-in button, dev picker) beyond adding the selector; no changes to default-language resolution; no new locales.

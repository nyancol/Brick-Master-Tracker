## Why

The medieval theme currently relies solely on the device `prefers-color-scheme` media query, giving users no way to manually switch between Manuscript (light) and Scriptorium (dark) modes. Users who prefer one theme over the other—or who want to toggle based on ambient lighting—are locked into their OS setting.

## What Changes

- Add a manual theme toggle button in the home page header that allows users to switch between light (Manuscript), dark (Scriptorium), or system (device) theme
- Persist the user's theme preference in localStorage so it survives page reloads
- Add a React context (`ThemeProvider`) to manage theme state and apply the correct CSS class on `<html>`
- Replace the pure CSS `@media (prefers-color-scheme: dark)` approach with a combination of CSS custom properties and a data-theme attribute or class on the root element
- Ensure the toggle degrades gracefully: default to system preference when no localStorage value exists
- Add sun and moon icons using Lucide's `Sun` and `Moon` icons (or similar medieval-appropriate alternatives), styled to match the heraldic iconography of the existing UI

## Capabilities

### New Capabilities
- `theme-toggle`: A manual theme toggle that lets users select light, dark, or system-follow mode with persistent preference storage and medieval-styled sun/moon icons

### Modified Capabilities
- `medieval-theme`: The existing Dual Palette Theme Toggle requirement needs updating to support manual override in addition to the current `prefers-color-scheme` auto-detection

## Impact

- **New component**: `ThemeProvider` context in `src/components/theme-provider.tsx`
- **Modified CSS**: `src/index.css` — the `@media (prefers-color-scheme: dark)` block needs to be converted to work with a class-based or attribute-based toggle so both manual and system modes work
- **Modified page**: `src/pages/home.tsx` — add the toggle button in the header area alongside the language switcher
- **Modified app root**: `src/App.tsx` — wrap with `ThemeProvider`
- **No new dependencies**: Lucide already has `Sun` and `Moon` icons; Tailwind's `dark:` variant can be reconfigured from `@media` to class-based via `@custom-variant dark (&:where(.dark, .dark *))`
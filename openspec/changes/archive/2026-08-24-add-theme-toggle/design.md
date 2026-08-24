## Context

The Brick Master Tracker uses CSS custom properties (HSL variables) for theming, currently toggled solely by `@media (prefers-color-scheme: dark)`. Users have no way to manually override their OS-level preference. The existing `medieval-theme` spec calls for a "Dual Palette Theme Toggle" but only auto-detection was implemented.

The toggle needs to integrate with:
- The existing `src/index.css` (CSS custom properties + Tailwind v4)
- The React component tree (App.tsx wrapping all pages)
- The home page header (alongside language switcher and user info)
- A persistence mechanism (localStorage)

## Goals / Non-Goals

**Goals:**
- Provide a three-state theme toggle: light (Manuscript), dark (Scriptorium), system (follow device)
- Default to system preference when no explicit choice is stored
- Persist the user's choice in localStorage across sessions
- Use sun (☀) and moon (☾) icons styled with the existing medieval/heraldic aesthetic
- Show the active state visually — the icon corresponding to the current mode should appear "active" (e.g., highlighted)
- Keep the CSS approach: use a class on `<html>` (`.dark` or `data-theme="dark"`) to override the media query
- Wrap in a React context so any component can read or change the theme

**Non-Goals:**
- No new external dependencies (Lucide already has Sun/Moon icons)
- No server-side rendering changes
- No animation on theme switch beyond what CSS transitions already provide
- No per-page or per-component theme overrides

## Decisions

1. **Class-based dark variant over data-attribute**: Change the Tailwind `dark:` variant from `@media (prefers-color-scheme: dark)` to `&:where(.dark, .dark *)`. This lets us toggle the `.dark` class on `<html>` to force dark mode, and remove it to force light mode. The `:where()` selector ensures specificity parity with the original media query. When in "system" mode, we set/remove `.dark` based on a `matchMedia` listener at runtime.

2. **ThemeProvider with React Context**: A `ThemeProvider` component wraps the app, reads initial value from localStorage (falling back to `"system"`), applies/removes `.dark` on `<html>`, listens for `prefers-color-scheme` changes when in system mode, and exposes `{ theme, setTheme, resolvedTheme }` to consumers. `resolvedTheme` is the actual effective theme (`"light"` or `"dark"`) derived from either the explicit choice or the media query result.

3. **Three-state enum**: `"light"` | `"dark"` | `"system"`. Stored as-is in localStorage under key `"theme"`. The resolved theme is computed: if `"system"`, use `matchMedia` result; otherwise use the stored value directly.

4. **CSS architecture**: Keep `:root` for light colors, move dark colors into `:root.dark` and `:root.dark body`. Remove the `@media (prefers-color-scheme: dark)` wrapping. The media query background image variants also move into `.dark` selectors. The Tailwind `@custom-variant dark` changes to class-based.

5. **Sun/Moon icons**: Use Lucide's `Sun` and `Moon` icons. Style them with the same heraldic approach as other icons (gold color, consistent sizing). The active mode's icon gets `text-gold` and a subtle glow/ring, the inactive icon stays `text-muted-foreground` and responds to hover.

6. **Button placement**: In the home page header, right-aligned row alongside the language picker, before the user info. This keeps all top-level chrome controls together.

## Risks / Trade-offs

- **Flicker on load**: If the user has a dark preference, the page might render light before the JS runs and adds `.dark`. Mitigation: Add a blocking `<script>` in `index.html` that reads localStorage and `matchMedia` and sets `.dark` before the first paint. This is a one-liner in the `<head>`.
- **Tailwind dark variant change**: Changing `@custom-variant dark` from `@media` to class-based is a one-line CSS change but affects every `dark:` utility in the codebase. Verify by checking that all `dark:` prefixed classes work correctly after the change.
- **matchMedia listener cleanup**: The `change` event listener on the media query must be removed when the component unmounts or when the user switches away from "system" mode.
- **localStorage race conditions**: The blocking script in `index.html` reads localStorage before any JS framework loads, so the flicker is fully mitigated regardless of bundle size.
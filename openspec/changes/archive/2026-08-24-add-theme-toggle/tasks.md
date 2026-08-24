## 1. CSS: Convert dark variant from media-query to class-based

- [x] 1.1 Change `@custom-variant dark` from `@media (prefers-color-scheme: dark)` to `&:where(.dark, .dark *)`
- [x] 1.2 Move dark palette CSS from `@media (prefers-color-scheme: dark)` block into `:root.dark` selector
- [x] 1.3 Move dark background-image variants from `@media` block into `.dark` body selector
- [x] 1.4 Verify all existing `dark:` Tailwind utilities still compile and work correctly

## 2. Flicker prevention script

- [x] 2.1 Add inline blocking script to `index.html` `<head>` that reads localStorage("theme") and matchMedia, then sets/removes `.dark` on `<html>` before first paint

## 3. ThemeProvider React context

- [x] 3.1 Create `src/components/theme-provider.tsx` with ThemeProvider component and useTheme hook
- [x] 3.2 Implement theme state: "light" | "dark" | "system" with localStorage persistence
- [x] 3.3 Implement `resolvedTheme` computed from current state + matchMedia listener
- [x] 3.4 Manage `.dark` class on `<html>` element, including matchMedia change listener in system mode
- [x] 3.5 Clean up matchMedia listener on unmount or when leaving system mode

## 4. Theme toggle button

- [x] 4.1 Create `src/components/ThemeToggle.tsx` with sun (Sun) and moon (Moon) Lucide icons
- [x] 4.2 Implement three-state toggle: clicking sun selects light, moon selects dark, clicking active icon returns to system
- [x] 4.3 Style active icon with `text-gold` and inactive with `text-muted-foreground`; add hover state
- [x] 4.4 Style the toggle button to match the medieval/heraldic aesthetic (consistent with language picker)

## 5. Wire up in App

- [x] 5.1 Wrap `<App />` with ThemeProvider in `src/App.tsx`
- [x] 5.2 Add ThemeToggle component to the header row in `src/pages/home.tsx` alongside the language switcher

## 6. Verify

- [x] 6.1 Test that system mode follows device prefers-color-scheme changes live
- [x] 6.2 Test that manual light/dark overrides persist across page reload
- [x] 6.3 Test that switching from manual back to system re-enables device-following
- [x] 6.4 Test that no flash-of-wrong-theme occurs on cold load with dark preference
- [x] 6.5 Test that all pages (home, login, 404) render correctly in both themes
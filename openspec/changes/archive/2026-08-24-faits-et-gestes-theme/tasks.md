## 1. Design Tokens Foundation

- [x] 1.1 Replace Google Fonts import: remove Bricolage Grotesque + Space Mono, add Cinzel (wght@700), EB Garamond (ital,wght@0,400;0,700;1,400), Cutive Mono in `src/index.css`
- [x] 1.2 Rewrite `@theme inline` block: map `--font-sans` to EB Garamond, `--font-serif` to EB Garamond, `--font-mono` to Cutive Mono, add `--font-display` for Cinzel
- [x] 1.3 Define HSL color tokens for Manuscript (`:root`) and Scriptorium (`.dark`): background, foreground, card, border, muted, muted-foreground, gold, honor, shame, ring — per design.md D1 values
- [x] 1.4 Register animation keyframes in `@theme inline`: `--animate-unfurl`, `--animate-seal-stamp`, `--animate-gold-pulse` with their `@keyframes` definitions
- [x] 1.5 Update `@layer base` body styles: replace Neo Arcade radial gradient with parchment grain (light) / candle glow (dark) CSS-only backgrounds, remove `.brick-shadow-red` and `.brick-shadow-blue` classes

## 2. UI Primitives

- [x] 2.1 Update `src/components/ui/button.tsx`: add `heraldic` variant with gold border, replace purple hover/focus with `--gold` tones, add `animate-gold-pulse` to focus ring
- [x] 2.2 Update `src/components/ui/card.tsx`: reduce border-radius from `rounded-xl` to `rounded-sm`, add subtle inner outline for framed manuscript look
- [x] 2.3 Update `src/components/ui/toaster.tsx`: restyle toast notification with medieval palette (parchment bg, sepia text, gold border)
- [x] 2.4 Create `src/components/ui/ornament.tsx`: `<Ornament>` component with `position` (top-left/top-right/bottom-left/bottom-right) and `size` (sm/md/lg) props, rendering SVG corner motifs with `currentColor`

## 3. Icon Remapping

- [x] 3.1 Replace `User` with `Shield` in `src/pages/home.tsx` header
- [x] 3.2 Replace `BookOpen` with `ScrollText` in `src/components/ChroniclesView.tsx` section header
- [x] 3.3 Replace `Pencil` with `Feather` in `src/components/ChroniclesView.tsx` story edit
- [x] 3.4 Replace `Upload` with `Scroll` icon in `src/components/ChroniclesView.tsx` and `src/components/TransferModal.tsx`
- [x] 3.5 Replace `LogOut` with `DoorOpen` in `src/pages/home.tsx` footer
- [x] 3.6 Replace `AlertCircle` with `ShieldAlert` in `src/components/TransferModal.tsx` error state

## 4. Home Page Redesign

- [x] 4.1 Update page title (`h1`) to use `font-display` (Cinzel), remove the gradient `bg-clip-text` effect on the last word, apply uniform gold color
- [x] 4.2 Update subtitle to use `font-mono` Cutive Mono with appropriate styling
- [x] 4.3 Restyle brick cards: remove neon blur glow backgrounds and `brick-shadow-*` classes, replace with shield-shaped SVG clip-path decorative layer, add inline SVG in page defining the heater shield path, replace `rounded-3xl` with shield framing, replace `hover:scale-[1.02]` with subtle tilt/opacity effect
- [x] 4.4 Replace red/cyan border colors on brick cards with `--honor` and `--shame` token colors
- [x] 4.5 Update transfer buttons: use `variant="heraldic"` with honor/shame border colors
- [x] 4.6 Add ornamental divider (Unicode fleuron `❦` or double CSS rule) between brick section and chronicles section

## 5. Chronicles Section Redesign

- [x] 5.1 Update section header with Cinzel display font and double ornamental rule (top and bottom borders), add `ScrollText` icon
- [x] 5.2 Reshape year headings with decorative rule using CSS borders, Roman numerals ("ANNO DOMINI MMXXIV"), and fleuron `✦` marker
- [x] 5.3 Redesign chronicle entry card: reduce border-radius, add framed border styling, replace colored dot with fleuron bullet `✦`
- [x] 5.4 Update story text display to use EB Garamond italic (`font-serif italic`) for manuscript feel
- [x] 5.5 Add gold-toned border frames (via `border-gold/40`) around photo thumbnails for illuminated miniature effect
- [x] 5.6 Add `animate-unfurl` class to expanded content container for scroll-unrolling animation
- [x] 5.7 Style empty state with medieval card and appropriate ornamentation

## 6. Login Page Redesign

- [x] 6.1 Update title to `font-display` Cinzel with gold color
- [x] 6.2 Style sign-in button as heraldic entry portal with gold border and medieval typography
- [x] 6.3 Apply background texture consistent with Manuscript/Scriptorium theme
- [x] 7.1 Apply `animate-seal-stamp` animation class to modal panel on mount
- [x] 7.2 Restyle textarea with muted parchment background and sepia focus ring
- [x] 7.3 Style confirm button as golden heraldic button for "seal the deed" effect
- [x] 7.4 Replace emoji header icons with decorative CSS or Unicode alternatives
- [x] 8.1 Apply medieval card styling with serif typography and themed colors to the 404 page

## 9. Polish and Verification

- [x] 9.1 Test light/dark mode switching: verify smooth transition when device `prefers-color-scheme` changes
- [x] 9.2 Verify contrast ratios: ensure all text meets >= 4.5:1 ratio in both themes
- [x] 9.3 Verify brick images render correctly with new framing (no clipping, proper sizing)
- [x] 9.4 Verify no visual regressions in photo upload flow (staging, progress, error states)
- [x] 9.5 Run `pnpm run build` and verify no CSS or TypeScript errors
- [x] 9.6 Remove any remaining Neo Arcade artifacts: `brick-shadow-red`, `brick-shadow-blue`, purple accent references, gradient clip-text effects
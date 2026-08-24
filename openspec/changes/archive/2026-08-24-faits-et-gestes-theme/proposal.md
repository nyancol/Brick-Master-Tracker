## Why

The Brick Master Tracker already has a chivalric identity in its naming ("Brick of Honor", "Chronicles", "Legendary tokens") but its visual presentation is a cyberpunk "Neo Arcade" dark theme. This redesign aligns the look and feel with the product's narrative — transforming it into a medieval chronicler's manuscript, where transfers become entries in a book of deeds and each brick is treated as a heraldic relic.

## What Changes

- **Design tokens overhaul**: Replace the Neo Arcade HSL palette (dark blue/purple/cyan neon) with a dual light/dark medieval palette (manuscript parchment / scriptorium candlelit). Theme respects `prefers-color-scheme` for automatic light/dark switching.
- **Typography replacement**: Replace Bricolage Grotesque (sans-serif) with Cinzel (display headers) and EB Garamond (body serif), and Space Mono with Cutive Mono (mono labels). All loaded via Google Fonts.
- **Background texture**: Subtle parchment grain (light) and candlelit radial glow (dark) via CSS gradients — no external images.
- **Icon remapping**: Reassign Lucide icon choices across the app to heraldic/medieval equivalents (Shield for user, Feather for edit, ScrollText for chronicles, etc.). Decorative ornaments via Unicode fleurons (❦, ✦).
- **Ornamentation**: Decorative borders, double rules, fleurons, and golden accent lines throughout — implemented in CSS with minimal inline SVGs where CSS alone is insufficient (corner motifs, letrines).
- **Chronicles section redesign**: The transfer history page becomes a proper "illuminated manuscript" layout — year headings with decorative rules, entries framed as manuscript pages, story text in italic serif, photos as gilt-framed miniatures, and `unfurl` animation on expand.
- **Animation language**: Replace linear slide-up/hover-scale with manuscript-themed animations — unfurl (scroll unrolling), seal-stamp (modal confirmation), gold-pulse (focus rings).
- **UI component refinements**: Card borders become less rounded and more framed. Buttons gain a "heraldic" variant. Toasts styled as heraldic bandeaux. Login and 404 pages receive the same theme treatment.
- **Brick presentation preserved**: The red/blue brick images, names, and transfer mechanics remain visually and functionally unchanged — bricks are treated as relics displayed within heraldic frames.

## Capabilities

### New Capabilities
- `medieval-theme`: The complete design system — design tokens (light/dark dual palette), typography hierarchy (Cinzel/EB Garamond/Cutive Mono), background textures, icon mappings, ornamentation strategy, animation keyframes, and device-aware theme switching via `prefers-color-scheme`.

### Modified Capabilities
<!-- None — this is a purely cosmetic change with no functional requirement modifications -->

## Impact

- **Affected files**: `src/index.css` (complete rewrite of design tokens and base styles), `src/pages/home.tsx`, `src/pages/login.tsx`, `src/pages/not-found.tsx`, `src/components/ui/button.tsx`, `src/components/ui/card.tsx`, `src/components/ui/toaster.tsx`, `src/components/ChroniclesView.tsx`, `src/components/TransferModal.tsx`
- **Dependencies**: Three Google Fonts added (Cinzel, EB Garamond, Cutive Mono) — ~55KB total. No npm packages added or removed. Lucide icon set remains but with different icon name assignments.
- **No API changes**: The backend, database, auth flow, and data model are completely untouched.
- **No breaking changes**: The i18n system, props interfaces, and component APIs remain identical. Only styling changes.
## Context

The Brick Master Tracker currently uses a "Neo Arcade" dark theme: cool dark blue backgrounds (#230 35% 7%), purple primary accent (#260 80% 60%), red/cyan glow effects, Bricolage Grotesque sans-serif headings, Space Mono labels, and neon-like blur shadows on brick cards. The app's conceptual identity is already chivalric — "Bricks of Honor and Shame", "Chronicles", "Legendary tokens" — but the visual design contradicts this narrative.

The goal is a purely cosmetic redesign: no backend changes, no data model changes, no new npm dependencies. The redesign must support both light and dark modes based on the user's device `prefers-color-scheme` setting, using Tailwind CSS v4's `dark` variant mechanism already present in the codebase.

## Goals / Non-Goals

**Goals:**
- A dual light/dark design system inspired by medieval manuscripts and heraldry
- All visual changes through CSS tokens and Tailwind classes — no new libraries
- Fonts loaded from Google Fonts (Cinzel, EB Garamond, Cutive Mono) — ~55KB total
- Ornamentation via CSS (borders, gradients, Unicode) with minimal inline SVGs only where necessary
- Smooth animated transitions for chronicle expansion, modal opening, and focus rings
- Device-aware automatic theme switching via `prefers-color-scheme`
- Brick images (`/red-brick.png`, `/blue-brick.png`) preserved as-is

**Non-Goals:**
- No changes to brick names, i18n text content, or functional behavior
- No change to the icon library (Lucide remains, only icon name choices change)
- No new npm packages
- No backend or API modifications
- No dark mode manual toggle (relies on device preference only, per Tailwind v4 `dark` variant)
- No accessibility regression (contrast ratios remain >= 4.5:1)

## Decisions

### D1: Color Palette — HSL Token System

**Decision**: Replace all CSS custom property values in `:root` and `.dark` with a cohesive medieval palette. Both themes share the same token names — only the HSL values pivot between light and dark.

**Manuscript (light)**:
```
--background: 44 40% 87%       (#f4e8c1 parchment)
--foreground: 36 30% 10%       (#2a1f14 sepia ink)
--card:       44 30% 92%       (#efe1c0 warm vellum)
--border:     40 25% 75%       (#c4a97d gilt rule)
--muted:      44 20% 85%       (#e5d5b5 faded parchment)
--muted-foreground: 36 15% 40% (#6b5e4f faded ink)
--gold:       46 65% 45%       (#b8962e illumination gold)
--honor:      0 70% 32%        (#8b1a1a gules deep)
--shame:      200 25% 38%      (#2f4f5f azure dark)
--ring:       46 65% 45%       (#b8962e gold focus ring)
```

**Scriptorium (dark)**:
```
--background: 36 20% 8%        (#1a1510 oak desk)
--foreground: 42 30% 86%       (#e8dcc8 bone illuminum)
--card:       36 20% 12%       (#241e16 vellum by candle)
--border:     36 15% 22%       (#3d3224 muted filigree)
--muted:      36 15% 15%       (#2c2418 dark surface)
--muted-foreground: 36 15% 52% (#8b806a faded illuminum)
--gold:       44 50% 52%       (#c9a84c candle gold)
--honor:      5 65% 48%        (#c0392b illuminated gules)
--shame:      200 25% 52%      (#5f8fa4 illuminated azure)
--ring:       44 50% 52%       (#c9a84c gold focus ring)
```

**Rationale**: The HSL token approach preserves Tailwind v4 compatibility — all color classes (`bg-background`, `text-foreground`, `border-gold`, etc.) continue to work by simply reassigning the CSS variables. The golden ratio between light/dark lightness values ensures both themes feel like the same design system at different ambient light levels.

**Alternatives considered**:
- *Single dark theme only*: Rejected — user explicitly requested dual theme with device preference support.
- *Fully saturated medieval colors (bright heraldic)*: Rejected — would be too garish on screen. Muted, parchment-adjacent tones better evoke aged manuscripts.

### D2: Typography Stack

**Decision**: Three-font hierarchy:

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display | Cinzel | 700 | h1, page titles |
| Body | EB Garamond | 400, 400i | prose, story text, paragraphs |
| Mono | Cutive Mono | 400 | labels, metadata, dates |

Configured in Tailwind via `@theme inline`:
```
--font-sans: 'EB Garamond', serif;    (replaces Bricolage Grotesque)
--font-serif: 'EB Garamond', serif;   (explicit serif class)
--font-mono: 'Cutive Mono', monospace; (replaces Space Mono)
--font-display: 'Cinzel', serif;     (new, for titles)
```

Google Fonts URL: `family=Cinzel:wght@700&family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=Cutive+Mono&display=swap`

**Rationale**: Cinzel is a stately display face with excellent uppercase forms — it evokes engraved stone inscriptions. EB Garamond at 400 weight is highly readable at body sizes and its italic is a credible approximation of handwritten script. Cutive Mono has an old-style typewriter feel that reads as "scribe's ledger."

**Alternatives considered**:
- *UnifrakturCook (blackletter)*: Rejected — excellent for display but unreadable at body sizes and poor accessibility.
- *IM Fell English*: Rejected — beautiful but limited to one style, no monospace companion.

### D3: Icons — Remap, Don't Replace

**Decision**: Keep Lucide React as the icon library but change icon name choices throughout. No new icon package.

| Current Icon | Component | Replacement | Rationale |
|---|---|---|---|
| `User` | Home header | `Shield` | Heraldic identity |
| `BookOpen` | Chronicles header | `ScrollText` | Manuscript reference |
| `Pencil` | Story edit | `Feather` | Quill pen |
| `Upload` | Photo upload | `Scroll` | Scroll document |
| `LogOut` | Footer link | `DoorOpen` | Castle gate |
| `Trash2` | Photo delete | `X` | Simple cross |
| `AlertCircle` | Toast error | `ShieldAlert` | Heraldic warning |
| `Check` | Photo uploaded | `Check` (keep) | — |
| `ChevronDown/Up` | Expand | Keep both | — |
| `ArrowRight` | Transfer direction | Keep | — |
| `Loader2` | Loading spinner | Keep | — |
| `X` | Close modal | Keep | — |

**Rationale**: Every icon exists in Lucide already. No dependency changes. The mapping is conservative — only icons that have a clear medieval counterpart are swapped.

### D4: Background Texture — CSS-Only

**Decision**: Generate texture effects entirely through CSS gradients. No image files.

**Manuscript**:
```css
body {
  background-color: hsl(var(--background));
  background-image:
    /* subtle horizontal paper grain */
    repeating-linear-gradient(
      0deg, transparent, transparent 2px,
      rgba(139, 115, 85, 0.04) 2px, rgba(139, 115, 85, 0.04) 4px
    ),
    /* warm center glow */
    radial-gradient(ellipse at 50% 0%, hsl(44 35% 92%) 0%, transparent 70%);
  background-attachment: fixed;
}
```

**Scriptorium**:
```css
.dark body {
  background-image:
    /* candlelit center-top glow */
    radial-gradient(ellipse at 50% 30%, hsl(36 25% 17%) 0%, transparent 70%);
  background-attachment: fixed;
}
```

**Rationale**: CSS gradients add zero HTTP requests and negligible rendering cost. The grain effect in light mode is at 4% opacity — decorative without harming readability. The dark mode candle glow creates depth without the neon feel of the current radial background.

### D5: Ornamentation Strategy

**Decision**: Three-tier approach — Unicode first, CSS borders second, inline SVGs only as last resort.

**Unicode fleurons** (zero bytes beyond the character):
- Section dividers: `❦` (U+2766 floral heart), `✦` (U+2726 black four-pointed star)
- Inline in JSX as decorative separators

**CSS decorative rules** (no markup overhead):
- Double-line rules under headings: `border-bottom: 2px double var(--color-gold)`
- Card borders: `border: 1px solid var(--border); outline: 1px solid var(--gold); outline-offset: -4px;`

**Inline SVGs** (only where CSS can't express the shape):
- Corner motifs for chronicle section header: small data-URI SVG for a medieval corner bracket
- Lettrine/initial cap for story entries (optional, can also use CSS `first-letter`)

**Rationale**: Unicode is instantaneous and always renders. CSS borders are zero-cost. Inline SVGs avoid network requests and are trivially small (typically <200 bytes).

### D6: Animation Approach

**Decision**: Define three Tailwind keyframes in `@theme inline` and apply as needed.

```css
@keyframes unfurl {
  from { transform: scaleY(0); opacity: 0; transform-origin: top; }
  to   { transform: scaleY(1); opacity: 1; transform-origin: top; }
}

@keyframes seal-stamp {
  0%   { transform: scale(0.3); opacity: 0; }
  60%  { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes gold-pulse {
  0%, 100% { box-shadow: 0 0 0 2px hsla(var(--gold) / 0.4); }
  50%      { box-shadow: 0 0 0 4px hsla(var(--gold) / 0.15); }
}
```

Registered via `@theme inline`: `--animate-unfurl`, `--animate-seal-stamp`, `--animate-gold-pulse`.

**Usage**:
- Chronicle entry expand: `animate-unfurl` on the expanded content container
- Modal mount: `animate-seal-stamp` on the modal panel
- Focus ring: `animate-gold-pulse` on `:focus-visible`

### D7: Component Architecture — Minimal Changes

**Decision**: Modify component files only where styling changes are needed. No component API changes. No new components created (unless an ornamental wrapper proves cleaner than inline ornamentation).

| File | Change |
|------|--------|
| `src/index.css` | Complete rewrite of theme tokens, base styles, keyframes. Remove all Neo Arcade tokens. |
| `src/components/ui/button.tsx` | Add `heraldic` variant. Adjust hover/ring styles to use gold instead of purple. |
| `src/components/ui/card.tsx` | Reduce border-radius, add optional `ornamented` prop for framed card style. |
| `src/components/ui/toaster.tsx` | Restyle toast container with medieval palette. |
| `src/pages/home.tsx` | Title font to `font-display`, header separator ornamentation, card hover from scale to tilt. |
| `src/pages/login.tsx` | Title font, background texture, button styling. |
| `src/pages/not-found.tsx` | Themed card, serif text. |
| `src/components/ChroniclesView.tsx` | Major restyle: year headings, entry framing, story font, photo borders, unfurl animation. |
| `src/components/TransferModal.tsx` | Seal-stamp animation, parchment-style textarea, golden confirm button. |

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Google Fonts increase page load time | Subset to needed weights only. Total ~55KB. Add `display=swap` for instant text rendering with font swap. |
| EB Garamond at small sizes may have lower readability than Bricolage Grotesque | Set minimum font size for body text at 1rem (16px). Use 400 weight for best rendering. |
| Parchment grain effect may look noisy on some displays | Opacity at 3-4% — barely visible on most screens, decorative rather than textural. |
| Candle glow in dark mode creates uneven brightness | Gradient confined to top 30% of viewport, fades to solid background below. |
| Unicode fleurons may render inconsistently across platforms | Use only characters from the Dingbats and Miscellaneous Symbols blocks (U+2700–U+27BF, U+2766) which have near-universal font support. |
| `prefers-color-scheme` has no manual override | This matches the current Tailwind v4 `dark` variant approach. Adding a manual toggle would require JavaScript state management — explicitly out of scope for this change. |

### D7: Chronicles Year Headings — Roman Numerals

**Decision**: Year headings in the Chronicles section SHALL use Roman numerals in uppercase, preceded by "ANNO DOMINI". E.g., `ANNO DOMINI MMXXV`.

**Rationale**: Roman numerals reinforce the manuscript/chronicler aesthetic and are immediately readable for common years (MMXXV = 2025). The prefix "ANNO DOMINI" establishes the in-world framing.

### D8: Brick Cards — Shield-Shaped SVG Clip-Path

**Decision**: The brick cards (Brick of Honor, Brick of Shame) SHALL use an SVG `clip-path` to render as heraldic shields. The existing brick images remain unchanged within the shield frame. The shield shape uses a classic heater shield profile.

**Implementation sketch**:
```css
.shield-clip {
  clip-path: url(#heater-shield);
}
```
With a corresponding inline SVG definition in the page layout defining the `heater-shield` clip-path.

**Rationale**: The shield shape immediately communicates "heraldry" and transforms the card from a generic UI container into an in-world object. Clip-path is pure CSS — zero JavaScript, zero images. The existing brick images sit unmodified inside the shield.

**Alternatives considered**:
- *Rounded rectangles*: Rejected — too generic, doesn't sell the medieval theme.
- *Shield PNG/SVG as background*: Rejected — clip-path is more flexible (content scales automatically) and doesn't require image assets.

### D9: Ornament System — React Component

**Decision**: A minimal `<Ornament>` React component SHALL be created for decorative corner motifs, rather than using Tailwind data-URI backgrounds or inline `<svg>` elements throughout.

**Design** (`src/components/ui/ornament.tsx`):
- Props: `position` ("top-left" | "top-right" | "bottom-left" | "bottom-right"), `size` ("sm" | "md" | "lg")
- Renders a small SVG corner bracket at the specified position using absolute positioning
- Uses `currentColor` for color inheritance — adapts to theme automatically
- Contains the SVG path definitions internally (no external assets)

**Rationale**: A component is more flexible than CSS-only (supports all four corners, variable sizes, inherits theme colors), cleaner than inline SVGs repeated across files, and zero-dependency.

**Alternatives considered**:
- *Tailwind data-URI background*: Rejected — color would be baked into the URI, couldn't adapt to light/dark themes.
- *Inline SVG in each file*: Rejected — verbose, hard to maintain consistently.
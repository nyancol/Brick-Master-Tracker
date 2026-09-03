# Proposal: Win98 Window Chrome + Sword SFX

## Why

The brick panels already gesture at the Win98 window metaphor (`HONOR.EXE` / `SHAME.EXE` title bars) but stop halfway — no window buttons, no status bars, no group boxes — leaving the page caught between "scroll with kitsch" and "committed software world". Committing fully to authentic window chrome on the brick panels and transfer modal sharpens the core design joke (a 1998 operating system for tracking holy relics) and deepens the contrast with the manuscript-styled Chronicles. A single transfer sound effect (sword *shing*) completes the sensory layer started by the lute music.

## What Changes

- Brick panels (Honor/Shame) get full Win98 window chrome:
  - Title bar window buttons `_ □ ✕` — `_` and `□` are decorative (era-authentic joke tooltips); `✕` shakes the window and shows a medieval toast ("Thou canst not close the Honor!")
  - Transfer button group framed in a Win98 group box (etched border + legend)
  - Status bar strip: brick count on the left, real days-held count + era joke ("56k modem") on the right
- Transfer modal becomes a proper titled dialog window ("Bestow the Brick — {name}") with a working `✕` close button, retaining the seal-stamp animation and gold ornaments
- New SFX toggle in the header (separate from the lute toggle), persisted to localStorage, default ON
- Sword *shing* sound effect plays on successful transfer confirm (user-initiated, autoplay-safe)
- All new UI strings added to both `en` and `fr` locales
- `prefers-reduced-motion` disables the window shake; both themes get correct bevel colors via existing CSS variables

Explicitly out of scope (decided during exploration): taskbar/Start menu, guestbook, statistics tab, trumpet fanfare on becoming holder, chronicles/login/404 chrome.

## Capabilities

### New Capabilities
- `window-chrome`: Full Win98 window treatment on the brick panels and transfer modal — title bars with window buttons, ✕ shake + toast behavior, group boxes, status bars, and the modal dialog conversion.
- `sound-effects`: Sound effects toggle and the sword *shing* transfer sound, with persistence and pre-rendered-audio playback.

### Modified Capabilities
<!-- None — medieval-theme's Brick Presentation Preservation and Bevel Chrome System requirements are unchanged; window chrome is a new additive layer. -->

## Impact

- **Code**:
  - `src/pages/home.tsx` — brick panel structure (title bar buttons, group box, status bar)
  - `src/components/TransferModal.tsx` — dialog chrome
  - `src/components/kitsch/` — new `WindowButton`/`GroupBox`/`StatusBar` primitives and `SfxToggle`
  - `src/hooks/` — new `use-sfx.ts` (mirrors `use-lute.ts` pattern)
  - `src/index.css` — shake keyframes, group box / status bar styles, tooltip style
  - `src/locales/en.ts`, `src/locales/fr.ts` — new strings
- **Assets**: one pre-rendered sword-shing audio file in `public/audio/`, credited in `public/gifs/CREDITS.md`
- **No API changes**, no schema changes, no new dependencies

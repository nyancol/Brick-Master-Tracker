# Design: Win98 Window Chrome + Sword SFX

## Context

The brick panels (`src/pages/home.tsx`) already have pseudo-window title bars (`HONOR.EXE` / `SHAME.EXE`) with GIF icons and gradient fills, framed in the `.bevel` / `.bevel-in` carved-stone chrome (`src/index.css`). The transfer modal (`src/components/TransferModal.tsx`) is a plain card with gold ornaments and a `seal-stamp` entry animation. Audio exists as a single pre-rendered file (`public/audio/lute.mp3`) managed by `src/hooks/use-lute.ts` with a localStorage preference. Transfers carry `transferredAt` timestamps (already loaded in home via `useTransfers`), so days-held is computable client-side with no API change. The project convention (from the `lute-music` spec) is pre-rendered audio files — no runtime synthesis, no third-party audio libraries.

Constraints carried over from exploration: both themes must keep correct bevel colors (CSS vars `--bevel-light` / `--bevel-dark`), all strings go through the i18n dictionary (`en`/`fr`), and `prefers-reduced-motion` must disable the shake.

## Goals / Non-Goals

**Goals:**
- Full Win98 window anatomy on brick panels: title bar buttons, group box, status bar
- Transfer modal becomes a titled dialog with working close
- One sound effect (sword *shing*) on transfer success, behind a dedicated persisted toggle
- Zero API/schema changes, zero new dependencies

**Non-Goals:**
- Taskbar / Start menu, guestbook, statistics views
- Trumpet fanfare on becoming holder (deferred; spec only covers the shing)
- Window chrome on Chronicles, login, or 404 pages (manuscript identity stays)
- Custom tooltip *system* (only chrome buttons need tooltips — see Decision 4)

## Decisions

### 1. Reusable `WindowFrame` component rather than inlining chrome markup

Brick panels and the modal both need title-bar anatomy. A single `WindowFrame` (in `src/components/kitsch/`) rendering `title`, optional title-bar icon, and `children` slots keeps the two surfaces consistent. The brick panels pass their existing gradient classes; the modal passes the gold-bordered dialog variant. The window buttons (`_ □ ✕`) are part of `WindowFrame` with a `closable` prop: brick windows get shake+toast on `✕`, the modal gets a real `onClose`.

*Alternatives considered*: inline the chrome twice (duplicated markup, drift risk); adopt `98.css` (new dependency, and its gray Win98 palette fights the carved-stone recasting — we only need ~40 lines of CSS we already half-own via `.bevel`).

### 2. Shake as a CSS class, refusal as existing toast system

`@keyframes window-shake` (~300ms, small translate/rotate) in `index.css`, applied by adding a class and removing it on `animationend`. The refusal message goes through the existing `useToast` (same pattern as transfer errors), so no new toast infrastructure. `@media (prefers-reduced-motion: reduce)` disables the animation — same pattern already used for the marquee and `seal-stamp`.

*Alternatives considered*: a bespoke floating medieval speech bubble (new component, new a11y surface) — rejected for scope; the toast is already the app's refusal voice.

### 3. Days-held computed in `home.tsx` from existing transfer data

`useTransfers()` already returns the full history. Compute `daysHeld = floor((now - max(transferredAt for color))/86400000)`. No API change. Refetch already happens after transfer, so the count self-corrects.

*Alternatives considered*: server-computed field (API churn for a cosmetic number); a midnight-timer to keep it exact at day boundaries (overkill — recompute on render/refetch is fine for a gag-grade status bar).

### 4. Tooltips: CSS-only, `data-tip` attribute instead of a tooltip component

Only three buttons need tooltips. A `[data-tip]` hover pseudo-element styled `#FFFFE1` + 1px black border (Win98 signature) is ~10 lines of CSS, no JS, no portal, no focus management questions. Interactive enough for a decorative button; keyboard users get the button's `aria-label` instead.

*Alternatives considered*: full custom tooltip component (over-engineered for decorative buttons); native `title` attribute (unstylish, spec requires the Win98 look).

### 5. SFX mirrors `use-lute.ts`: `use-sfx.ts` + pre-rendered file

`use-sfx.ts` reads/writes localStorage key `sfx` (default `"on"` when absent), exposes `enabled` and `play()`. `play()` guards on the preference, plays `public/audio/sword-shing.mp3` once (`currentTime = 0; play()` to allow rapid re-triggers). The `SfxToggle` component (`kitsch/`) renders `⚔` in the same bevel button style as `LuteToggle`, placed beside it in the header. Asset sourced CC-licensed (GifCities/archive.org or freesound CC0), re-encoded small, credited in `public/gifs/CREDITS.md` alongside the lute.

*Alternatives considered*: WebAudio synthesis (no asset hunt, but synthesizing a convincing metallic shing is genuinely hard, and it would contradict the project's documented no-synthesis stance); folding SFX into the lute toggle (rejected by user decision — separate toggles).

### 6. Group box as a styled `fieldset`/`legend`

Native `fieldset` + `legend` gives the etched double-border look with `border-color` inversions (`.group-box` class in `index.css`, using the bevel vars), and it's semantically the right element for grouping related buttons. Legend uses the existing `honor.transferTo` / `shame.offloadTo` i18n keys already rendered above the buttons.

### 7. Status bar as a `StatusBar` primitive

A thin `bevel-in` strip, `font-mono text-[10px]`, left/right slots. Brick windows: "1 brick(s)" | `{days} days · 56k modem`. Modal: `→ {recipient}` | `56k modem`. All label strings i18n'd.

## Risks / Trade-offs

- [Title bar clutter on narrow viewports] → Buttons are compact (16px bevel squares); title text truncates with `ellipsis` before buttons wrap; tested at 360px.
- [Shake + toast may fire rapidly on repeated ✕ clicks] → `animationend`-guarded class toggle; toast system already coalesces.
- [Days-held wrong if `transferredAt` missing/malformed] → `null`-safe: fall back to `— days`.
- [Autoplay policy on shing] → Non-issue: play is triggered by the confirm click (user gesture), never on load. The fanfare would have needed deferral — one more reason it's deferred.
- [Audio asset licensing] → Only CC0/CC-BY sources; record attribution in `CREDITS.md` at acquisition time, same as the lute.
- [Group box legend text collides with existing label above buttons] → Replace the existing standalone label with the legend (no duplicate "Bestow upon:" text).

## Migration Plan

Purely additive frontend change. Ship behind nothing — no flags, no data migration. Rollback = revert commit. No server involvement.

## Open Questions

- ~~Which sword-shing asset to source~~ **Resolved during implementation**: no mp3 encoder available in the environment, so the asset ships as 22050 Hz mono 16-bit WAV (`public/audio/sword-shing.wav`, 62 KB) — natively supported by `HTMLAudioElement`. It is synthesized procedurally (inharmonic metallic partials over a noise-scrape transient), following the project precedent of the generated background tiles; this avoids licensing entirely and is credited in `CREDITS.md` under "Generated locally".

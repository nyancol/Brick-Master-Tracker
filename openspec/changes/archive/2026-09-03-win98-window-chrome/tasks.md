# Tasks: Win98 Window Chrome + Sword SFX

## 1. CSS foundation

- [x] 1.1 Add `@keyframes window-shake` + `.window-shaking` class in `src/index.css`, disabled under `prefers-reduced-motion`
- [x] 1.2 Add `.group-box` / `.group-box > legend` etched styles using `--bevel-light`/`--bevel-dark` vars (both themes correct)
- [x] 1.3 Add Win98 window-button styles (16px bevel squares, active-state bevel inversion) and `[data-tip]` tooltip styles (`#FFFFE1` bg, 1px black border), themed for both modes

## 2. WindowFrame primitive

- [x] 2.1 Create `src/components/kitsch/WindowFrame.tsx`: title bar (icon slot, title, `_ □ ✕`), `closable`/`onClose` props, decorative `_`/`□` with `data-tip` tooltips + `aria-label`s, status bar slot
- [x] 2.2 Implement `✕` shake behavior: `animationend`-guarded `.window-shaking` class toggle, optional `onCloseRequest` callback for real close (modal) vs shake+toast (brick panels)
- [x] 2.3 Create `src/components/kitsch/StatusBar.tsx` (thin `bevel-in` strip, left/right slots)

## 3. i18n strings

- [x] 3.1 Add en + fr keys: window button tooltips (`minimize`, `maximize` jokes), close refusal toasts (honor/shame variants), "1 brick(s)" status label, "days held" label, "56k modem" joke label, modal dialog titles ("Bestow the Brick — {name}" / "Offload the Brick — {name}"), modal status recipient label
- [x] 3.2 Verify no duplicate "Bestow upon:" text after legend replaces the standalone label

## 4. Brick panels

- [x] 4.1 Wrap Honor panel in `WindowFrame` (existing gradient title bar, swords GIF, `HONOR.EXE` text); `✕` triggers shake + honor refusal toast
- [x] 4.2 Replace standalone transfer label with `fieldset.group-box` legend using existing `honor.transferTo` key; buttons unchanged
- [x] 4.3 Add `StatusBar`: left "1 brick(s)", right days-held + "56k modem"; compute days from latest red transfer `transferredAt` (null-safe fallback)
- [x] 4.4 Repeat 4.1–4.3 for Shame panel (skull GIF, `SHAME.EXE`, blue gradient, shame refusal toast, blue transfer data)

## 5. Transfer modal dialog

- [x] 5.1 Convert modal to `WindowFrame` dialog variant: titled title bar ("Bestow/Offload the Brick — {name}"), working `✕` = `onCancel`, keep seal-stamp animation + gold ornaments
- [x] 5.2 Add modal `StatusBar` (recipient + era joke)

## 6. Sound effects

- [x] 6.1 Source CC0/CC-BY sword-shing audio (~1–2s mono), encode to `public/audio/sword-shing.mp3`, record attribution in `public/gifs/CREDITS.md`
- [x] 6.2 Create `src/hooks/use-sfx.ts` (localStorage key `sfx`, default ON when absent, `enabled` + `play()` guard, replay-safe single-shot playback) mirroring `use-lute.ts`
- [x] 6.3 Create `src/components/kitsch/SfxToggle.tsx` (⚔ bevel button, active state, aria-label via i18n) and place beside `LuteToggle` in header
- [x] 6.4 Play shing in `handleTransferConfirm` success path (after `transferBrick` resolves, before/with toast); verify silence on failure and when disabled

## 7. Verification

- [x] 7.1 Manual pass: both themes × both locales — window chrome renders, tooltips show Win98 style, ✕ shakes + toasts, status bars show correct days, modal dialog works
- [x] 7.2 `prefers-reduced-motion` pass: no shake, marquee/modal behavior unchanged
- [x] 7.3 Transfer E2E: confirm with SFX on (shing plays once), with SFX off (silent), failure path (no sound); run lint/typecheck/build

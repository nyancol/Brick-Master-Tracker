# Design: add-environment-badge

## Context

The `add-feature-flags` change (17/20 tasks, container verification pending) shipped a throwaway `ui-demo-badge` flag gating a small flag icon in the footer — built purely to verify the flag pipeline. The user wants a permanent badge instead: show the environment («dev» / «staging») in dev and preprod, hide it in production.

Constraint from project i18n/theme conventions: every user-facing string must exist in both en and fr; both Day and Dungeon themes must render correctly. The SPA is client-rendered; all environment knowledge must reach it from the server.

## Goals / Non-Goals

**Goals:**
- At-a-glance environment identification in the UI
- Production renders nothing (zero visual footprint where it matters most)
- Localized badge label; works in both themes
- Remove the demo flag now that a real element supersedes it

**Non-Goals:**
- Per-user or per-role badge variations
- Showing the badge on the login page (deferred; revisit if wanted)
- Any change to the flag system itself (it stays as shipped)
- Version/build-hash display in the badge (possible follow-up)

## Decisions

### D1: Environment identity comes from `APP_ENV`, not a flag

The badge visibility rule ("show everywhere except production") is **deployment identity**, not behavior. Per the framing established during exploration: env vars carry identity-of-deployment; flags carry behavior. Also, an env-driven badge works before `/api/flags` exists and is immune to "someone flipped the flag off".

`APP_ENV` values: `dev` (default when unset — host-run dev), `staging` (preprod), `production` (prod). Values other than these three render the badge with the raw value as label (fail-visible rather than fail-hidden: an unknown environment is exactly when you want the indicator).

- *Alternatives considered:*
  - **A string flag (`environment`) in the flag files**: rejected — the prod flag file would carry the "hide the badge" duty, mixing identity into behavior config; also breaks if flag evaluation falls back to defaults (badge would show "production-default" semantics unexpectedly).
  - **Parsing `OTEL_RESOURCE_ATTRIBUTES`** (`deployment.environment.name`): rejected — telemetry config is optional (unset in some setups) and string-parsing it for app logic couples unrelated subsystems.

### D2: Server exposes the environment on the client bootstrap path

The SPA needs the value before/independent of authentication. Options: piggyback on `GET /api/flags` (wrong — flags response shape is a flat key→value map; adding a non-flag key muddies the contract with the registry), or a tiny dedicated public endpoint. Choose: **`GET /api/environment`** returning `{ environment: "dev" | "staging" | "production" }`. It is fetched once alongside `/api/flags` at boot.

- *Alternatives considered:*
  - **Inject into `index.html`**: rejected again (same as flags design — two mechanisms for dev/prod HTML serving).
  - **Extend `/api/flags`**: rejected above.

### D3: Badge replaces the demo flag icon; demo flag is removed

The footer badge component takes the environment label and renders nothing when the value is `production`. The `ui-demo-badge` flag, its footer icon, and its entries in all three flag files are deleted — keeping a dead demo flag around invites confusion. The badge is **not** flag-gated: its spec is env-driven, and hiding it in production is structural, not a toggle.

### D4: i18n and theming

Labels «dev» and «staging» (fr: «dev», «staging» — the same words are natural French here, but they live in both locale files per the both-locales rule). Badge styling: footer-furniture aesthetic consistent with `Badges88`/`ConstructionBadge` (existing footer elements), verified in Day and Dungeon themes.

## Risks / Trade-offs

- [`APP_ENV` unset in a future container deploy → badge shows «dev» in prod] → Mitigation: `APP_ENV=production` pinned in `compose.yaml` (same pattern as `DATA_PATH`, which is pinned for exactly this reason); fail-visible default chosen deliberately over fail-hidden.
- [Badge visible to authenticated users only (footer is in `Home`)] → Accepted; preprod testing is done logged in. Login-page badge listed as non-goal.
- [Depends on `add-feature-flags` for the footer location and client bootstrap fetch pattern] → Implement after or alongside; the badge itself does not need the flags endpoint.

## Migration Plan

1. Ship `APP_ENV` plumbing + badge; deploy prod (badge hidden — `production`) and preprod (badge shows «staging»).
2. Remove `ui-demo-badge` in the same change (flag files shrink; no behavior loss — its default was off everywhere).
3. Rollback: revert deploy; badge disappears, nothing else affected.

## Open Questions

- None blocking. Exact badge visual (text-only pill vs 88×31-style button matching `Badges88`) decided during implementation against screenshots in both themes.

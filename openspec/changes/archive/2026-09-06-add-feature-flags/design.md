# Design: add-feature-flags

## Context

Single Express process serves API + SPA, backed by SQLite. Two containerized environments (prod on `compose.yaml`, preprod via `compose.preprod.yaml`) plus host-run dev (`pnpm dev`, Vite middleware). Behavior toggles today are static env vars requiring restart/redeploy. Three human users, no per-user feature targeting wanted. Deploy workflow is already commit → push → `git pull` on server. Observability exists (LGTM stack) but flag evaluation telemetry is a non-goal for v1.

The app's flags must be visible to **both** API and UI (e.g., a future accent-color change), so values must reach the browser somehow. The SPA is fully client-rendered; the server owns all evaluation.

## Goals / Non-Goals

**Goals:**
- Flags-as-code: flag files in git, per-environment values, deployed by `git pull`
- Live reload without restart in all three environments
- OpenFeature API so providers can be swapped without touching business code
- Fail-safe: every flag has a code default that equals current behavior
- No new public attack surface; no Docker container required for local dev

**Non-Goals:**
- Per-user targeting / canary-by-user (no session-based evaluation context)
- Percentage/gradual rollouts (meaningless with 3 users)
- Real-time push of UI flag changes to open tabs (page reload is the accepted delivery)
- Flag evaluation telemetry (custom OTel hook — possible later)
- A flags admin UI

## Decisions

### D1: Server-authoritative evaluation; client hydrates from `/api/flags`

The browser never talks to flagd. Express evaluates flags (OpenFeature client) and exposes `GET /api/flags` returning `{ [flagKey]: value }` for all keys in the shared registry. The SPA fetches it once at boot, before render, and seeds a web `InMemoryProvider`.

- *Alternatives considered:*
  - **`FlagdWebProvider` direct from browser** (real-time streaming updates): rejected — requires exposing flagd through Caddy (new public surface, CORS, TLS config) and hands the full flag config to the client. Page-reload delivery is acceptable at git-pull rollout cadence.
  - **Injecting flags into `index.html` bootstrap**: rejected — `index.html` is served by Vite in dev but Express in prod; two injection mechanisms for one job. The boot-fetch is one code path everywhere.

### D2: flagd sidecar with file sync in prod and preprod

`flagd` container (`ghcr.io/open-feature/flagd`) started with `--uri file:/etc/flagd/flags.json`; the file is bind-mounted from the repo checkout (`./flags/flags.prod.json` / `./flags/flags.preprod.json`). flagd's file watcher reloads on change (validates first, keeps last-known-good on bad JSON). Express connects via `FLAGD_HOST=flagd` (compose service name), gRPC :8013.

One flagd per environment — preprod and prod flag values are independent, which is the point of preprod.

### D3: flagd provider in every environment — dev uses the in-process resolver

The same `FlagdProvider` class serves all three environments; only its configuration differs. Selection criterion: **`FLAGD_HOST` set → rpc resolver against the sidecar; unset → in-process resolver with `offlineFlagSourcePath: flags/flags.dev.json`.** Dev `.env` simply omits it; no new config knob.

The in-process resolver embeds flagd's evaluation engine in the Node process and watches the flag file natively (flagd file-sync semantics: live reload, last-known-good on bad JSON) — no flagd daemon, no Docker, no adapter code. `flags/flags.dev.json` stays in flagd format, so the file format never forks across environments, and dev evaluates with true flagd behavior. Known trade-off: the provider watches the file via stat polling (`fs.watchFile`, ~5s interval) rather than inotify, so dev reload latency is up to ~5s after a file edit — acceptable at git-pull rollout cadence.

- *Alternatives considered:*
  - **flagd in Docker for dev too** (full parity): rejected — dev loop should be `pnpm dev` alone.
  - **`@openfeature/env-var-provider`** (flags as env vars in `.env`): rejected — forks the source of truth away from `flags.dev.json`, breaking the commit-and-pull story.
  - **Dev-only `InMemoryProvider` + format adapter + custom `fs.watch`**: the originally committed approach; superseded during implementation by the in-process resolver, which needs no adapter or custom watcher code and gives dev true flagd semantics with the same dependency we already ship.

### D4: Shared flag registry (`shared/flags.ts`)

Single source of truth for flag keys, value types, and code defaults, imported by both server (drives `/api/flags` — evaluates exactly these keys) and client (typed hooks + fallback defaults). Mirrors the existing `shared/constants.ts` pattern. Typos between JSON files and code become impossible; the code-default contract ("flag off = today's behavior") lives in one place.

Flag files additionally carry `defaultVariant` matching the code default (defense in depth).

### D5: Failure semantics — defaults are the contract

- flagd unreachable → OpenFeature returns code defaults; `/api/flags` still 200s with defaults; app boots, features off.
- Unknown/missing flag key → default from registry.
- Bad JSON committed → flagd keeps last-known-good and logs (prod/preprod and dev alike — the in-process resolver shares flagd's file-sync semantics); a file that is invalid at dev startup leaves the provider not-ready, which also resolves to defaults with a warning.
- Startup must not block on flagd readiness (`depends_on` healthcheck optional; code must tolerate it being down).

## Risks / Trade-offs

- [UI flags stale until reload] → Accepted; matches git-pull rollout cadence. Documented in API docs so it's a decision, not an accident.
- [Bind-mount + git rename vs flagd file watcher] → flagd handles replace-on-rename writes (editor/git-safe). Verify during implementation with an actual `git pull` on a mounted volume.
- [`/api/flags` unauthenticated exposes flag values] → Accepted: values are environment-wide and non-sensitive (e.g., booleans, colors); the login page needs them pre-auth.
- [Client fetch adds one sequential request before first render] → ~ms local call; evaluate flag values server-side per request means no staleness window beyond network. If it ever matters, prefetch in parallel with the JS bundle.
- [OpenFeature async init races early evaluations] → Call `/api/flags` handler only after provider `Ready` event (or rely on default-while-not-ready semantics); keep handler synchronous from the client's perspective.

## Migration Plan

1. Ship code with registry seeded with initial flags (safe/off defaults) and flag files in git. Existing behavior unchanged (defaults = current behavior).
2. Deploy: add flagd service + mounts via compose; prod and preprod pick up their own files on next `git pull`.
3. Rollback: remove the flagd service or revert flag file values to defaults — app behavior reverts to baseline with no code deploy. The OpenFeature dependency alone has no effect if no flags are read.

## Open Questions

- None blocking. Optional later: `mise run flags-up` task wrapping `docker run` flagd for local parity debugging (D3 makes this opt-in, not required).

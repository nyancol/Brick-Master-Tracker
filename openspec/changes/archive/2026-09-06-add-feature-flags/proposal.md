# Proposal: add-feature-flags

## Why

Feature behavior today can only be toggled through code deploys or restart-gated env vars (`DEV_LOGIN`, `OTEL_EXPORTER_OTLP_ENDPOINT`). Rolling out a new feature — or unshipping a broken one — requires a redeploy. We want dynamic, environment-scoped feature flags managed as code: flip a JSON file in git, `git pull`, and the change is live in seconds without a restart. OpenFeature (vendor-neutral API) + flagd (file-sync provider) gives this without adding a managed service.

## What Changes

- Add OpenFeature server SDK (`@openfeature/server-sdk`) to the Express server, backed by `@openfeature/flagd-provider` (gRPC) in containers
- Add a `flagd` sidecar service (file-sync mode) to `compose.yaml` (prod) and `compose.preprod.yaml` (preprod), each watching its own JSON flag file bind-mounted from the git checkout
- Add three flag files to git, all in flagd format, identical schema: `flags/flags.dev.json`, `flags/flags.preprod.json`, `flags/flags.prod.json` — differing only in values. Rollout workflow: edit file → commit → push → `git pull` on server; flagd's file watcher reloads sub-second
- Dev runs **without any flagd container or process**: when `FLAGD_HOST` is unset, the same flagd provider runs in-process (embedded evaluator, `offlineFlagSourcePath`) watching `flags/flags.dev.json` natively — live reload without dev-server restart
- Add a shared flag registry (`shared/flags.ts`) as the single source of truth for flag keys, types, and code defaults (mirrors `shared/constants.ts` pattern)
- Add a public `GET /api/flags` endpoint returning evaluated values for all registry keys (no session required; flags are environment-wide and non-sensitive; the login page needs them)
- Hydrate the SPA at boot: fetch `/api/flags` → `InMemoryProvider` (web SDK) → `<OpenFeatureProvider>` → typed flag hooks (`@openfeature/react-sdk`)

Accepted consequence (by design): UI flag changes appear on next page load, not live in open tabs. The server re-evaluates on every request, so API flag changes are immediate.

Out of scope: any actual feature rollout (e.g., accent color changes) — this change ships only the flag infrastructure plus the registry/flag files with initial safe (off) states. No visual surfaces change. Per-user targeting is explicitly not supported (no session-user evaluation context).

## Capabilities

### New Capabilities
- `feature-flags`: Flag evaluation on the server (OpenFeature + provider per environment), flag definition files in git with per-environment values, `/api/flags` delivery endpoint, and client-side flag hydration for UI features.

### Modified Capabilities
<!-- none — existing capabilities are untouched -->

## Impact

- **Dependencies**: `@openfeature/server-sdk`, `@openfeature/flagd-provider`, `@openfeature/react-sdk`, `@openfeature/web-sdk` (all runtime deps; verified current versions: 1.23.0 / 0.16.1 / 1.4.1 / 0.7.4)
- **Server**: new `server/flags.ts` (provider init + swap logic); `/api/flags` route in `server/app.ts`
- **Shared**: new `shared/flags.ts` registry
- **Client**: `src/main.tsx`/`src/App.tsx` (async hydration before render), typed flag hooks
- **Deployment**: `compose.yaml` + `compose.preprod.yaml` gain a `flagd` service, `flags` bind mount, `FLAGD_HOST` env; no DB schema changes; no Caddy changes (flagd stays internal — not exposed publicly)
- **Failure contract**: if flagd is unreachable or a flag is unknown, evaluation falls back to code defaults from `shared/flags.ts`; the app behaves as if the feature does not exist. `/api/flags` still returns 200 with defaults

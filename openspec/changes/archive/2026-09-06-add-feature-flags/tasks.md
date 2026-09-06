# Tasks: add-feature-flags

## 1. Dependencies and shared registry

- [x] 1.1 Add runtime deps: `@openfeature/server-sdk`, `@openfeature/flagd-provider`, `@openfeature/react-sdk`, `@openfeature/web-sdk`
- [x] 1.2 Create `shared/flags.ts` registry: flag keys, value types, and code defaults (initial flags safe/off, e.g. one boolean demo flag for verification)
- [x] 1.3 Create `flags/flags.dev.json`, `flags/flags.preprod.json`, `flags/flags.prod.json` in flagd format; every flag's `defaultVariant` mirrors the registry default; all initial values = off

## 2. Server: provider init and evaluation

- [x] 2.1 Create `server/flags.ts`: provider selection (`FLAGD_HOST` set → flagd rpc resolver, unset → flagd in-process resolver with `offlineFlagSourcePath: flags/flags.dev.json`) and OpenFeature init
- [x] 2.2 Dev live reload via the in-process resolver's native file sync (no custom watcher code)
- [x] 2.3 Wire provider init into server startup without blocking boot on flagd readiness; verify evaluations fall back to registry defaults when flagd is down

## 3. Server: `/api/flags` endpoint

- [x] 3.1 Add unauthenticated `GET /api/flags` in `server/app.ts` returning `{ [flagKey]: value }` for all registry keys using fresh evaluation per request
- [x] 3.2 Add OpenAPI swagger-jsdoc documentation for the endpoint (public, no session required, values reload on file change)

## 4. Client: hydration and typed consumption

- [x] 4.1 Fetch `/api/flags` at boot before first render; seed `InMemoryProvider` (web SDK) and wrap the React tree in `OpenFeatureProvider`
- [x] 4.2 Add typed flag hooks/wrappers over `@openfeature/react-sdk` using registry keys and defaults (single import point for UI code)

## 5. Deployment: flagd sidecars

- [x] 5.1 Add `flagd` service to `compose.yaml` (file-sync `--uri file:/etc/flagd/flags.json`, mount `./flags/flags.prod.json`, healthcheck) and set `FLAGD_HOST=flagd` on the app service
- [x] 5.2 Add the same to `compose.preprod.yaml` mounting `flags/flags.preprod.json` (independent values)
- [x] 5.3 Confirm flagd is not exposed on any published port (internal compose networks only)

## 6. Verification

- [x] 6.1 `pnpm typecheck` and `pnpm build` pass
- [x] 6.2 Dev: `pnpm dev` with no flagd running — `/api/flags` returns registry defaults; edit `flags/flags.dev.json` (flip demo flag) and confirm new value without restarting; SPA renders the flagged behavior per flag state (light + dark themes, en + fr)
- [x] 6.3 Dev: set `FLAGD_HOST=localhost` + `docker run` flagd on `flags/flags.dev.json` — confirm provider swap works with the same file, then revert
- [x] 6.4 Container smoke test: run prod compose against a scratch data dir — flagd healthy, `git pull`-style file change (replace-on-rename) on the mounted file is picked up without restart
- [x] 6.5 Failure drill: stop flagd container — `/api/flags` still 200s with defaults, app boots, features off; restart flagd — values live again
- [x] 6.6 Preprod: deploy, flip a flag in `flags.preprod.json`, `git pull` — preprod reflects it while production (on its own file) does not
- [x] 6.7 Bump `version` in `package.json` (minor: new capability, new route)

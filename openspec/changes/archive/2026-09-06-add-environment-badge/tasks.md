# Tasks: add-environment-badge

## 1. Server: environment identity

- [x] 1.1 Add `APP_ENV` handling in `server/app.ts` (or a small `server/env.ts`): valid values `dev`/`staging`/`production`, default `dev`, exposed via a getter
- [x] 1.2 Add public `GET /api/environment` returning `{ environment }`, with OpenAPI docs (no auth, no session)
- [x] 1.3 Pin `APP_ENV: production` in `compose.yaml` and `APP_ENV: staging` in `compose.preprod.yaml`; document `APP_ENV` in `.env.example`

## 2. Client: badge

- [x] 2.1 Fetch `/api/environment` once at boot (alongside the flags fetch) and expose it to the app (context or prop; reuse the hydration pattern from main.tsx)
- [x] 2.2 Create the environment badge component (footer-furniture style; render nothing when environment is `production`; raw-value label for unknown values)
- [x] 2.3 Mount the badge in the `Home` footer, replacing the demo flag icon
- [x] 2.4 Add badge label strings to `src/locales/en.ts` and `src/locales/fr.ts`

## 3. Demo flag cleanup

- [x] 3.1 Remove `ui-demo-badge` from `shared/flags.ts` and the `useFlag` demo usage in `src/pages/home.tsx`
- [x] 3.2 Remove the flag entry from `flags/flags.dev.json`, `flags/flags.preprod.json`, `flags/flags.prod.json` (leave empty `flags` objects)

## 4. Verification

- [x] 4.1 `pnpm typecheck` and `pnpm build` pass
- [x] 4.2 Dev (`APP_ENV` unset): built server on scratch data — `/api/environment` returns `{"environment":"dev"}`; badge «dev» visible in footer; screenshot light + dark, en + fr
- [x] 4.3 `APP_ENV=production` run: badge absent; screenshot
- [x] 4.4 `APP_ENV=staging` run: badge «staging»; fr locale shows French label; screenshot
- [x] 4.5 Compose config check: `docker compose config` shows `APP_ENV=production` (prod) and `APP_ENV=staging` (preprod merge)
- [x] 4.6 Confirm flag files parse and `/api/flags` returns `{}` after demo-flag removal; flag pipeline still functional (flip a test flag if any exist, else defer to next real feature)
- [x] 4.7 Bump `version` in `package.json` (minor: new capability, new route)

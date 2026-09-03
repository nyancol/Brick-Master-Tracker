## 1. Spike: Pocket ID groups claim

- [x] 1.1 Verify the Pocket ID instance emits a `groups` claim (request the `groups` scope with a test account; confirm exact group name spelling for « Les Chevaliers de l'Amitié » and « Les Visiteurs », accents included) and document whether the OIDC client needs the scope enabled/allowed provider-side

## 2. Server: role storage and derivation

- [x] 2.1 Add `role` column migration to `server/db.ts` (`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'knight' CHECK (role IN ('knight','visitor'))`) — existing DBs backfill as knight automatically via default
- [x] 2.2 Add `OIDC_GROUP_KNIGHTS` / `OIDC_GROUP_VISITORS` env reading with defaults (« Les Chevaliers de l'Amitié » / « Les Visiteurs ») and document both in `.env.example`
- [x] 2.3 Extend OIDC scope to include `groups` in `generateAuthUrl` (`server/auth.ts`) and pass the ID token's `groups` claim (array of strings, tolerate absent) through `handleCallback` into `upsertUser`
- [x] 2.4 Implement role derivation in `upsertUser`: knights group → `knight`; visitors group or no recognized group → `visitor` (knight wins on both); log a server-side warning with user identity and raw groups when the claim is missing/unrecognized; persist role on insert and update
- [x] 2.5 Update shared types (`shared/types.ts`): `User` gains `role: 'knight' | 'visitor'`; `SessionUser` unchanged

## 3. Server: participation enforcement and payloads

- [x] 3.1 `POST /bricks/:color/transfer` (`server/app.ts`): add guard — session user's role must be `knight` → 403 "Only knights can transfer this brick" (placed before the holder check); add recipient validation — recipient `role` must be `knight` → 400 with a "not a participant" message (alongside existing "Invalid recipient" / self-transfer checks)
- [x] 3.2 `GET /api/auth/me` (`getAuthMe`): include `role` in the `user` object and every `users[]` entry
- [x] 3.3 Dev users: extend `DEV_TEST_USERS` to carry roles (yann/anselme/thomas → knight, new `salma` → visitor), route dev seeding/upsert through the same role-persisting path, and include `role` in `GET /api/auth/dev` users payload

## 4. Frontend: visitor experience and ledger

- [x] 4.1 Add en + fr locale strings: role labels (Knight/Chevalier, Visitor/Visiteur), visitor banner copy, transfer-rejected/recipient-not-knight error strings, ledger flavor line unchanged (verify existing keys still render with fewer rows)
- [x] 4.2 Header badge: display localized role next to the display name (both themes)
- [x] 4.3 Visitor banner on home when `user.role === 'visitor'` (« Les Visiteurs regardent, les Chevaliers portent la brique. » equivalent in en/fr)
- [x] 4.4 Transfer modal recipient picker: list knights only (filter `users` by `role === 'knight'`, excluding current holder as today)
- [x] 4.5 Ledger membership in `buildLedgerRows` (`src/pages/home.tsx`): include a user if they have tenure in the brick's derived tenure map OR `role === 'knight'`; zero-tenure knights keep "0d" flavor rows; visitors without tenure excluded; demoted current holder's row keeps live ticking
- [x] 4.6 Dev login picker (`src/pages/login.tsx`): render salma with a localized role badge on each test-user button

## 5. Verification

- [x] 5.1 API verification on isolated test server (`PORT=3199` + `/tmp/opencode` data paths, stale-server check via `fuser -k 3199/tcp`): dev-login as salma → `GET /api/auth/me` returns `role: 'visitor'`; transfer attempt as salma → 403; as knight holder → transfer to salma → 400; transfer to knight → succeeds
- [x] 5.2 Playwright-core harness (scratch install under `/tmp/opencode`): login as each dev user; verify visitor sees banner + no transfer affordances, knights see no banner; recipient picker shows knights only; ledger excludes zero-tenure salma but shows zero-tenure knights with "0d"
- [x] 5.3 Verification matrix on new visible elements (banner, badges, picker): light + dark themes × en + fr locales × normal motion + `prefers-reduced-motion`, with before/after full-page screenshots (`networkidle` + landmark `waitForSelector`) eyeballed via Read
- [x] 5.4 Tenure history fixture check: craft SQLite fixture (UTC ms epochs, `dev:*` subs) with a former-knight tenure, demote to visitor → ledger still lists their historical tenure; include a same-timestamp tie row to confirm ordering is stable
- [x] 5.5 Run `npm run typecheck` and `npm run build`; confirm no regressions in existing flows (transfer, story edit, images)

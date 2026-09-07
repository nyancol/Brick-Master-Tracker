# Tasks — Fix Review Findings

## 1. Server: upload filename and directory

- [x] 1.1 Fix multer `filename` callback in `server/app.ts` to use the file argument's MIME type (`MIME_TO_EXT[file.mimetype]`) instead of `_req.file?.mimetype`, so stored files are `<uuid>.<ext>`
- [x] 1.2 Change the uploads dir default in `server/app.ts` to `resolve(IMAGE_PATH ?? join(DATA_PATH ?? "/app/data", "uploads"))` and create it recursively
- [x] 1.3 Verify `GET /api/uploads/:filename` still serves legacy extensionless files (Content-Type from DB `mime_type`) — no code change expected, just confirm the lookup path

## 2. Server: secure session cookie

- [x] 2.1 In `server/app.ts` session config, set `cookie.secure` from `process.env.APP_URL?.startsWith("https") === true` (keep httpOnly, sameSite, maxAge unchanged)

## 3. Config and deployment files

- [x] 3.1 `compose.yaml`: `IMAGE_PATH: /app/data/uploads`
- [x] 3.2 `.env.example`: update `IMAGE_PATH` comments to the canonical `$DATA_PATH/uploads` resolution and note the Secure-cookie behavior tied to `APP_URL` protocol
- [x] 3.3 Move dev data: `brick-tracker-data/upload/*` → `brick-tracker-data/uploads/`, remove the emptied legacy dir; document the prod/preprod one-time move (`docker compose exec brick-tracker sh -c 'mkdir -p /app/data/uploads && mv /app/data/upload/. /app/data/uploads/'`) in the change notes or README deployment section

## 4. Client: actor-based permissions

- [x] 4.1 In `src/components/ChroniclesView.tsx`, change the ownership check to `transfer.transferredById === currentUser.id` and rename `isSender` → `isActor` throughout the file (props and locals)
- [x] 4.2 Confirm all four affected flows use the actor check: story edit, image upload to existing transfer, image delete, and (server-side already correct) `PUT /transfers/:id/story`, `POST /transfers/:id/images`, `DELETE /transfers/:id/images/:imageId`

## 5. Shared types dedup

- [x] 5.1 Move client-only API types into `shared/types.ts` (`BrickColor`, `StagingImage`, `AuthUser`, `UserEntry`, `AuthMeResponse`, `DevUserEntry`, `DevLoginInfo`, `TransferResult`) and fix `BrickState.holderId` to `number | null`
- [x] 5.2 Replace the duplicated declarations in `src/api.ts` with re-exports from `../shared/types`
- [x] 5.3 `pnpm typecheck` clean (server imports of `shared/types.js` unaffected)

## 6. i18n key typing

- [x] 6.1 In `src/hooks/use-translation.ts`, derive `TKey` as a recursive nested-key (dot-path) type from `typeof en` and type `t(key: TKey): string`
- [x] 6.2 Type `src/locales/fr.ts` against a widened structural mirror of the `en` shape so missing/extra French keys fail typecheck
- [x] 6.3 Dynamic key site (`t(`marginalia.age.${bucket}`)`) is type-safe: the closed `GlossAge` union distributes into `TKey` via template-literal types, so no const map is needed (design note updated to match)
- [x] 6.4 Fix any call sites that no longer typecheck; `pnpm typecheck` clean

## 7. Swagger version + docs cleanup

- [x] 7.1 In `server/app.ts`, set Swagger `info.version` from `package.json` (JSON import; fallback to a `shared/` constant if Vite dev SSR chokes — verify by booting `pnpm dev` and checking `/api/api-docs.json`)
- [x] 7.2 Delete the empty `shared/constants.ts`
- [x] 7.3 README: remove route mentions (the "17 total" mermaid label and any route inventories), keeping only the `/api/api-docs` pointer; remove the `shared/constants.ts` FRIENDS claim and tree entry
- [x] 7.4 README: correct the directory tree (add `server/auth.ts`, `server/flags.ts`, `server/env.ts`, request/session declaration files, and the `dist/logger.js` + `dist/telemetry.mjs` chunk story in the build section)

## 8. Verification

- [x] 8.1 `pnpm typecheck` and `pnpm build` clean
- [x] 8.2 Isolated smoke server (PORT=3199, DATA_PATH/DB_PATH/IMAGE_PATH under /tmp/opencode): `fuser -k 3199/tcp` first; log in as dev user `yann`
- [x] 8.3 Upload an image via staging endpoint: assert the stored file has the MIME-derived extension (e.g. `staging` upload returns `filename` ending `.png`/`.jpg`) and `GET /api/uploads/:filename` serves it; also plant an extensionless legacy file + DB row and confirm it still serves with correct Content-Type
- [x] 8.4 Secure cookie: with `APP_URL=https://example.com` assert the `connect.sid` Set-Cookie header includes `Secure`; with no/`http://` `APP_URL` assert it does not and dev login still works
- [x] 8.5 Actor permissions (playwright-core harness, dev-login): as `thomas`, seize the blue brick from `yann`; sign in as `thomas` and confirm the seizure's chronicle entry shows the story-edit feather and photo upload/delete controls (previously missing); sign in as `yann` (previous holder) and confirm the same entry shows none of those controls; server 403 spot-check via fetch as `yann` on `PUT` story
- [x] 8.6 UI matrix on the chronicle entry controls (the only touched surface): Day + Dungeon themes, en + fr locales, screenshots eyeballed via Read; reduced-motion spot check — all other visual surfaces must appear pixel-identical to before
- [x] 8.7 `/api/api-docs.json` reports version matching `package.json` (0.3.0+); README renders with no stale route references; `grep -r "shared/constants"` and `grep -ri "FRIENDS"` return nothing

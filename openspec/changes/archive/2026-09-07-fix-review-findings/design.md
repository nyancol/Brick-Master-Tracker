# Design — Fix Review Findings

## Context

The review found four defect classes spanning server, client, config, and docs:

1. `server/app.ts` multer `filename` callback reads `_req.file?.mimetype` — but multer only populates `req.file` *after* the callback chain completes, so every stored file is a bare `<uuid>` with no extension. The spec (`transfer-images`) already mandates `<uuid>.<ext>`.
2. Upload directories disagree: app default `IMAGE_PATH ?? "/app/data/upload"` (singular) and `compose.yaml: IMAGE_PATH=/app/data/upload`, vs `.env` dev `./brick-tracker-data/uploads` (plural). Both `brick-tracker-data/upload/` and `uploads/` exist locally; the spec says `$DATA_PATH/uploads`.
3. `src/components/ChroniclesView.tsx` computes `isSender = transfer.fromId === currentUser.id`, but the server authorizes on `transferred_by_id` (`PUT /transfers/:id/story`, image upload/delete routes). For blue-brick seizures, `from_id` is the *previous* holder and `transferred_by_id` is the seizing knight — so the seizer never sees the edit/upload/delete controls for their own transfer. The `transfer-story` and `transfer-images` specs also say `fromId`, so the specs are wrong the same way the UI is.
4. Session cookie config is hardcoded `secure: false` (`server/app.ts`), even for the HTTPS preprod deployment (`APP_URL=https://brique-dev.patates.club`) behind Caddy.
5. Docs/types drift: README claims a `FRIENDS` array in an empty `shared/constants.ts` and an outdated directory tree; route mentions ("17 total") duplicate the Swagger UI; API types are duplicated between `shared/types.ts` and `src/api.ts` (with a divergence: `BrickState.holderId` is `number` in shared but `number | null` in reality); `use-translation.ts` carries a hand-written `TKey` union that has already drifted from `src/locales/en.ts`; Swagger `info.version` is hardcoded `0.0.1` vs `package.json` `0.3.0`.

Constraints: no test framework exists (typecheck + manual smoke per README); `pnpm typecheck && pnpm build` is the quality gate; i18n strings must exist in both `en` and `fr`; no DB schema changes wanted.

## Goals / Non-Goals

**Goals:**

- Stored image files are `<uuid>.<ext>` again; serving of legacy extensionless files keeps working (DB `mime_type` drives `Content-Type`).
- One canonical uploads directory, agreed by app default, compose, `.env.example`, and spec.
- The seizing knight (and any transfer's actor) sees the edit/upload/delete controls for their own transfer; specs and server already agree.
- Session cookies carry `Secure` on HTTPS deployments; plain-HTTP deployments keep working.
- README, shared types, i18n key type, and Swagger version stop lying.

**Non-Goals:**

- No visual redesign: themes, kitsch chrome, layout, and animations are untouched; the only UI change is permission-driven visibility of controls that already exist.
- No API contract, DB schema, or status-code changes.
- No rate limiting, `imageIds` validation errors, Dockerfile slimming, or OIDC state persistence (other review findings, separate change).

## Decisions

### D1 — Filename extension from `file.mimetype` (the multer callback argument)

`filename: (_req, file, cb) => cb(null, `${uuidv4()}${MIME_TO_EXT[file.mimetype] ?? ""}`)`.

- *Why not derive the extension from the user's original filename?* Untrusted input; can disagree with the actual bytes; MIME is already validated by `fileFilter` against `MIME_TO_EXT`.
- *Why keep the existing `MIME_TO_EXT` map?* It doubles as the allowlist contract with `fileFilter`; unknown MIME → empty extension cannot happen for accepted uploads, and legacy extensionless names still resolve.

### D2 — Canonical uploads directory: `IMAGE_PATH` override, else `$DATA_PATH/uploads`

App default becomes `resolve(process.env.IMAGE_PATH ?? join(process.env.DATA_PATH ?? "/app/data", "uploads"))`. `compose.yaml` pins `IMAGE_PATH: /app/data/uploads`; `.env.example` documents the same.

- *Why keep `IMAGE_PATH` at all?* It is a documented env var (`compose.yaml`, `.env.example`, project context test conventions) and the UX-testing harness sets it; removing it would break the documented workflow for zero gain.
- *Why `uploads` (plural) not `upload`?* The spec's storage requirement says `$DATA_PATH/uploads`, the dev `.env` already uses it, and it is the conventional name. Singular is the minority spelling introduced by the app default only.
- *Why not a runtime dual-lookup fallback to the legacy dir?* It adds a permanent second code path for a one-time inconvenience; the file move (D6) is cheap and local to the bind-mounted data dir.

### D3 — Actor-based permission in the UI; server unchanged

`ChroniclesView`: `const isSender = transfer.transferredById === currentUser.id;` (rename the variable to `isActor` for clarity at the same time). The server already enforces actor semantics on all four affected routes, so the fix is client-side only plus spec wording.

- *Why not loosen the server to also accept `fromId`?* For seizures the previous holder did not perform the transfer; actor semantics is the correct invariant and is what the server has always enforced. Changing the server would widen permissions to fix a display bug.

### D4 — Secure cookie derived from `APP_URL` protocol, with `trust proxy`

`cookie.secure = process.env.APP_URL?.startsWith("https") === true`, plus `app.set("trust proxy", 1)`.

- *Implementation finding:* express-session does not merely mark the cookie Secure when `secure: true` — it **refuses to set the cookie at all** on connections it perceives as insecure. Behind Caddy, node sees plain HTTP, so the header must flow through: `trust proxy` (1 hop, matching the documented Caddy → container topology) makes `req.secure` honor Caddy's `X-Forwarded-Proto`, and the cookie is set (with Secure) for https clients while direct plain-HTTP clients are correctly refused when `APP_URL` is https.
- *Why not `NODE_ENV=production`?* Production can legitimately run plain-HTTP on a trusted LAN; tying Secure to NODE_ENV would break those logins.
- *Why not `trust proxy` + `req.protocol` as the signal itself?* It requires per-deployment proxy knowledge to *derive intent*; `APP_URL` is already the authoritative public-URL signal (it drives OIDC redirect URIs), so one variable stays the source of truth — trust proxy is only the plumbing that lets express-session see the client's protocol.
- *Why unconditional `trust proxy: 1`?* Direct (unproxied) dev requests carry no `X-Forwarded-Proto`, so behavior is unchanged; a spoofed header on a directly-exposed port only affects the attacker's own cookie attributes and the pre-existing callback-URL construction. Documented deployments have exactly one proxy hop.
- Existing sessions are unaffected: the attribute only applies to cookies set after deploy; `maxAge`/`httpOnly`/`sameSite` are unchanged.

### D5 — Types and i18n keyed off their true sources

- `shared/types.ts` becomes the single source of all API payload types (`User`, `SessionUser`, `BrickState`, `Transfer`, `TransferStory`, `TransferImage`, `TransferComment`, plus the client-only ones moved in: `StagingImage`, `AuthUser`, `UserEntry`, `AuthMeResponse`, `DevUserEntry`, `DevLoginInfo`, `TransferResult`, `BrickColor`, `UserRole`). `src/api.ts` re-exports them (`export type { ... } from "../shared/types"`) instead of redeclaring. While moving, fix `BrickState.holderId` to `number | null` (matches the API: a brick can be unheld).
  - *Why not the other direction (shared imports from src)?* `server/auth.ts` already imports `shared/types.js`; server must not import client code. `shared/` is the existing both-worlds layer.
- `use-translation.ts`: replace the hand-written `TKey` union with a recursive nested-key type derived from `typeof en` (dot paths), and give `fr` a widened structural type derived from `en` so missing/extra keys in French fail `pnpm typecheck`. `t()` becomes `t(key: TKey): string`; `getNested` stays as the runtime fallback for unmapped keys.
  - *Known sharp edge:* one call site builds keys dynamically (`t(`marginalia.age.${bucket}`)`). With `GlossAge` a closed union, TypeScript distributes the template literal type (`marginalia.age.now` | `marginalia.age.today` | …) directly into `TKey`, so the call site is type-safe as-is — no const map or `as any` escape needed (verified during implementation; the originally planned const map proved redundant).
- Swagger version: `import pkg from "../package.json"` and use `pkg.version` in the `info` block. `resolveJsonModule` is already on; esbuild inlines the JSON into `dist/server.mjs` (relative file, unaffected by `packages: "external"`), and Vite dev SSR resolves JSON natively. If dev SSR proves problematic, the fallback is exporting `APP_VERSION` from `shared/constants.ts` — decided during implementation, verified by starting the dev server.

### D6 — Docs and deployment hygiene

- README: strip route mentions (the "17 total" mermaid labels and any route lists), keep only the `/api/api-docs` pointer; correct the directory tree (add `server/auth.ts`, `flags.ts`, `env.ts`, `express-request.d.ts`, `session.d.ts`, the `dist/logger.js` + `dist/telemetry.mjs` chunk story); delete the `shared/constants.ts` FRIENDS claim; drop the `shared/constants.ts` tree entry.
- Delete the empty `shared/constants.ts`.
- One-time file moves: dev `brick-tracker-data/upload/*` → `brick-tracker-data/uploads/` (both exist locally; `uploads/` is where `.env` points, so the move consolidates onto it). Prod: `docker compose exec brick-tracker mv /app/data/upload/. /app/data/uploads/` style step (or host-side in the bind mount) documented in the tasks. Legacy files keep their extensionless names — serving is unaffected (D1).

## Risks / Trade-offs

- [Dir rename orphans prod-uploaded images] → Mitigation: explicit move step in tasks (prod volume + dev bind mount); GET serving verified against moved files; legacy extensionless filenames are untouched so DB rows stay valid.
- [`Secure` cookie breaks a plain-HTTP deployment if someone sets `APP_URL` to https while serving http] → Mitigation: derivation mirrors the OIDC redirect logic which would equally be broken by that misconfiguration; documented in `.env.example` comments.
- [Strict `TKey` surfaces latent type errors in call sites] → Mitigation: that is the point of the change; tasks include a typecheck-first pass and the one dynamic-key site gets a typed const map. `getNested` keeps returning the key itself as a last-resort fallback so nothing renders blank.
- [JSON import of `package.json` misbehaves under Vite dev SSR] → Mitigation: verify `pnpm dev` boots and `/api/api-docs.json` shows the right version; documented fallback to a constant in `shared/`.
- [Type dedup ripples into server code] → Mitigation: `pnpm typecheck` gates everything; server already imports `shared/types.js` so the direction of truth matches existing imports.
- [README edits rot again] → Mitigation: README deliberately keeps fewer facts (no route inventory, no file-by-file claims beyond the tree), pointing at Swagger UI for the API.

## Migration Plan

1. Ship code + config + docs in one release; no DB migration; sessions stay valid.
2. On each deployment (dev bind mount, preprod volume, prod volume): move `upload/*` into `uploads/` once, before/with the new image.
3. Rollback: revert the release. Old code points at `IMAGE_PATH` as configured — set `IMAGE_PATH` back to the legacy dir (or move files back) if a rollback is ever needed; both dirs remain present.

## Open Questions

- None blocking. The only in-implementation choice is D5's Swagger-version mechanism (package.json import vs shared constant), with a decision rule stated.

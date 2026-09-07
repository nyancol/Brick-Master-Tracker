# Fix Review Findings

## Why

A code review surfaced four classes of defects that are already user-visible or will bite in production: uploaded images lose their filename extension (multer callback reads the wrong variable) and two conflicting upload directories exist (`upload` vs `uploads`); the seizer of the blue brick can never see the edit/upload controls for their own transfer because the UI checks the wrong identity field; session cookies are never marked `Secure`, so sessions ride along on plain-HTTP requests even behind the HTTPS reverse proxy; and the README, shared types, i18n key type, and Swagger version have drifted from reality, actively misleading contributors.

## What Changes

- **Upload filename fix**: multer's `filename` callback must derive the extension from the uploaded file's MIME type (second callback argument), not from `req.file` (which is unset at that point). Stored files become `<uuid>.<ext>` again; existing extensionless files remain servable (serving uses the DB `mime_type`).
- **Upload directory standardization**: consolidate on `$DATA_PATH/uploads` (singular `upload` variants removed). Compose, `.env.example`, and app default all agree. Existing files are moved into the canonical directory as a deployment step.
- **Actor permission alignment (UI + specs)**: the chronicles UI must gate story editing and image add/delete on `transferredById` (the transfer's actor) instead of `fromId` — matching what the server already enforces. The `transfer-story` and `transfer-images` specs are corrected: "sender" means the transfer's actor (`transferredById`), which differs from `fromId` for blue-brick seizures.
- **Secure session cookies**: the session cookie SHALL be marked `Secure` when the app is served over HTTPS (derived from `APP_URL` protocol), so cookies are never sent over plain HTTP.
- **Docs and type hygiene**:
  - README: remove route references ("17 total" mermaid labels etc.), keep the `/api/api-docs` pointer; correct the directory structure (add `auth.ts`, `flags.ts`, `env.ts`, telemetry chunk); remove the stale `shared/constants.ts` "FRIENDS" claim.
  - Delete the empty `shared/constants.ts`.
  - Make `shared/types.ts` the single source of API types; `src/api.ts` re-exports instead of duplicating.
  - Derive the translation key type from the `en` locale (eliminating the drifted hand-written `TKey` union) and add a `fr` parity check.
  - Sync the Swagger `info.version` with `package.json`.

Out of scope (not changed by this proposal): no visual redesign — themes, kitsch chrome, layout, and all existing surfaces keep their current look; the only UI change is permission-driven visibility of already-existing edit/upload/delete controls. Also out of scope: rate limiting, `imageIds` validation errors, Dockerfile slimming, OIDC state persistence (separate review findings).

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `transfer-images`: the sender-permission requirements are restated in terms of the transfer's actor (`transferredById`) rather than `fromId`; the file-storage requirement pins the canonical upload directory (`$DATA_PATH/uploads`) and extension-from-MIME behavior, and clarifies that legacy extensionless files remain servable.
- `transfer-story`: the story-editing permission requirement is restated in terms of the transfer's actor (`transferredById`) rather than `fromId`.
- `oidc-authentication`: the session-management requirement adds the `Secure` cookie attribute when the app is served over HTTPS.

## Impact

- **Code**: `server/app.ts` (multer filename callback, upload dir default, session cookie config), `src/components/ChroniclesView.tsx` (`isSender` derivation), `src/api.ts` + `shared/types.ts` (type dedup), `src/hooks/use-translation.ts` + `src/locales/` (key typing), Swagger info block in `server/app.ts`.
- **Config/deploy**: `compose.yaml`, `.env.example`, `README.md`; one-time move of existing uploaded files into the canonical directory (dev bind mount and prod volume).
- **Specs**: delta specs for `transfer-images`, `transfer-story`, `oidc-authentication`.
- **No API contract changes**: endpoints, payloads, and status codes are unchanged. No DB schema changes. Existing sessions remain valid.

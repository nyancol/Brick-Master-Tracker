## Why

The app currently has no authentication — anyone with the URL can transfer bricks between the three hardcoded friends. There's no way to know who performed a transfer, no access control, and the friend list is static. The three participants (Yann, Anselme, Thomas) should be able to log in via their own OIDC identities so the app knows who they are and can enforce that only the current brick holder initiates a transfer.

## What Changes

- Add generic OIDC authentication with login/logout flows (targeting Pocket ID)
- Replace the hardcoded `FRIENDS` array with a dynamic users table populated from OIDC logins
- **BREAKING**: `brick_state.holder` changes from a plain text name to a foreign key referencing `users.id`
- **BREAKING**: `transfer_history.from_holder` and `to_holder` change to `from_id` and `to_id` foreign keys
- Add `transferred_by` column to `transfer_history` for attribution tracking
- Gate `POST /bricks/:color/transfer` behind authentication — only the current holder can transfer (403 otherwise)
- Gate the entire app behind login — unauthenticated users see a login screen
- Add `/api/auth/*` endpoints (login, callback, logout, me)
- Add express-session with SQLite session store
- Seed brick owners via `OIDC_OWNER_RED` and `OIDC_OWNER_BLUE` env vars (OIDC subject → initial brick holder)
- Any authenticated user can receive a brick transfer

## Capabilities

### New Capabilities
- `oidc-authentication`: OIDC login/logout flows, session management, user identity storage, and the `/api/auth/*` endpoints. Covers bootstrapping initial users and seeding brick ownership.
- `authorized-transfers`: Auth-gated brick transfers — only the current holder can transfer, transfer attribution tracked via `transferred_by`, any authenticated user is a valid recipient.

### Modified Capabilities
<!-- none -->

## Impact

- **Dependencies**: `express-session`, `better-sqlite3-session-store`, `openid-client`
- **Database**: Add `users`, `sessions` tables. Migrate `brick_state.holder` (text) → `holder_id` (FK), `transfer_history.from_holder/to_holder` → `from_id/to_id` (FK). Add `transfer_history.transferred_by_id` (FK).
- **API**: New `/api/auth/*` routes. Existing `/api/bricks/:color/transfer` now requires session and enforces holder authorization. `/api/bricks` and `/api/transfers` return user IDs instead of names.
- **Client**: New login screen and user indicator. Transfer buttons only shown to the brick holder. Transfer targets become dynamic (all users minus self).
- **Config**: New env vars: `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_REDIRECT_URL`, `OIDC_OWNER_RED`, `OIDC_OWNER_BLUE`, `SESSION_SECRET`
- **Shared**: Remove `FRIENDS` and `Friend` type from `shared/constants.ts`
## Why

Currently the app only stores and displays the OIDC `name` claim as the user's `displayName` everywhere. The OIDC provider (Pocket ID) exposes a username (`preferred_username`) that is more suitable as a stable, unique handle for identifying users throughout the app. However, the user-friendly first/last name from the `name` claim should still be shown in the header to convey who is logged in.

## What Changes

- **New `username` DB column**: Store the OIDC `preferred_username` claim in a new `users.username` column alongside the existing `display_name`.
- **Frontend display split**: Use `username` in most places (brick holder names, transfer history, recipient buttons, transfer modal). Keep `displayName` only in the top-right header badge.
- **API response changes**: Return both `username` and `displayName` from `/api/auth/me`; update brick/transfer queries to include `username`.
- **OIDC claim extraction**: Extract `preferred_username` from ID token claims and pass it to `upsertUser` as the new `username` field.
- **Shared types**: Add `username` to `User`, `AuthUser`, and `UserEntry` types.

## Capabilities

### New Capabilities
- `user-identity`: Handle OIDC username as a separate identity field, distinct from the display name, and control where each is shown in the UI.

### Modified Capabilities
- *(None — no existing capabilities are being changed at the spec level)*

## Impact

- **Database**: Migration to add `username TEXT NOT NULL` column to `users` table (nullable with backfill for existing users).
- **Server**: `auth.ts` extracts `preferred_username`; DB queries and API responses include `username`.
- **Frontend**: Multiple components switch from `displayName` to `username`; header badge keeps `displayName`; shared types gain `username`.
- **Dependencies**: None new.
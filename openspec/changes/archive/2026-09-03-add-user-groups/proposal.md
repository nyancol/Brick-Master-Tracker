## Why

The app currently treats every logged-in user as a full participant: anyone can appear in the recipient picker, receive a brick, and show up on the Ledger of Tenure. We want to distinguish two groups provided by the OIDC provider (Pocket ID): **Les Visiteurs** (visitors — can browse the site but cannot hold the brick and are not part of the leaderboard) and **Les Chevaliers de l'Amitié** (knights — full participants).

## What Changes

- Extract the OIDC `groups` claim at login (scope extended to request it) and derive a `role` (`knight` | `visitor`) persisted on `users` via a new column, refreshed on every login like other profile claims.
- Group names are configured via env (`OIDC_GROUP_KNIGHTS`, `OIDC_GROUP_VISITORS`) with defaults matching the two Pocket ID groups.
- **Strict participation block**: only knights may transfer a brick (as sender), and transfer recipients must be knights. If the current holder is demoted to visitor, the brick is frozen — nobody can transfer it until the holder's role is restored at the OIDC provider and they re-login. Tenure keeps ticking visibly in the meantime.
- The Ledger of Tenure shows history-based membership: a user appears if they have any tenure in the transfer history **or** are currently a knight. Visitors never appear (they can never hold); former knights keep their historical tenure visible.
- Transfer UI: recipient picker lists knights only; visitors see a friendly banner (« Les Visiteurs regardent, les Chevaliers portent ») and a role badge in the header.
- Dev test logins: add `salma` as visitor; yann, anselme, thomas become knights; the dev picker shows role badges.
- Migration backfills all existing users as `knight` (the current trio are participants by definition).
- Explicit non-goals: story/image editing rules stay sender-based (no role check — a demoted knight may still edit chronicles of transfers they sent while a knight); no session schema change; no other auth-flow rework.

## Capabilities

### New Capabilities
- `user-groups`: Derivation of user role (`knight` | `visitor`) from the OIDC groups claim, env-configurable group names, persistence on `users`, exposure of `role` via `/api/auth/me`, visitor banner, and header role badge.

### Modified Capabilities
- `authorized-transfers`: Only knights may initiate a transfer (strict block even when holder), and only knights may be recipients.
- `holder-tenure`: Ledger membership rule changes to history-based (tenure exists) OR current knight; visitors excluded.
- `dev-test-users`: New dev user `salma` (visitor); role assignment and role badges for the dev login picker.
- `oidc-authentication`: Request the `groups` claim/scope at login, pass groups into user upsert, and expose `role` in the `/api/auth/me` payload (self + users list).

## Impact

- **Server**: `server/auth.ts` (claim extraction, `upsertUser`, dev users), `server/db.ts` (`role` column + backfill), `server/app.ts` (transfer guards, `/api/auth/me` payload), `.env.example` (group env vars).
- **Shared types**: `shared/types.ts` (User/SessionUser `role`).
- **Frontend**: `src/pages/home.tsx` (ledger filter, banner, transfer button gating), transfer modal recipient picker, header badge, `src/pages/login.tsx` (dev picker), `src/locales` (en + fr strings).
- **OIDC provider (operational)**: groups must exist in Pocket ID and members assigned; `groups` scope requested by the app.
- **Known operational consequence**: a demoted current holder freezes the brick until the provider group is corrected and they re-login (role refreshes only at login).

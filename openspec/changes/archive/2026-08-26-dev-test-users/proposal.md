## Why

Local development currently requires a reachable OIDC provider to log in at all: without it, `/api/auth/login` returns 503 and the login page's only button is a dead end. This makes testing the multi-user transfer flow (holding, transferring, recipient pickers) awkward, since exercising it requires real provider accounts.

## What Changes

- Add a development-only test-user login mechanism that signs a user in via a direct session, bypassing the OIDC provider entirely.
- Seed the three canonical friends (Yann, Anselme, Thomas) as test users in development so they appear in recipient pickers and brick-holder labels.
- Add a `POST /api/auth/dev/login` endpoint that accepts a test user identifier, upserts that user, and establishes a session.
- Add a dev-only test-user picker on the login page that calls the endpoint, shown only when the server reports dev-login is available.
- Expose whether dev-login is enabled to the client (so the login page can decide whether to render the picker).
- Guard all dev-login behavior so it is disabled in production and opt-in/off via configuration.

## Capabilities

### New Capabilities

- `dev-test-users`: Development-only authentication that lets a developer sign in as seeded test users without contacting the OIDC provider.

### Modified Capabilities

<!-- None. The OIDC login flow itself is unchanged; dev login is purely additive and gated to development. -->

## Impact

- **Server**: `server/auth.ts` (dev user seeding/upsert + availability flag), `server/app.ts` (new `POST /api/auth/dev/login` route + surfaced availability).
- **Client**: `src/pages/login.tsx` (test-user picker), `src/api.ts` (dev login call + availability type).
- **Config/docs**: `.env.example`, `README.md` (document dev test-user workflow).
- No database schema changes; reuses the existing `users` table.

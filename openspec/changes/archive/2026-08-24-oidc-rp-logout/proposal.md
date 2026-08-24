## Why

Currently, logout only destroys the local Express session but leaves the OIDC provider session active. On the next visit, clicking "Sign in" immediately re-authenticates via the existing OIDC session without prompting the user to re-enter credentials, defeating the purpose of logging out.

## What Changes

- Store the OIDC `id_token` in the session during callback so it can be used as a logout hint
- On `GET /api/auth/logout`, after destroying the local session, redirect the user-agent to the OIDC provider's RP-Initiated Logout endpoint (`end_session_endpoint`) with the `id_token_hint`
- After the OIDC provider logs the user out, redirect back to the SPA root via `post_logout_redirect_uri`

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `oidc-authentication`: The "Logout destroys session" scenario (Requirement: Session management) needs to be updated to include RP-Initiated Logout at the OIDC provider

## Impact

- `server/auth.ts` — add `buildEndSessionUrl()` function using `client.buildEndSessionUrl()`; store `id_token` in callback result
- `server/session.d.ts` — add `idToken` field to SessionData type
- `server/app.ts` — store `id_token` in session on callback; change logout handler to redirect to OIDC end_session endpoint
- `.env.example` — no new env vars needed (post_logout_redirect_uri is derived from existing APP_URL/OIDC_REDIRECT_URL)
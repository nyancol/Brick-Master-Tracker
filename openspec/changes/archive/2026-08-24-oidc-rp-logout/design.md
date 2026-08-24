## Context

The app authenticates users via OIDC (Authorization Code flow with PKCE) using `openid-client`. Sessions are stored server-side in SQLite. Currently, `GET /api/auth/logout` destroys the local session but does not interact with the OIDC provider, leaving the provider's session active. On subsequent login, the OIDC provider immediately re-authenticates without prompting the user, which defeats the purpose of logging out.

The OIDC RP-Initiated Logout mechanism (OpenID Connect RP-Initiated Logout 1.0) provides a standard way to log the user out of both the RP (this app) and the OP (the OIDC provider) by redirecting to the provider's `end_session_endpoint` with the `id_token_hint`.

## Goals / Non-Goals

**Goals:**
- Provide a logout that terminates the session at the OIDC provider so the user must re-authenticate on next login
- Maintain the existing single-URL logout experience (`/api/auth/logout`)
- Preserve all security properties (httpOnly cookies, PKCE, state/nonce)

**Non-Goals:**
- Changing the login flow or callback behavior beyond storing the id_token
- Adding a client-side logout button change
- Supporting back-channel logout (this is OP-initiated; out of scope)
- Handling the case where the OIDC provider lacks an `end_session_endpoint`

## Decisions

1. **Store `id_token` in session**: The `id_token` is needed as the `id_token_hint` parameter for RP-Initiated Logout. Storing it in the session (alongside `user`) keeps it available for logout. The id_token is already available from `tokenSet.id_token` after the callback — it just isn't persisted. Alt: store in a separate table — unnecessary complexity for a single value.

2. **Use `client.buildEndSessionUrl()`**: The `openid-client` library provides `buildEndSessionUrl(config, { id_token_hint, post_logout_redirect_uri })` which handles the redirect URL construction. This is the standard library approach.

3. **`post_logout_redirect_uri` = app root (`/`)**: After the OIDC provider logs the user out, it should redirect back to the SPA. The app root is the natural landing page (same as current logout behavior). Derived from `APP_URL` env var.

4. **Fallback to local-only logout if id_token missing**: If the session has no `id_token` (e.g., pre-existing sessions created before this change), the logout should still destroy the local session and redirect to `/` without attempting RP-Initiated Logout.

5. **Cookie is not explicitly cleared**: express-session's `destroy()` removes the session from SQLite. The browser cookie remains but references a deleted session — subsequent requests will create a new anonymous session. This is the existing behavior and is sufficient.

## Risks / Trade-offs

- **OIDC provider may not support `end_session_endpoint`**: The `buildEndSessionUrl()` call will fail at runtime. Mitigation: wrap in try/catch and fall back to local-only logout.
- **Users with existing sessions (pre-migration) won't have `id_token` stored**: They'll get local-only logout. This is acceptable — it self-heals after their next login.
- **`post_logout_redirect_uri` must be registered at the OIDC provider**: The provider may reject unregistered URIs. This is a one-time configuration step. The admin needs to register the app root URL as a post-logout redirect URI in the OIDC provider's client settings.
- **Timing**: The `id_token` has a finite lifetime (typically 1 hour). Using an expired id_token as a hint is allowed per spec — the provider may still use it to identify the session, but behavior is provider-specific.
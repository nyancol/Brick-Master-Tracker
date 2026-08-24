## MODIFIED Requirements

### Requirement: Session management

The system SHALL manage user sessions using express-session backed by a SQLite session store with httpOnly cookies.

#### Scenario: Session created on login
- **WHEN** a user successfully authenticates via OIDC
- **THEN** the system SHALL create a session in the SQLite sessions table, store the OIDC id_token in the session alongside the user's id and email, and set an httpOnly, SameSite=Lax session cookie

#### Scenario: Session validated on authenticated endpoints
- **WHEN** a request includes a valid session cookie
- **THEN** the system SHALL populate `req.session.user` with the user's id and email retrieved from the session store

#### Scenario: Session rejected when invalid
- **WHEN** a request includes an expired or tampered session cookie
- **THEN** the system SHALL treat the request as unauthenticated (no `req.session.user`)

#### Scenario: Logout destroys session
- **WHEN** a user requests `GET /api/auth/logout` with a valid session
- **THEN** the system SHALL destroy the session in the SQLite store, and redirect to the OIDC provider's RP-Initiated Logout endpoint (`end_session_endpoint`) with the stored `id_token` as `id_token_hint` and the app root as `post_logout_redirect_uri`, so the OIDC provider also terminates its session and redirects back to the SPA root. If the session has no stored `id_token`, the system SHALL redirect directly to the SPA root after destroying the session.
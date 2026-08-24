# OIDC Authentication

## Purpose

Authenticate users via a generic OIDC provider (targeting Pocket ID) using the Authorization Code flow, manage sessions with express-session backed by SQLite, store user identities, and bootstrap initial brick ownership from environment variables.

## Requirements

### Requirement: OIDC login flow

The system SHALL authenticate users via a generic OIDC provider using the Authorization Code flow. The system SHALL redirect unauthenticated users to the OIDC provider's authorization endpoint and handle the callback to establish a session.

#### Scenario: User initiates login
- **WHEN** an unauthenticated user navigates to the app
- **THEN** the system SHALL display a login page with a "Sign in" button that redirects to `/api/auth/login`

#### Scenario: OIDC authorization redirect
- **WHEN** a user requests `GET /api/auth/login`
- **THEN** the system SHALL redirect the browser to the OIDC provider's authorization endpoint with the configured client_id, redirect_uri, response_type=code, scope=openid+profile+email, and a random state parameter

#### Scenario: OIDC callback with valid code
- **WHEN** the OIDC provider redirects back to `GET /api/auth/callback` with a valid authorization code and matching state parameter
- **THEN** the system SHALL exchange the code for tokens at the token endpoint, validate the ID token (issuer, audience, expiry, signature via JWKS), extract the user's sub, email, name, and picture claims, upsert the user in the database, create an express-session containing the user's id and email, and redirect the browser to the SPA root

#### Scenario: OIDC callback with invalid code
- **WHEN** the OIDC provider redirects back to `GET /api/auth/callback` with an invalid or expired authorization code
- **THEN** the system SHALL return a 401 status with an error message

#### Scenario: OIDC callback with mismatched state
- **WHEN** the OIDC provider redirects back to `GET /api/auth/callback` with a state parameter that does not match the stored state
- **THEN** the system SHALL return a 401 status with an error message

### Requirement: OIDC provider configuration

The system SHALL configure the OIDC relying party from environment variables, with support for discovery via the provider's `.well-known/openid-configuration` endpoint.

#### Scenario: Provider discovery succeeds
- **WHEN** the server starts and `OIDC_ISSUER` is set to a valid OIDC provider URL
- **THEN** the system SHALL fetch the provider's OpenID configuration from `{OIDC_ISSUER}/.well-known/openid-configuration` and use it for future auth requests

#### Scenario: Provider discovery fails
- **WHEN** the server starts and the OIDC provider's discovery endpoint is unreachable or returns invalid data
- **THEN** the system SHALL log an error and continue serving — auth endpoints will fail gracefully for users

#### Scenario: Missing required env vars
- **WHEN** the server starts and any required OIDC env var (OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_REDIRECT_URL, SESSION_SECRET) is not set
- **THEN** the system SHALL log a warning for each missing var and auth endpoints will not be functional

### Requirement: Session management

The system SHALL manage user sessions using express-session backed by a SQLite session store with httpOnly cookies.

#### Scenario: Session created on login
- **WHEN** a user successfully authenticates via OIDC
- **THEN** the system SHALL create a session in the SQLite sessions table and set an httpOnly, SameSite=Lax session cookie

#### Scenario: Session validated on authenticated endpoints
- **WHEN** a request includes a valid session cookie
- **THEN** the system SHALL populate `req.session.user` with the user's id and email retrieved from the session store

#### Scenario: Session rejected when invalid
- **WHEN** a request includes an expired or tampered session cookie
- **THEN** the system SHALL treat the request as unauthenticated (no `req.session.user`)

#### Scenario: Logout destroys session
- **WHEN** a user requests `GET /api/auth/logout` with a valid session
- **THEN** the system SHALL destroy the session in the SQLite store, clear the session cookie, and redirect to the SPA root

### Requirement: Current user endpoint

The system SHALL provide an endpoint to retrieve the current authenticated user's information and the full users list.

#### Scenario: Authenticated user requests /auth/me
- **WHEN** an authenticated user requests `GET /api/auth/me`
- **THEN** the system SHALL return a JSON object with `user` (id, email, displayName, avatarUrl) and `users` (array of all users with id and displayName)

#### Scenario: Unauthenticated user requests /auth/me
- **WHEN** an unauthenticated user requests `GET /api/auth/me`
- **THEN** the system SHALL return a 401 status

### Requirement: User identity storage

The system SHALL store OIDC user identities in a `users` table with their OIDC subject as the unique identity anchor.

#### Scenario: New user logs in first time
- **WHEN** a user completes OIDC login and their OIDC sub does not exist in the users table
- **THEN** the system SHALL create a new user row with their sub, email, display name (from OIDC name claim or email prefix), avatar URL, and current timestamp

#### Scenario: Returning user logs in
- **WHEN** a user completes OIDC login and their OIDC sub already exists in the users table
- **THEN** the system SHALL update their email, display name, and avatar URL with the latest OIDC claims without changing their internal user ID

### Requirement: Initial brick ownership bootstrap

The system SHALL assign initial brick ownership on first database creation based on environment variables mapping OIDC subjects to brick colors.

#### Scenario: Bootstrap with configured owners
- **WHEN** the database is freshly created (no users, no brick_state rows) and a user logs in whose OIDC sub matches OIDC_OWNER_RED
- **THEN** the system SHALL assign the red brick to that user after their login completes

#### Scenario: Bootstrap with unconfigured owner
- **WHEN** OIDC_OWNER_RED is empty or not set
- **THEN** the red brick SHALL remain unheld until manually assigned

#### Scenario: Bootstrap after first users exist
- **WHEN** the database already has users and brick_state rows
- **THEN** the bootstrap logic SHALL NOT reassign brick ownership

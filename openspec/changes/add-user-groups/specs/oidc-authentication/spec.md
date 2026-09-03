## MODIFIED Requirements

### Requirement: OIDC login flow

The system SHALL authenticate users via a generic OIDC provider using the Authorization Code flow. The system SHALL redirect unauthenticated users to the OIDC provider's authorization endpoint and handle the callback to establish a session. The authorization request SHALL include the `groups` scope so the provider returns the user's group memberships.

#### Scenario: User initiates login
- **WHEN** an unauthenticated user navigates to the app
- **THEN** the system SHALL display a login page with a "Sign in" button that redirects to `/api/auth/login`

#### Scenario: OIDC authorization redirect
- **WHEN** a user requests `GET /api/auth/login`
- **THEN** the system SHALL redirect the browser to the OIDC provider's authorization endpoint with the configured client_id, redirect_uri, response_type=code, scope=openid+profile+email+groups, and a random state parameter

#### Scenario: OIDC callback with valid code
- **WHEN** the OIDC provider redirects back to `GET /api/auth/callback` with a valid authorization code and matching state parameter
- **THEN** the system SHALL exchange the code for tokens at the token endpoint, validate the ID token (issuer, audience, expiry, signature via JWKS), extract the user's sub, email, name, picture, and groups claims, upsert the user in the database (deriving their role from groups per the user-groups capability), create an express-session containing the user's id and email, and redirect the browser to the SPA root

#### Scenario: OIDC callback with invalid code
- **WHEN** the OIDC provider redirects back to `GET /api/auth/callback` with an invalid or expired authorization code
- **THEN** the system SHALL return a 401 status with an error message

#### Scenario: OIDC callback with mismatched state
- **WHEN** the OIDC provider redirects back to `GET /api/auth/callback` with a state parameter that does not match the stored state
- **THEN** the system SHALL return a 401 status with an error message

### Requirement: Current user endpoint

The system SHALL provide an endpoint to retrieve the current authenticated user's information and the full users list, including each user's role.

#### Scenario: Authenticated user requests /auth/me
- **WHEN** an authenticated user requests `GET /api/auth/me`
- **THEN** the system SHALL return a JSON object with `user` (id, email, displayName, username, avatarUrl, role) and `users` (array of all users with id, displayName, username, and role)

#### Scenario: Unauthenticated user requests /auth/me
- **WHEN** an unauthenticated user requests `GET /api/auth/me`
- **THEN** the system SHALL return a 401 status

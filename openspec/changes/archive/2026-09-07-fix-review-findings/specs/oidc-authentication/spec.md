# OIDC Authentication — Delta

## MODIFIED Requirements

### Requirement: Session management

The system SHALL manage user sessions using express-session backed by a SQLite session store with httpOnly cookies. The session cookie SHALL carry the `Secure` attribute whenever the app is served over HTTPS, determined from the `APP_URL` protocol (`https://`); deployments served over plain HTTP SHALL continue to work with a non-Secure cookie.

#### Scenario: Session created on login
- **WHEN** a user successfully authenticates via OIDC
- **THEN** the system SHALL create a session in the SQLite sessions table and set an httpOnly, SameSite=Lax session cookie

#### Scenario: Secure cookie behind HTTPS
- **WHEN** `APP_URL` is set to an `https://` URL and a user authenticates
- **THEN** the session cookie SHALL be set with the `Secure` attribute so browsers never transmit it over plain HTTP

#### Scenario: Non-Secure cookie over plain HTTP
- **WHEN** `APP_URL` is unset or uses `http://` and a user authenticates
- **THEN** the session cookie SHALL be set without the `Secure` attribute so login continues to work on plain-HTTP deployments

#### Scenario: Session validated on authenticated endpoints
- **WHEN** a request includes a valid session cookie
- **THEN** the system SHALL populate `req.session.user` with the user's id and email retrieved from the session store

#### Scenario: Session rejected when invalid
- **WHEN** a request includes an expired or tampered session cookie
- **THEN** the system SHALL treat the request as unauthenticated (no `req.session.user`)

#### Scenario: Logout destroys session
- **WHEN** a user requests `GET /api/auth/logout` with a valid session
- **THEN** the system SHALL destroy the session in the SQLite store, clear the session cookie, and redirect to the SPA root

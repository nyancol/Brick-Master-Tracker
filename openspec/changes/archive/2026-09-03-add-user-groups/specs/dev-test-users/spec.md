## MODIFIED Requirements

### Requirement: Test user seeding

In development, the system SHALL ensure the four canonical test users (Yann, Anselme, Thomas as knights, Salma as visitor) exist in the `users` table, identified by stable synthetic subjects under a `dev:` namespace, each with their assigned role.

#### Scenario: Seed on startup
- **WHEN** the server starts with dev login enabled and the test users do not yet exist
- **THEN** the system SHALL upsert Yann, Anselme, and Thomas with `role = 'knight'`, and Salma with `role = 'visitor'`, each with distinct `sub`, `email`, `display_name`, and `username` values

#### Scenario: Idempotent reseed
- **WHEN** the server starts with dev login enabled and the test users already exist
- **THEN** the system SHALL NOT create duplicate rows, and SHALL update their profile fields (including role) from the seed data

### Requirement: Dev login config endpoint

The system SHALL provide an unauthenticated endpoint that reports whether dev login is available and lists the test users with their roles, so the client can decide whether to render the picker and badge the roles.

#### Scenario: Dev login enabled
- **WHEN** a client requests `GET /api/auth/dev` and dev login is enabled
- **THEN** the system SHALL return `200` with `{ enabled: true, users: [{ username, displayName, role }] }` for the seeded test users

#### Scenario: Dev login disabled
- **WHEN** a client requests `GET /api/auth/dev` and dev login is disabled
- **THEN** the system SHALL return `200` with `{ enabled: false, users: [] }`

### Requirement: Dev test-user picker on login page

When dev login is enabled, the login page SHALL present a test-user picker that signs the user in without the OIDC provider, with a role badge on each test-user button.

#### Scenario: Picker shown in development
- **WHEN** an unauthenticated user loads the app and dev login is enabled
- **THEN** the login page SHALL display a button for each seeded test user (knights and the visitor) in addition to the OIDC "Sign in" button, each labeled with a localized role badge

#### Scenario: Picker hidden when disabled
- **WHEN** an unauthenticated user loads the app and dev login is disabled
- **THEN** the login page SHALL NOT display the test-user picker

#### Scenario: Selecting a test user
- **WHEN** a user clicks a test-user button on the login page
- **THEN** the client SHALL call the dev login endpoint and, on success, reload the app as the authenticated test user

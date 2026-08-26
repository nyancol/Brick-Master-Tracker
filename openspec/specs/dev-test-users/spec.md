# Dev Test Users

## Purpose

Development-only authentication that lets a developer sign in as seeded test users (Yann, Anselme, Thomas) without contacting the OIDC provider, so the multi-user transfer flow can be exercised locally.

## Requirements

### Requirement: Dev login gating

Dev-only test-user login SHALL be available only outside production, and SHALL be opt-out via configuration. The system SHALL NOT expose dev login endpoints in a production build.

#### Scenario: Development environment
- **WHEN** the server runs with `NODE_ENV` unset or set to any value other than `production`
- **THEN** dev login SHALL be enabled unless explicitly disabled with `DEV_LOGIN=false`

#### Scenario: Production environment
- **WHEN** the server runs with `NODE_ENV=production`
- **THEN** dev login SHALL be disabled regardless of `DEV_LOGIN`

#### Scenario: Explicit opt-out in development
- **WHEN** the server runs in a non-production environment with `DEV_LOGIN=false`
- **THEN** dev login SHALL be disabled

### Requirement: Test user seeding

In development, the system SHALL ensure the three canonical test users (Yann, Anselme, Thomas) exist in the `users` table, identified by stable synthetic subjects under a `dev:` namespace.

#### Scenario: Seed on startup
- **WHEN** the server starts with dev login enabled and the test users do not yet exist
- **THEN** the system SHALL upsert Yann, Anselme, and Thomas into the `users` table with distinct `sub`, `email`, `display_name`, and `username` values

#### Scenario: Idempotent reseed
- **WHEN** the server starts with dev login enabled and the test users already exist
- **THEN** the system SHALL NOT create duplicate rows, and SHALL update their profile fields from the seed data

### Requirement: Dev brick bootstrap

In development, on a freshly initialized database, the system SHALL assign initial brick ownership to the seeded test users so the transfer flow is immediately testable.

#### Scenario: Fresh database
- **WHEN** the server starts with dev login enabled and `brick_state` is empty
- **THEN** the red brick SHALL be assigned to Yann and the blue brick SHALL be assigned to Thomas

#### Scenario: Existing bricks
- **WHEN** the server starts with dev login enabled and `brick_state` already contains rows
- **THEN** the system SHALL NOT reassign brick ownership

### Requirement: Dev login config endpoint

The system SHALL provide an unauthenticated endpoint that reports whether dev login is available and lists the test users, so the client can decide whether to render the picker.

#### Scenario: Dev login enabled
- **WHEN** a client requests `GET /api/auth/dev` and dev login is enabled
- **THEN** the system SHALL return `200` with `{ enabled: true, users: [{ username, displayName }] }` for the seeded test users

#### Scenario: Dev login disabled
- **WHEN** a client requests `GET /api/auth/dev` and dev login is disabled
- **THEN** the system SHALL return `200` with `{ enabled: false, users: [] }`

### Requirement: Dev login endpoint

The system SHALL provide a dev-only endpoint that establishes an authenticated session for a test user without contacting the OIDC provider.

#### Scenario: Valid test user
- **WHEN** a client posts `POST /api/auth/dev/login` with a body identifying a seeded test user by `username`
- **THEN** the system SHALL upsert that test user, create a session containing the user's id and email, and return `200` with the same payload shape as `GET /api/auth/me`

#### Scenario: Unknown test user
- **WHEN** a client posts `POST /api/auth/dev/login` with a `username` that is not a seeded test user
- **THEN** the system SHALL return `404` with an error message

#### Scenario: Dev login disabled
- **WHEN** a client posts `POST /api/auth/dev/login` while dev login is disabled
- **THEN** the system SHALL return `404` with an error message

### Requirement: Dev test-user picker on login page

When dev login is enabled, the login page SHALL present a test-user picker that signs the user in without the OIDC provider.

#### Scenario: Picker shown in development
- **WHEN** an unauthenticated user loads the app and dev login is enabled
- **THEN** the login page SHALL display a button for each seeded test user in addition to the OIDC "Sign in" button

#### Scenario: Picker hidden when disabled
- **WHEN** an unauthenticated user loads the app and dev login is disabled
- **THEN** the login page SHALL NOT display the test-user picker

#### Scenario: Selecting a test user
- **WHEN** a user clicks a test-user button on the login page
- **THEN** the client SHALL call the dev login endpoint and, on success, reload the app as the authenticated test user

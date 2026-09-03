# User Identity

## Purpose

Provide a distinct OIDC username as a separate identity field from the display name, and control where each is shown in the UI.

## Requirements

### Requirement: Username extracted from OIDC

The system SHALL extract `preferred_username` from the OIDC ID token claims and store it in a new `username` column on the `users` table.

#### Scenario: OIDC login with preferred_username
- **WHEN** a user completes OIDC login and the ID token contains a `preferred_username` claim
- **THEN** the system SHALL store that value as the user's `username`

#### Scenario: OIDC login without preferred_username
- **WHEN** a user completes OIDC login and the ID token does NOT contain a `preferred_username` claim
- **THEN** the system SHALL fall back to the `name` claim (lowercased, spaces replaced with `-`) as the username

#### Scenario: Existing user logs in after migration
- **WHEN** a user who was created before the `username` column existed completes OIDC login
- **THEN** the system SHALL backfill their `username` with the value from `preferred_username` (or the fallback)

### Requirement: Username used in most display contexts

The system SHALL use the `username` field in all user-facing display contexts except the header badge, where `displayName` SHALL be used instead.

#### Scenario: Brick holder shows username
- **WHEN** a brick's holder is displayed on the home page
- **THEN** the holder's `username` SHALL be shown instead of `displayName`

#### Scenario: Recipient buttons show username
- **WHEN** transfer recipient buttons are rendered on the home page
- **THEN** each recipient's `username` SHALL be shown instead of `displayName`

#### Scenario: Transfer history shows username
- **WHEN** transfer history entries are rendered in the chronicles view
- **THEN** the from/to user names SHALL show `username` instead of `displayName`

#### Scenario: Transfer modal shows username
- **WHEN** the transfer modal displays the recipient name
- **THEN** the recipient's `username` SHALL be shown instead of `displayName`

#### Scenario: Header badge shows displayName
- **WHEN** the current user's name is shown in the top-right header badge
- **THEN** the user's `displayName` SHALL be shown (not `username`)

#### Scenario: Story editor byline shows username
- **WHEN** the story editor shows who last edited a transfer story
- **THEN** the editor's `username` SHALL be shown instead of `displayName`

### Requirement: API exposes both username and displayName

The system SHALL expose both `username` and `displayName` in all API responses that include user information.

#### Scenario: /api/auth/me returns both fields
- **WHEN** an authenticated user requests `GET /api/auth/me`
- **THEN** the response SHALL include `username` alongside `displayName` in both the `user` object and each entry in the `users` array

#### Scenario: Brick list includes username
- **WHEN** bricks are returned from `GET /api/bricks`
- **THEN** each brick SHALL include a `holderName` (the holder's username) field alongside existing fields

#### Scenario: Transfer list includes username
- **WHEN** transfers are returned from `GET /api/transfers`
- **THEN** the `fromName`, `toName`, and `transferredByName` fields SHALL contain the corresponding users' `username`

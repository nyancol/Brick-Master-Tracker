## ADDED Requirements

### Requirement: User role derivation from OIDC groups

The system SHALL derive a user role (`knight` or `visitor`) from the OIDC `groups` claim at login: membership in the knights group yields `knight`, membership in the visitors group (or absence of any recognized group) yields `visitor`. Membership in both groups SHALL resolve to `knight`. The knights and visitors group names SHALL be configurable via the `OIDC_GROUP_KNIGHTS` and `OIDC_GROUP_VISITORS` environment variables, defaulting to `Les Chevaliers de l'Amitié` and `Les Visiteurs` respectively.

#### Scenario: User in the knights group logs in
- **WHEN** a user logs in via OIDC and their `groups` claim contains the configured knights group name
- **THEN** the system SHALL store `role = 'knight'` for that user

#### Scenario: User in the visitors group logs in
- **WHEN** a user logs in via OIDC and their `groups` claim contains the configured visitors group name but not the knights group
- **THEN** the system SHALL store `role = 'visitor'` for that user

#### Scenario: User in both groups logs in
- **WHEN** a user logs in and their `groups` claim contains both configured group names
- **THEN** the system SHALL store `role = 'knight'` (knight takes precedence)

#### Scenario: Missing or unrecognized groups claim
- **WHEN** a user logs in and the `groups` claim is absent, empty, or contains no configured group name
- **THEN** the system SHALL store `role = 'visitor'` (secure default)

### Requirement: Role persistence on users

The system SHALL persist the derived role in a `role` column on the `users` table (`'knight'` or `'visitor'`), refreshed on every login together with the other profile claims. Existing users at migration time SHALL be backfilled as `knight`.

#### Scenario: Role refreshed on re-login
- **WHEN** a returning user logs in again after their group membership changed at the OIDC provider
- **THEN** the system SHALL update their stored role to match the freshly derived role without changing their internal user ID

#### Scenario: Migration backfills existing users as knights
- **WHEN** the migration adds the `role` column to a database that already has users
- **THEN** all pre-existing users SHALL be set to `role = 'knight'`

### Requirement: Role exposed via /api/auth/me

The system SHALL include each user's role in the `/api/auth/me` payload: the `user` object and every entry in the `users` array SHALL carry a `role` field.

#### Scenario: Authenticated user fetches /auth/me
- **WHEN** an authenticated user requests `GET /api/auth/me`
- **THEN** the response `user` object SHALL include their `role`, and each entry in `users` SHALL include that user's `role`

### Requirement: Visitor banner and header role badge

The app SHALL show a friendly banner to visitors explaining that visitors watch while knights carry the brick (in both `en` and `fr` locales), and the header badge SHALL display the signed-in user's role. Both SHALL work in Day and Dungeon themes.

#### Scenario: Visitor sees explanatory banner
- **WHEN** a user with `role = 'visitor'` views the home page
- **THEN** the app SHALL display a banner with equivalent meaning to « Les Visiteurs regardent, les Chevaliers portent » in the selected locale

#### Scenario: Knight sees no banner
- **WHEN** a user with `role = 'knight'` views the home page
- **THEN** no visitor banner SHALL be displayed

#### Scenario: Role badge in header
- **WHEN** any authenticated user views the app
- **THEN** the header badge SHALL display their role (localized) alongside the display name

### Requirement: Role staleness until next login

The system SHALL refresh a user's role only at login. Group membership changes made at the OIDC provider SHALL NOT affect the stored role until the user logs in again. The system SHALL log a server-side warning when a login yields no recognized group.

#### Scenario: Provider group change mid-session
- **WHEN** an administrator changes a user's groups at the OIDC provider while the user holds a valid session
- **THEN** the user's stored role SHALL remain unchanged until their next login

#### Scenario: Unrecognized groups at login logged
- **WHEN** a login produces the visitor role because no recognized group was found
- **THEN** the server SHALL log a warning mentioning the user and the raw groups received

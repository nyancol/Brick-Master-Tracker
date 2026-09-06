# Environment Badge

## Purpose

Persistent visual indicator of which deployment environment the user is viewing. The footer shows the environment label («dev» / «staging») in non-production environments and renders nothing in production. Identity comes from the `APP_ENV` environment variable, not feature flags — deployment identity belongs in env config.

## Requirements

### Requirement: Environment identity configuration
The server SHALL determine its deployment environment identity from the `APP_ENV` environment variable, accepting the values `dev`, `staging`, and `production`. When `APP_ENV` is unset, the server SHALL use `dev`. The production compose file SHALL pin `APP_ENV=production` and the preprod compose file SHALL pin `APP_ENV=staging`.

#### Scenario: Production container pins production
- **WHEN** the production container starts from `compose.yaml`
- **THEN** its environment identity is `production`

#### Scenario: Preprod container pins staging
- **WHEN** the preprod container starts from `compose.yaml` + `compose.preprod.yaml`
- **THEN** its environment identity is `staging`

#### Scenario: Host dev defaults to dev
- **WHEN** the server starts via `pnpm dev` with `APP_ENV` unset
- **THEN** its environment identity is `dev`

### Requirement: Environment exposure endpoint
The system SHALL expose `GET /api/environment`, a public unauthenticated endpoint returning a JSON object with the server's environment identity (`{ "environment": "dev" | "staging" | "production" }`).

#### Scenario: Client fetches environment at boot
- **WHEN** the SPA requests `GET /api/environment` without a session
- **THEN** it receives a 200 response containing the server's environment identity

### Requirement: Environment badge visibility
The footer SHALL render an environment badge showing the environment label in non-production environments, and SHALL render no badge when the environment is `production`.

#### Scenario: Badge shows in preprod
- **WHEN** the SPA runs against the preprod instance (environment `staging`)
- **THEN** the footer displays a badge labeled «staging»

#### Scenario: Badge shows in dev
- **WHEN** the SPA runs against a host-run dev server (environment `dev`)
- **THEN** the footer displays a badge labeled «dev»

#### Scenario: No badge in production
- **WHEN** the SPA runs against the production instance (environment `production`)
- **THEN** the footer renders no environment badge

#### Scenario: Unknown environment value fails visible
- **WHEN** the server reports an environment identity outside the three known values
- **THEN** the footer displays a badge labeled with the raw value

### Requirement: Badge localization and theming
The badge label text SHALL exist in both the en and fr locale dictionaries, and the badge SHALL render correctly in both the Day and Dungeon themes.

#### Scenario: French locale
- **WHEN** the language is set to fr in a non-production environment
- **THEN** the badge displays its French label

#### Scenario: Both themes
- **WHEN** the theme is toggled between Day and Dungeon
- **THEN** the badge remains visible and legible in both

### Requirement: Demo flag removal
The `ui-demo-badge` flag introduced for pipeline verification SHALL be removed from the shared flag registry and from all three flag definition files. The flag system itself SHALL remain unchanged.

#### Scenario: Registry no longer contains the demo flag
- **WHEN** the flag registry, `flags.dev.json`, `flags.preprod.json`, and `flags.prod.json` are inspected
- **THEN** no `ui-demo-badge` entry exists in any of them

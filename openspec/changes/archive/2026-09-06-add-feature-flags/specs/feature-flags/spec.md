## ADDED Requirements

### Requirement: Server-side flag evaluation via OpenFeature
The Express server SHALL evaluate feature flags through the OpenFeature server SDK using the flagd provider in every environment. When `FLAGD_HOST` is set, it SHALL use the provider's rpc resolver against the flagd sidecar; when `FLAGD_HOST` is unset, it SHALL use the provider's in-process resolver watching the dev flag definition file. No application code other than provider initialization SHALL know which resolver is active.

#### Scenario: Container environment uses flagd provider
- **WHEN** the server starts with `FLAGD_HOST=flagd` (prod or preprod container)
- **THEN** flag evaluations are served by the flagd provider's rpc resolver over gRPC

#### Scenario: Dev environment evaluates flags without a flagd daemon
- **WHEN** the server starts with `FLAGD_HOST` unset (host-run dev)
- **THEN** flag evaluations are served by the flagd provider's in-process resolver reading `flags/flags.dev.json`, and no flagd process or container is required

### Requirement: Flag definition files in git
The system SHALL source flag definitions from JSON files in the repository in flagd format, one per environment (`flags/flags.dev.json`, `flags/flags.preprod.json`, `flags/flags.prod.json`), all sharing the same schema. Container environments SHALL mount the environment's file into the flagd sidecar, which watches it for changes. Changing a flag SHALL follow the workflow: edit file → commit → push → `git pull` on the server.

#### Scenario: Preprod and prod flags are independent
- **WHEN** a flag is enabled in `flags.preprod.json` but not in `flags.prod.json`
- **THEN** the preprod instance serves the enabled value and the production instance serves the disabled value

#### Scenario: Flag file change rolls out without restart
- **WHEN** the environment's flag file changes on the server (via `git pull`)
- **THEN** the running instance serves the new flag values without a process restart

### Requirement: Live reload of flag definitions
The system SHALL reload flag definitions when their source file changes, without requiring a restart: flagd file-sync in container environments, and the in-process resolver's file sync in dev.

#### Scenario: Dev flag edit applies without dev-server restart
- **WHEN** `flags/flags.dev.json` is edited while the dev server is running
- **THEN** subsequent evaluations return the new values without restarting the dev server

### Requirement: Flags delivery endpoint
The system SHALL expose `GET /api/flags` returning the evaluated value of every flag key in the shared registry, without requiring authentication. The response SHALL be a JSON object mapping flag key to evaluated value.

#### Scenario: Client boot fetches flag values
- **WHEN** the SPA fetches `GET /api/flags` at startup
- **THEN** it receives a 200 response with a value for every registry flag key

#### Scenario: Endpoint is available pre-authentication
- **WHEN** `GET /api/flags` is requested without a session
- **THEN** it returns 200 with flag values

### Requirement: Client-side flag consumption
The SPA SHALL hydrate an OpenFeature web provider with the values from `GET /api/flags` before first render, and UI features SHALL read flags through OpenFeature hooks using keys and defaults from the shared registry. UI flag changes SHALL take effect on the next page load.

#### Scenario: Flagged UI element respects flag state
- **WHEN** a flag guarding a UI element is disabled and the page loads
- **THEN** the element is not rendered, and the code default (current behavior) applies

#### Scenario: UI flag change appears on reload
- **WHEN** a UI-visible flag's value changes server-side
- **THEN** the new value is reflected in the UI after the next full page load

### Requirement: Fail-safe defaults
The shared flag registry SHALL be the single source of truth for flag keys, value types, and code defaults, where every default equals current (flag-off) behavior. When the flag source is unreachable, a flag key is unknown to it, or evaluation fails, the system SHALL return the registry default.

#### Scenario: Flagd unreachable falls back to defaults
- **WHEN** the flagd sidecar is down or unreachable and `GET /api/flags` is requested
- **THEN** the server responds 200 with registry default values and the app boots with features off

#### Scenario: Unknown flag key falls back to default
- **WHEN** a flag key present in the registry is missing from the environment's flag definition file
- **THEN** evaluation returns the registry default value

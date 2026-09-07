## ADDED Requirements

### Requirement: Complete resource attributes in code
When telemetry is enabled, every exported signal SHALL carry `service.name`, `service.version` (from `package.json`), and `deployment.environment.name` as resource attributes. An explicit `deployment.environment.name` in `OTEL_RESOURCE_ATTRIBUTES` wins; otherwise the server falls back to `APP_ENV` (`dev`, `staging`, `production`), defaulting to `dev`. Default SDK env-detector merging of `OTEL_RESOURCE_ATTRIBUTES` SHALL remain enabled.

#### Scenario: Version and environment are present without operator env
- **WHEN** telemetry is enabled with only `OTEL_EXPORTER_OTLP_ENDPOINT` set (no `OTEL_RESOURCE_ATTRIBUTES`)
- **THEN** exported spans, metrics, and logs carry `service.name=brick-tracker`, `service.version` equal to the app version, and `deployment.environment.name` equal to the `APP_ENV` value (or `dev` when unset)

#### Scenario: Operator environment override wins
- **WHEN** telemetry is enabled with `OTEL_RESOURCE_ATTRIBUTES=deployment.environment.name=preprod`
- **THEN** exported signals carry `deployment.environment.name=preprod`, not the `APP_ENV` fallback

### Requirement: Graceful telemetry shutdown
The server SHALL flush and shut down the OpenTelemetry SDK on `SIGTERM` and `SIGINT` with a bounded timeout (about 5 seconds), closing the HTTP listener first. Shutdown SHALL be a no-op when telemetry is disabled, and SHALL never prevent process exit.

#### Scenario: SIGTERM flushes pending telemetry
- **WHEN** telemetry is enabled, requests have been served, and the process receives `SIGTERM`
- **THEN** pending spans and metric batches are exported before exit and the process terminates within the bounded timeout

#### Scenario: Disabled telemetry exits immediately
- **WHEN** telemetry is disabled and the process receives `SIGTERM` or `SIGINT`
- **THEN** the process exits without attempting OTLP export or waiting on the telemetry timeout

### Requirement: Aligned OpenTelemetry dependency line
The OTel dependencies (`api`, `core`, `resources`, `sdk-node`, `sdk-metrics`, exporters, semantic conventions) SHALL resolve to a single mutually-compatible release line, and the deprecated `@opentelemetry/semantic-conventions` root import SHALL be replaced by the stable successor (or spec-stable string keys if the stable package conflicts).

#### Scenario: Clean install and typecheck
- **WHEN** a fresh `pnpm install` runs followed by `tsc --noEmit`
- **THEN** installation succeeds with no peer-dependency conflicts and typechecking passes with no OTel import errors

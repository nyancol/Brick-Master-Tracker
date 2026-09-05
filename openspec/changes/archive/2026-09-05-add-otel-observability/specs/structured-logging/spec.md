# structured-logging

## ADDED Requirements

### Requirement: Structured logging replaces console output
All server-side application logging (request handling, auth, database migrations, startup) SHALL go through a structured logger (pino) producing machine-parseable output; ad-hoc `console.*` calls SHALL be removed from `server/` modules.

#### Scenario: No stray console logging
- **WHEN** the `server/` sources are searched for `console.log`, `console.error`, or `console.warn`
- **THEN** no occurrences remain (except inside the logger bootstrap itself, if any)

#### Scenario: Error logs carry error details
- **WHEN** an endpoint catches an exception and logs it (e.g. `POST /api/visits` failure)
- **THEN** the log entry is structured JSON with a level, message, and the error's message/stack

### Requirement: Human-readable output in dev, JSON in production
When telemetry is disabled (local development), logs SHALL be pretty-printed to stdout for humans; in production they SHALL be single-line JSON on stdout suitable for `docker logs` and collection.

#### Scenario: Dev run is readable
- **WHEN** the server runs locally without `OTEL_EXPORTER_OTLP_ENDPOINT`
- **THEN** log lines are colorized/indented human-readable output, not raw JSON

#### Scenario: Production run is collectable
- **WHEN** the server runs in production (telemetry enabled or not)
- **THEN** stdout lines are one-JSON-object-per-line with at least `time`, `level`, `msg`

### Requirement: Request correlation via trace id
When telemetry is enabled, every log entry emitted while handling a request SHALL carry the active trace id, so log lines can be jumped to from a trace and vice versa.

#### Scenario: Log line links to its trace
- **WHEN** telemetry is enabled and a request handler logs a message
- **THEN** the log entry includes the trace id of that request's span

### Requirement: OTLP log shipping
When telemetry is enabled, application logs SHALL additionally be exported as OTLP logs to the configured endpoint, arriving queryable in the logs backend.

#### Scenario: Logs visible in the observability stack
- **WHEN** telemetry is enabled and a request triggers an error log
- **THEN** that log entry can be found in the logs backend (Loki) with its level and trace id

# Server Telemetry

## Purpose

OpenTelemetry-based tracing and metrics for the HTTP server: server spans and RED metrics exported via OTLP, gated behind `OTEL_EXPORTER_OTLP_ENDPOINT` so the app behaves identically when telemetry is off.

## Requirements

### Requirement: Trace export from HTTP handling
When `OTEL_EXPORTER_OTLP_ENDPOINT` is set, the server SHALL initialize the OpenTelemetry SDK before any request handling starts, and each incoming HTTP request SHALL produce a server span (with `http.request.method`, `http.route`, and `http.response.status_code`) exported via OTLP to the configured endpoint.

#### Scenario: Authenticated request produces a trace
- **WHEN** telemetry is enabled and a client calls any API endpoint (e.g. `GET /api/bricks`)
- **THEN** a server span for that request exists in the trace backend with the correct route and HTTP method

#### Scenario: Error requests are traceable
- **WHEN** an endpoint responds with a 4xx or 5xx status while telemetry is enabled
- **THEN** the resulting span records that response status code (and an error status for 5xx)

### Requirement: RED metrics from HTTP instrumentation
When telemetry is enabled, the server SHALL export HTTP request metrics (request duration histogram and request counter) carrying the response status code attribute, so that per-status error rates and latency percentiles can be computed in the backend.

#### Scenario: Error rate is computable
- **WHEN** telemetry is enabled and requests producing 200s and 500s have been served
- **THEN** the exported metrics allow distinguishing those requests by `http.response.status_code`

### Requirement: Telemetry is endpoint-gated
The SDK SHALL be activated only when `OTEL_EXPORTER_OTLP_ENDPOINT` is configured. When it is unset, the application SHALL behave exactly as before: no exporters, no background export traffic, no new failure modes, plain stdout output.

#### Scenario: Local dev without the observability stack
- **WHEN** the server is started without `OTEL_EXPORTER_OTLP_ENDPOINT`
- **THEN** the app serves requests normally with no OTLP export attempts

### Requirement: Telemetry failure does not affect serving
When telemetry is enabled but the OTLP endpoint is unreachable, the application SHALL continue serving requests normally; export failures SHALL be surfaced in stdout logs but MUST NOT crash or block request handling.

#### Scenario: Collector down mid-flight
- **WHEN** the observability backend is stopped while the app keeps running with telemetry enabled
- **THEN** the app keeps serving API requests and logs export failures without crashing

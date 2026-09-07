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
When telemetry is enabled, the server SHALL record real HTTP request metrics via a post-response middleware: `http.server.request.duration` (Histogram, seconds) and `http.server.request.count` (Counter), each carrying `http.route` (templated, e.g. `/bricks/:color/transfer`), `http.request.method`, and `http.response.status_code`, so that per-status error rates and latency percentiles can be computed in the backend. Unmatched routes SHALL use a single bounded `unknown` route value.

#### Scenario: Error rate is computable
- **WHEN** telemetry is enabled and requests producing 200s and 500s have been served
- **THEN** the exported metrics allow distinguishing those requests by `http.response.status_code`

#### Scenario: Latency percentiles are computable per route
- **WHEN** telemetry is enabled and requests to a templated route have been served
- **THEN** `http.server.request.duration` buckets labeled by that `http.route` allow p50/p95 computation without high-cardinality path values

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

### Requirement: Session metric from successful logins
A session for metrics purposes is defined as a successful login. When telemetry is enabled, the server SHALL increment `auth.login.count` (Counter) with `method` (`oidc` or `dev`) and `outcome` (`success` or `error`) after the session-save callback completes, so sessions per day are graphable as `sum(increase(auth_login_count{outcome="success"}[24h]))`.

#### Scenario: Sessions per day are graphable
- **WHEN** telemetry is enabled and OIDC and dev logins have succeeded and failed over a day
- **THEN** Prometheus can split login counts by `method` and `outcome` to graph successful sessions per day

### Requirement: Action metrics for transfers, seizes, and visits
An action for metrics purposes is a transfer, a seize, or a visit request. When telemetry is enabled, the server SHALL increment `brick.transfer.count` (labels `color`, `outcome`), `brick.seize.count` (label `outcome`), and `site.visit.count` (label `counted=true|false`) only after the underlying commit or branch resolves (`success` on DB commit, `error` on validation/transaction rejection; `counted=false` on the deduped-visit branch), so actions per day are graphable without user-identifying labels.

#### Scenario: Actions per day are graphable by type
- **WHEN** telemetry is enabled and transfers (red/blue, success/error), seizes, and counted/deduped visits occur over a day
- **THEN** each counter supports a per-day `increase()` query split by its labels, with no `user_id`, username, SQL text, or free-text label present

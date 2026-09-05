# Proposal: add-otel-observability

## Why

The app currently has no observability beyond raw `console.*` output and a `/healthz` endpoint: no metrics, no traces, no structured logs. When something goes wrong in production (5xx spikes, slow responses, auth failures), there is no way to see it. This change introduces server-side OpenTelemetry instrumentation and a self-hosted Grafana backend so HTTP error rates, latencies, logs, and slow SQLite queries become visible and queryable.

## What Changes

- Add an OpenTelemetry Node.js SDK bootstrap (`server/telemetry.ts`) with HTTP + Express auto-instrumentation, exporting traces and RED metrics (request rate, error rate by status code, duration) via OTLP. SDK is activated only when `OTEL_EXPORTER_OTLP_ENDPOINT` is set; otherwise (local dev, no stack) behavior is unchanged stdout-only.
- Replace scattered `console.log/error/warn` (~40 call sites) with structured logging via pino: pretty output in dev, JSON on stdout in production, plus OTLP log export to the collector when telemetry is enabled. A request-id is attached to each log line for correlation with traces.
- Add a wrapper around `better-sqlite3` statement execution that records query durations and logs/attributes slow statements (configurable threshold), since better-sqlite3 is synchronous native code with no OTel auto-instrumentation.
- Add a standalone `grafana/otel-lgtm` stack (`obs/compose.yaml` — embedded OTel collector + Prometheus + Loki + Tempo + Grafana) as the single observability instance for the host, with persistent volume; the app compose joins its shared `telemetry` network, and Grafana is exposed through Caddy like the other services. Host-run dev instances export to the loopback-published collector.
- Formalize a preprod deployment mode (`compose.preprod.yaml`): an isolated second app instance (own container name, port 5173, own data volume) running alongside production for testing, with **no observability of its own** — it exports to the standalone LGTM stack tagged `deployment.environment.name=preprod`.
- Extend `.env.example` with the telemetry-related variables.

Out of scope (deferred): browser/SPA telemetry (client-side OTel, authenticated relay, pre-login error capture), alerting, full RUM, server-side identity stamping of telemetry.

Visual surfaces: no app UI changes at all — all UI work in this change is confined to the Grafana UI (config only, no code).

## Capabilities

### New Capabilities
- `server-telemetry`: OpenTelemetry traces and metrics exported from the Express server when the OTLP endpoint is configured; clean no-op behavior when it is not.
- `structured-logging`: structured pino-based application logging replacing `console.*`, with dev/prod output modes and OTLP log shipping.
- `slow-query-tracking`: per-statement duration observation for the embedded SQLite database, surfacing slow queries as log entries.
- `telemetry-backend`: the self-hosted Grafana LGTM observability stack (collector, Prometheus, Loki, Tempo, Grafana) wired into the app's Docker Compose deployment.

### Modified Capabilities

(none — no existing spec-level behavior changes)

## Impact

- **Code**: `server/index.ts` (bootstrap order), `server/app.ts`, `server/auth.ts`, `server/db.ts` (logger migration, query wrapper). New `server/telemetry.ts`.
- **Dependencies**: `@opentelemetry/sdk-node` + instrumentation packages (http, express), `pino`, `pino-pretty` (dev), pino OTLP transport packages.
- **Infra**: `compose.yaml` (new `grafana` service + volumes + network), `.env.example`; Caddy configuration lives outside this repo (route for the Grafana UI is documented, not coded).
- **Runtime**: when telemetry is enabled, the server holds a small overhead (batching exporters, async log transport); with the endpoint unset, overhead is effectively zero.

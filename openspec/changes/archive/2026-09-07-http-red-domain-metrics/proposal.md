## Why

The OTLP metric pipeline exports nothing: `PeriodicExportingMetricReader` runs with zero instruments, so the RED promise in `server-telemetry` is untrue and product questions (sessions and actions per day) are unanswerable in Prometheus/Grafana.

## What Changes

- Add real RED instruments: `http.server.request.duration` histogram and request counter, labeled by `route`, `method`, `status_code`.
- Add minimal domain counters to answer sessions/actions per day:
  - sessions = successful logins (`auth.login.count{method,outcome}`; `method=oidc|dev`)
  - actions = `brick.transfer.count{color,outcome}`, `brick.seize.count{outcome}`, `site.visit.count{counted}` (counted vs deduped)
- Keep cardinality low: fixed label sets only, no user IDs, names, SQL text, or free text. Domain counters increment only after commit/success.
- Gate everything behind `OTEL_EXPORTER_OTLP_ENDPOINT` (no-op when disabled); keep default SDK env-resource merging.

## Capabilities

### New Capabilities
- None — product surface unchanged.

### Modified Capabilities
- `server-telemetry`: RED metrics become real (currently spec-only); domain session/action counters added with definitions and cardinality rules.

## Impact

- Code: new `server/metrics.ts` (singleton Meter + instruments), `server/telemetry.ts` (wire meter provider), `server/app.ts` (RED middleware + domain increments), `server/auth.ts`/`server/db.ts` touch points only for increment call sites.
- No API, DB schema, UI, i18n, collector, or port changes. No new dependencies.
- Depends on `otel-resource-shutdown-alignment` for flush-on-shutdown; usable without it but tail-interval loss applies.

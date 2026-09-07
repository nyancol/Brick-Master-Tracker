## Context

`server/telemetry.ts` runs a `PeriodicExportingMetricReader` with no `Meter` and no instruments, so the OTLP metrics pipeline ships empty payloads. The `server-telemetry` spec promises RED metrics (duration histogram + counter by status) that do not exist. Product questions — sessions and actions per day — are answerable today only by grepping logs.

Constraints: Express 5, ESM, esbuild chunks (`dist/telemetry.mjs` banner before `dist/server.mjs`), endpoint-gated telemetry (`OTEL_EXPORTER_OTLP_ENDPOINT`), LGTM backend (Prometheus). Minimal definitions agreed in explore: sessions = successful logins; actions = transfers, seizes, counted visits.

## Goals / Non-Goals

**Goals:**
- RED is real: every HTTP request records duration + count with `route`, `method`, `status_code`.
- Sessions/actions per day are graphable in Grafana from 4 domain counters.
- Cardinality stays bounded; no PII or free text in any label.

**Non-Goals:**
- No per-user/per-transfer labels, no comment/huzzah/upload/story metrics (sparse-traffic noise).
- No runtime-node instrumentation, no sampler config, no dashboards/alerts provisioning.
- No resource/shutdown work (belongs to `otel-resource-shutdown-alignment`).

## Decisions

**1. New `server/metrics.ts` singleton owning one `Meter` and all instruments.**
`metrics.getMeter("brick-tracker")`, instruments created once at module load; module exports typed helpers (`recordHttpRequest()`, `countLogin()`, `countTransfer()`, `countSeize()`, `countVisit()`). No-op implementations when telemetry is disabled so call sites stay unconditional. Rationale: single creation point prevents duplicate-instrument warnings; helpers keep `app.ts` call sites one-liners. Alternative (inline `meter.create*` in each route) rejected: duplicates instruments per import and scatters label discipline.

**2. RED via post-response middleware, route-templated.**
Middleware wraps `res.on("finish")`, records `http.server.request.duration` (Histogram, unit `s`, default buckets) and `http.server.request.count` (Counter) with `http.route` (Express `req.route?.path` with `:color`/`:id` placeholders, fallback `req.path` only for unmatched), `http.request.method`, `http.response.status_code`. Rationale: post-finish captures real status + duration; templated route keeps cardinality at ~26 routes instead of exploding on `:id`/`:filename`. Mounted on the API `app` in `app.ts` (not the static/SPA wrapper in `index.ts`), so RED covers API reality only.

**3. Session = successful login; increment after session save.**
`auth.login.count` Counter, labels `method=oidc|dev`, `outcome=success|error`. Increment on the `req.session.save` success callback (OIDC + dev paths), error on callback failure. Rationale: a session row is only real once persisted; counting earlier over-counts on save failure. Visitor-vs-knight is a log detail, not a label (role changes don't create sessions).

**4. Actions = transfer + seize + counted visit; increment only after commit.**
- `brick.transfer.count{color=red|blue,outcome=success|error}` — after the SQLite transaction returns `data` (success) or an `error` result (validation guards count as `outcome=error` since they are product-meaningful rejections, e.g. blue-via-transfer).
- `brick.seize.count{outcome}` — same rule, no `color` (always blue).
- `site.visit.count{counted=true|false}` — `true` on increment branch, `false` on deduped branch.
Rationale: post-commit counting keeps metrics consistent with DB truth; `counted` split makes visit growth vs returning-session traffic visible.

**5. Stable semconv names for RED, namespaced custom names for domain.**
RED uses `http.server.request.duration` / `http.server.request.count` with stable attribute keys; domain uses `brick.*`, `site.*`, `auth.*`. Rationale: RED names work with stock Grafana OTel dashboards; domain prefix avoids future semconv collisions.

**6. No extra dependencies; verification via in-memory reader.**
`@opentelemetry/sdk-metrics` already installed. Tests use `PeriodicExportingMetricReader` swapped for an in-memory/metric-reader in a scratch harness, never the real LGTM endpoint. Rationale: export intervals make live-backend tests flaky.

## Risks / Trade-offs

- [Risk] `req.route` unset for 404s/errors → label fallback needed → Mitigation: `unknown` route value is a single bounded bucket, documented.
- [Risk] Sparse counters (3 friends, rare transfers) look dead in Grafana → Mitigation: accepted; RED + visits carry the dashboard, domain counters answer point questions honestly.
- [Risk] Double counting if middleware + route increments disagree after rollback → Mitigation: rule is HTTP reality (middleware) vs DB truth (post-commit); documented as intentionally different lenses.
- [Risk] `dist/telemetry.mjs` chunk split means MeterProvider must be reachable from both chunks → Mitigation: create the MeterProvider in `telemetry.ts` (SDK-owned) and only `metrics.getMeter()` in `metrics.ts`, sharing the global API — no direct SDK import across chunks.

## Migration Plan

1. Deploy normally; new metrics appear in Prometheus on first requests. Old behavior unchanged (no instruments existed).
2. Rollback: revert image; no schema/collector changes.

## Open Questions

- None. Bucket tuning deferred until real latency data exists.

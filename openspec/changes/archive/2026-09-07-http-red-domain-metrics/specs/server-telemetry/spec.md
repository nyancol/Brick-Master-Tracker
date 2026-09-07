## MODIFIED Requirements

### Requirement: RED metrics from HTTP instrumentation
When telemetry is enabled, the server SHALL record real HTTP request metrics via a post-response middleware: `http.server.request.duration` (Histogram, seconds) and `http.server.request.count` (Counter), each carrying `http.route` (templated, e.g. `/bricks/:color/transfer`), `http.request.method`, and `http.response.status_code`, so that per-status error rates and latency percentiles can be computed in the backend. Unmatched routes SHALL use a single bounded `unknown` route value.

#### Scenario: Error rate is computable
- **WHEN** telemetry is enabled and requests producing 200s and 500s have been served
- **THEN** the exported metrics allow distinguishing those requests by `http.response.status_code`

#### Scenario: Latency percentiles are computable per route
- **WHEN** telemetry is enabled and requests to a templated route have been served
- **THEN** `http.server.request.duration` buckets labeled by that `http.route` allow p50/p95 computation without high-cardinality path values

## ADDED Requirements

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

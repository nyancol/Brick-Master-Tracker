## 1. Telemetry bootstrap (server-telemetry)

- [x] 1.1 Add OTel dependencies to package.json: `@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node` (or explicit `HttpInstrumentation` + `ExpressInstrumentation` packages), OTLP trace/metric exporters
- [x] 1.2 Create `server/telemetry.ts`: reads `OTEL_EXPORTER_OTLP_ENDPOINT`, initializes NodeSDK (resource name from `OTEL_SERVICE_NAME`, default `brick-tracker`) and calls `start()` when the endpoint is set; no-op path when unset
- [x] 1.3 Import `./telemetry.js` as the first import in `server/index.ts` (before `./app.js`)
- [x] 1.4 Verify with a local OTLP listener (e.g. scratch collector or LGTM container): a `GET /api/healthz` request produces a server span with method/route/status, and `http.server.request.duration`-style metrics distinguish a forced 500 from 200s

## 2. Structured logging (structured-logging)

- [x] 2.1 Add pino (+ `pino-pretty` as dev dep, + pino OTLP log transport package) and create `server/logger.ts`: pretty stdout when `OTEL_EXPORTER_OTLP_ENDPOINT` is unset, single-line JSON stdout always, OTLP log shipping when the endpoint is set; `LOG_LEVEL` honored (default `info`)
- [x] 2.2 Add request-correlation middleware on the API app: child logger per request carrying the active trace id (`req.log`), used by handlers
- [x] 2.3 Migrate all `console.log/error/warn` call sites in `server/app.ts` to the logger (error sites use `req.log` where a request exists)
- [x] 2.4 Migrate `console.*` in `server/auth.ts`, `server/db.ts`, `server/index.ts` to the logger
- [x] 2.5 Verify: `grep -rn "console\.\(log\|error\|warn\)" server/` is clean; dev run shows pretty output; production build run shows one-JSON-object-per-line on stdout

## 3. Slow-query tracking (slow-query-tracking)

- [x] 3.1 Add an instrumented wrapper in `server/db.ts` around statement execution (`prepare`-returned statement methods) that times execution without changing sync semantics or return values
- [x] 3.2 Emit a structured `warn` log (duration + truncated SQL, never bound parameters) when execution exceeds `SLOW_QUERY_THRESHOLD_MS` (default 100, honored in dev and prod)
- [x] 3.3 Verify transparency: full typecheck + manual exercise of transfer/seize/comment endpoints (transactional paths included) behaving identically
- [x] 3.4 Verify slow logging: temporarily set `SLOW_QUERY_THRESHOLD_MS=0` against the isolated test server (`PORT=3199`, `/tmp/opencode` data dir) and confirm warn entries appear; restore default and confirm silence

## 4. Backend wiring (telemetry-backend)

- [x] 4.1 Extend `compose.yaml`: `grafana` service (`grafana/otel-lgtm`), volumes for Prometheus/Loki/Tempo data, joins default network + `caddy_public`, no host ports for 4317/4318
- [x] 4.2 Pass `OTEL_EXPORTER_OTLP_ENDPOINT` (pointing at the grafana service by name) to the brick-tracker container in compose
- [x] 4.3 Extend `.env.example` with `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, `LOG_LEVEL`, `SLOW_QUERY_THRESHOLD_MS` + a note documenting the Caddy route for the Grafana UI
- [x] 4.4 Grafana admin credentials via `.env` for the grafana service

## 5. End-to-end verification

- [x] 5.1 Build production bundle (`pnpm build`) and confirm pino transports load from node_modules in the bundled server (no worker-resolution failure)
- [x] 5.2 With the stack up: generate requests incl. an error path → traces (Tempo), RED metrics with status codes (Prometheus), and logs with trace ids (Loki) are all queryable in Grafana
- [x] 5.3 Resilience: stop the grafana service → app keeps serving and logs export failures; recreate it → previously ingested data still queryable (volume persistence)
- [x] 5.4 Gate check: run the server with no `OTEL_EXPORTER_OTLP_ENDPOINT` → no export attempts, pretty stdout, behavior identical to pre-change
- [x] 5.5 Run `pnpm typecheck` clean

## 6. Standalone observability stack refactor (post-verification)

- [x] 6.1 Revert the TEST-mode compose override (compose.test.yaml removed)
- [x] 6.2 Create obs/compose.yaml: standalone lgtm service, lgtm-data volume, telemetry + caddy_public networks, loopback-only 4318 for host-run dev instances; obs/.env.example for Grafana credentials
- [x] 6.3 Rewire app compose.yaml: drop co-located grafana service, join external telemetry network, endpoint default http://lgtm:4318
- [x] 6.4 Document instance differentiation (OTEL_SERVICE_NAME, OTEL_RESOURCE_ATTRIBUTES deployment.environment.name) and dev endpoint in .env.example
- [x] 6.5 Update change artifacts (proposal, design D1/D6, telemetry-backend spec) to the standalone topology and validate both composes with docker compose config
- [x] 6.6 Add compose.preprod.yaml: isolated preprod instance (port 5173, own container name + volume, deployment.environment.name=preprod) reusing the standalone LGTM stack — no observability of its own
- [x] 6.7 Formalize preprod in telemetry-backend spec (reuses standalone stack, coexistence with prod, data isolation) and update proposal/design/.env.example

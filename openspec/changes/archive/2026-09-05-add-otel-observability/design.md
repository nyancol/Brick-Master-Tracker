# Design: add-otel-observability

## Context

The app is a single Node 24 process: Express 5 API + bundled React SPA (`dist/server.mjs`), `better-sqlite3` for storage, OIDC (Pocket-ID) auth, deployed as one Docker container behind Caddy on the `caddy_public` network. Observability today is ~40 scattered `console.*` calls and `/healthz`. The server is bundled by esbuild with `packages: "external"` (runtime resolves npm packages from node_modules — important for pino's worker-thread transports).

This design came out of an exploration session; the decisions below record both the choice and the rejected alternative so they aren't re-litigated during implementation.

```
DEV:  node server → pino → pretty stdout        (no SDK, no stack)
PROD: brick-tracker ──OTLP──▶ grafana/otel-lgtm ──▶ Prom (metrics)
      (HTTP/Express instr.)   (embedded collector) Loki (logs)
                              Tempo (traces)  Grafana UI ──Caddy──▶ browser
```

## Goals / Non-Goals

**Goals:**
- See HTTP error rates, latency, traffic (RED) per route without hand-rolled middleware
- Structured, correlated, queryable logs (dev stays human-readable)
- Slow SQLite queries become visible (the one DB signal auto-instrumentation can't give us)
- Self-hosted backend in the same compose; backend swappable later without app changes
- Zero behavioral change when `OTEL_EXPORTER_OTLP_ENDPOINT` is unset

**Non-Goals:**
- Browser/SPA telemetry (deferred: authenticated OTLP relay, pre-login error capture, RUM)
- Alerting (deferred)
- Server-side identity stamping of telemetry, PII scrubbing pipelines
- High-availability / production-hardening of the observability stack

## Decisions

### D1 — Backend: `grafana/otel-lgtm` with its embedded collector, deployed standalone (no dedicated collector, no co-location)
- **Chosen**: one LGTM container per host, in its own compose project (`obs/compose.yaml`) — the OTel best practice of a single observability backend that every app instance exports to. The app compose joins the stack's shared `telemetry` Docker network; host-run dev instances use the loopback-published `127.0.0.1:4318`. Instances distinguish themselves via `OTEL_SERVICE_NAME` and `OTEL_RESOURCE_ATTRIBUTES` (`deployment.environment.name`).
- **Why not a dedicated collector**: adds one hop and a config surface that, at this scale, buys nothing yet. Decoupling is preserved anyway: the app only knows `OTEL_EXPORTER_OTLP_ENDPOINT`, so adding one later (or swapping the whole backend) is an env/compose change, never an app change.
- **Why not co-located in the app compose (original choice, revised)**: the LGTM stack is host infrastructure, not an app dependency — co-locating couples the app's lifecycle to monitoring, prevents dev/test instances from sharing the same backend, and re-deploys monitoring whenever the app rebuilds.
- **Why not DIY (Prom + Loki + Tempo as separate containers)**: 4–5 services of YAML for the same result; LGTM is the home-lab sweet spot.
- **Why not SaaS**: the app sits on a private network with Pocket-ID auth; self-hosting fits.

### D2 — SDK activation gated on `OTEL_EXPORTER_OTLP_ENDPOINT`
- **Chosen**: telemetry (traces, metrics, OTLP logs) enabled iff the endpoint env var is set. Dev mode = endpoint unset = no SDK exporters.
- **Why not `NODE_ENV` gating**: prod-without-stack should stay quiet too; endpoint presence is the honest signal of "there is a collector to talk to". OTel SDKs also honor `OTEL_SDK_DISABLED` natively if ever needed.
- **Failure posture**: exporters are batched and best-effort; collector unreachable → export errors logged, serving unaffected.

### D3 — Bootstrap order: telemetry must evaluate before Express *loads*
- The NodeSDK must install its module-patching hook (`require-in-the-middle`) before `http`/`express` are loaded, or no spans/metrics are ever produced.
- **Bundling caveat found during implementation**: esbuild hoists all external imports of a chunk above inline code, which *flattens* the source import order — `startTelemetry()` ran after express had already loaded `http`, silently disabling all instrumentation (SDK started, globals registered, zero exports).
- **Chosen mechanism**: build `server/telemetry.ts` into its own chunk (`dist/telemetry.mjs`) and inject `import "./telemetry.mjs";` as the *first* statement of `dist/server.mjs` via an esbuild banner. ESM evaluates imports in declaration order, so the SDK boots before every app import — restoring the ordering guarantee the flat bundle lost.
- `dist/logger.js` is a third shared chunk (imported by both telemetry and server chunks) so the process holds exactly ONE pino instance; two instances would duplicate every log line into the OTLP pipeline.
- Service name via `OTEL_SERVICE_NAME` (default `brick-tracker`). OTel diagnostics and export failures are routed into the structured logger (`diag.setLogger` + `setGlobalErrorHandler`) so a dead collector is visible in logs without ever blocking serving.

### D4 — Logging: pino dual-sink
- **Chosen**: pino as the single logger. Dev (endpoint unset): `pino-pretty` to stdout only. Production: single-line JSON to stdout **plus** OTLP log export via pino's OTLP transport.
- **Why stdout JSON always**: `docker logs` keeps working even with the stack down; the OTLP transport is belt-and-braces, not the source of truth.
- **Why not stdout + filelog receiver scraping Docker logs**: requires host-level Docker log access wired into a collector container — more plumbing for the same data.
- **Bundling note**: esbuild `packages: "external"` means the worker-thread transport resolves from real node_modules at runtime — the known pino-transports-in-bundles pitfall does not apply. Verify once at build time anyway.
- **Correlation**: a small middleware on the API app creates `req.log = logger.child({ trace_id })` from the active span context, so every log line in a request carries its trace id (when telemetry is on).

### D5 — SQLite: transparent slow-query wrapper (no spans inside)
- `better-sqlite3` is synchronous native code with no OTel instrumentation; DB calls cannot appear as child spans automatically.
- **Chosen**: wrap `db.prepare(...)` so statement execution is timed (sync semantics and return values unchanged). Executions over `SLOW_QUERY_THRESHOLD_MS` (default 100) emit a `warn` log with duration + truncated SQL text. Bound parameters are **never** logged (privacy/noise).
- **Why not manual spans around handlers**: redundant with the Express instrumentation that already times the whole request; the log-based slow-query signal is what's actually missing.
- Transactions (`db.transaction`) pass through untouched in v1; their slowness surfaces at the request-span level.

### D6 — Infra wiring
- **Observability stack** (`obs/compose.yaml`): `lgtm` service (`grafana/otel-lgtm`), `lgtm-data` volume (Prometheus/Loki/Tempo persistence), networks: `telemetry` (created here; shared with apps) + `caddy_public` (UI route). Collector ports 4317/4318 are **not** published to the host except `127.0.0.1:4318` for host-run dev instances; Caddy must never route them.
- **App compose**: joins `caddy_public` + external `telemetry` network; `OTEL_EXPORTER_OTLP_ENDPOINT` defaults to `http://lgtm:4318`. Grafana admin credentials live in `obs/.env`.
- **Preprod** (`compose.preprod.yaml`, run with `-p brick-preprod`): an isolated second app instance for testing — own container name, port 5173 (the dev-mode port), own data volume, `deployment.environment.name=preprod` via `OTEL_RESOURCE_ATTRIBUTES` (service.name stays stable). It deliberately runs **no observability**: one LGTM instance serves every environment, per the OTel best practice. Distinguish-environment attributes over distinct service names, so Grafana dashboards can compare the same service across environments.
- The Caddy route for the Grafana UI lives in the user's reverse-proxy config (outside this repo) — documented in `.env.example` comments / README touch-up, not coded here.

### D7 — Environment contract
| Variable | Meaning | Default behavior when unset |
|---|---|---|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP base endpoint (collector) | telemetry fully off |
| `OTEL_SERVICE_NAME` | resource name of the app | `brick-tracker` |
| `LOG_LEVEL` | pino level | `info` |
| `SLOW_QUERY_THRESHOLD_MS` | slow-statement warning threshold | `100` |

## Risks / Trade-offs

- **[Express 5 + OTel express instrumentation maturity]** → Verify early in implementation that spans carry `http.route` for Express 5; if route attributes are missing, fall back to relying on `http`-level spans only (still gives status codes + durations).
- **[Bundling order breaks instrumentation]** → *Confirmed and fixed during implementation.* esbuild's import hoisting disabled all instrumentation silently. The 3-chunk layout (banner-injected telemetry + shared logger) resolves it; verified end-to-end (spans, RED metrics, logs all exported). Any future change to `build-server.mjs` must preserve the telemetry-first evaluation order.
- **[LGTM image is positioned as dev/demo-grade]** → acceptable for a 3-user app; volumes + the swappable-endpoint design cap the blast radius. If it ever outgrows itself, the backend is a compose change.
- **[Exporter overhead / memory when collector is slow]** → SDK defaults include batching; at this traffic volume the risk is theoretical. If observed, tune batch size or disable metric exporters selectively.
- **[Log noise regression during pino migration]** → migration is mechanical (same messages, structured form); a grep task verifies no `console.*` remains in `server/`.

## Migration Plan

1. Add dependencies; introduce `server/telemetry.ts` + logger; wrap db; migrate log call sites (all app-behavior-neutral).
2. Extend `compose.yaml` + `.env.example`; bring up the stack; point the app's endpoint env at the embedded collector.
3. Verify: traces/metrics/logs visible in Grafana; kill the grafana container → app keeps serving; recreate it → data persisted.
4. **Rollback**: unset `OTEL_EXPORTER_OTLP_ENDPOINT` (app reverts to plain stdout behavior) and/or remove the grafana service. No data migrations, no API changes — rollback is configuration-only.

## Open Questions

- Hostname to use for the Grafana UI under Caddy (user's infra; outside the repo).
- Grafana admin password provisioning: plain env var in `.env` (fine for a private box) vs secrets file — pick at implementation time, default to `.env`.

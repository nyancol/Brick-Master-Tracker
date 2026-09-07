## Context

`server/telemetry.ts` builds its OTel `Resource` with only `service.name` (`service.name=OTEL_SERVICE_NAME||brick-tracker`). Environment identity (`deployment.environment.name`) is left entirely to the operator via `OTEL_RESOURCE_ATTRIBUTES`, and `service.version` is never set despite being available in `package.json`. Multiple instances (prod/preprod/dev) therefore depend on operators getting env vars right in every compose file and host-run setup.

Shutdown is unhandled: `sdk.start()` is called with no `SIGTERM`/`SIGINT` hook and no `sdk.shutdown()`. On container stop/restart, in-flight spans, metric batches, and the periodic metric exporter's final interval are dropped. The pino OTLP log transport (`server/logger.ts`) batches independently of the SDK, so log loss on shutdown is a related concern.

Dependencies are mixed across major lines: `@opentelemetry/api@1.9` against `@opentelemetry/core@2.11` / `@opentelemetry/sdk-metrics@2.11` / `@opentelemetry/sdk-node@0.222` / exporters `@0.222`, plus `@opentelemetry/semantic-conventions@1.43` whose root import is the deprecated path (stable attributes now live in the `-stable` package / `stable_attributes` entry).

## Goals / Non-Goals

**Goals:**
- Resource is complete in code: `service.name`, `service.version`, `deployment.environment.name` always present on every signal.
- Process termination flushes telemetry with a bounded timeout; normal request serving is unaffected.
- OTel dependencies resolve to one tested, mutually-compatible line; deprecated semconv import is gone.

**Non-Goals:**
- No new signals, instruments, or manual spans (metrics gap and SQLite blindness stay out of scope — separate change).
- No frontend telemetry, no sampler configuration, no collector/backend changes.
- No dashboard or alert provisioning.

## Decisions

**1. Set `service.version` from `package.json` at startup.**
Read the version once in `server/telemetry.ts` (import from `../package.json`, same pattern as `server/app.ts`). Rationale: version is already the source of truth for the API docs; zero new env vars, automatically correct on every release. Alternative (new `OTEL_SERVICE_VERSION` env var) rejected: extra operator surface for a value the repo already knows.

**2. Resolve `deployment.environment.name` in code with operator override winning.**
Precedence: explicit `deployment.environment.name` inside `OTEL_RESOURCE_ATTRIBUTES` (parsed, not overwritten) → `APP_ENV` via existing `getAppEnvironment()` (`dev|staging|production`) → default `dev`. Keep the app's `dev` spelling (not OTel's `development`) so existing Grafana filters and the `telemetry-backend` docs keep working. Use the stable attribute key `deployment.environment.name` (`ATTR_DEPLOYMENT_ENVIRONMENT_NAME`). Alternative (rename to spec enum `development`) rejected: breaks existing backend filters for no query benefit, since the value is free-form.

**3. Keep SDK env-resource merging intact.**
Build the code resource with `resourceFromAttributes(...)` and let the SDK's default env detector merge `OTEL_RESOURCE_ATTRIBUTES` (do not disable default detectors). Explicit parse in decision 2 exists only to supply the fallback when the operator sets nothing. Alternative (manual merge of the full env string) rejected: duplicates SDK behavior and risks dropping other operator-set attributes.

**4. Replace `@opentelemetry/semantic-conventions` with `@opentelemetry/semantic-conventions-stable`.**
Import `ATTR_SERVICE_NAME`, `ATTR_SERVICE_VERSION`, `ATTR_DEPLOYMENT_ENVIRONMENT_NAME` from the stable package. Rationale: the current root import is the deprecated path; the stable package is the documented successor and matches the installed SDK 2.x line. Fallback if the stable package conflicts with the resolved version line: use plain string keys (`service.name`, etc.) and drop the dependency — keys are stable by spec.

**5. Export a bounded `shutdownTelemetry()` and wire `SIGTERM`/`SIGINT` in `server/index.ts`.**
`server/telemetry.ts` exports `shutdownTelemetry(): Promise<void>` calling `sdk.shutdown()` with a ~5s timeout race; `server/index.ts` registers one-shot `SIGTERM`/`SIGINT` handlers that close the HTTP server, await telemetry shutdown, then exit (non-zero on timeout still exits, never hangs a deploy). No-op when telemetry is disabled. Rationale: `sdk.shutdown()` flushes spans and the periodic metric reader — the documented flush path — while the timeout preserves fast container stops. Alternative (rely on export intervals only) rejected: loses the tail of every deployment.

**6. Align versions with one `pnpm update` to the latest mutually-compatible line, then pin by lockfile.**
Target shape: single OTel JS release line (e.g. `sdk-node`/`exporters` `0.2xx` + `core`/`sdk-metrics`/`resources` `2.x` + `api` `1.9.x`, per the OTel JS release matrix — `api` major staying `1.x` is expected, not skew). Verify with `pnpm install`, `tsc --noEmit`, build, and a boot check with/without `OTEL_EXPORTER_OTLP_ENDPOINT`. Rationale: lockfile, not hand-picked ranges, is the alignment guarantee.

## Risks / Trade-offs

- [Risk] `sdk.shutdown()` hangs on unreachable collector → Mitigation: `Promise.race` with ~5s timeout; always `process.exit`.
- [Risk] Pino OTLP log transport batches outside the SDK, so `sdk.shutdown()` may not flush trailing logs → Mitigation: document as best-effort; shutdown HTTP server first so request logs complete, accept possible loss of the final shutdown line.
- [Risk] Double-signal or test-harness `SIGINT` triggers shutdown path unexpectedly → Mitigation: one-shot handlers (`once`), no-op when telemetry disabled.
- [Risk] Stable semconv package version conflicts with SDK line → Mitigation: fallback to string-literal resource keys (spec-stable), no behavior change.
- [Risk] `dev` vs spec-enum `development` confuses future OTel purists → Mitigation: documented explicitly in `.env.example`; value is free-form per spec.

## Migration Plan

1. Deploy normally (no operator action). Code-set resource attributes appear on new spans/metrics/logs; old env-only attributes unchanged where operators already set them.
2. Rollback: revert the image; no schema, volume, or collector changes to undo.

## Open Questions

- None. Timeout value (~5s) is set in implementation; adjustable via env later if deploys complain.

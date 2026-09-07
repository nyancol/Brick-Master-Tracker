## Why

Telemetry is under-identified and lossy: resources carry only `service.name`, shutdown drops in-flight spans/metrics/logs, and `@opentelemetry/api@1.9` is skewed against SDK `2.11` / exporters `0.222`, risking subtle incompatibility.

## What Changes

- Enrich the OTel `Resource` in code with `service.version` (from `package.json`) and `deployment.environment.name` (from `APP_ENV`/`OTEL_RESOURCE_ATTRIBUTES`, with a sane default), keeping `service.name` stable.
- Add graceful shutdown: flush/close the SDK (traces, metrics, logs) on `SIGTERM`/`SIGINT` before process exit, without changing request-serving behavior.
- Align OTel dependency versions to a single tested line and replace the deprecated `semantic-conventions` import with its stable successor.
- Document the effective resource attributes and shutdown behavior in `.env.example` / README where they affect operators.

## Capabilities

### New Capabilities
- None — no new product capability; this is conformance hardening.

### Modified Capabilities
- `server-telemetry`: resource attributes are complete in code; SDK shuts down cleanly on termination; OTel dependency line is aligned.
- `telemetry-backend`: operator docs reflect the code-set `deployment.environment.name` fallback and version line.

## Impact

- Code: `server/telemetry.ts`, `server/index.ts` (signal wiring), `package.json` / `pnpm-lock.yaml` (version alignment), `.env.example` docs.
- No API, DB schema, UI, or i18n changes. No new exporter endpoints or ports.
- Risk is low: endpoint-gating and failure-isolation behavior unchanged; shutdown path must not delay deploys (bounded timeout).

## 1. Dependency alignment

- [x] 1.1 Replace `@opentelemetry/semantic-conventions` with `@opentelemetry/semantic-conventions-stable` in `package.json` and `server/telemetry.ts` imports (fallback to string-literal keys if version conflict)
- [x] 1.2 Run `pnpm update` scoped to `@opentelemetry/*` to a single compatible line, then `pnpm install` and `tsc --noEmit` clean

## 2. Resource enrichment

- [x] 2.1 Set `service.version` from `package.json` in the `server/telemetry.ts` resource
- [x] 2.2 Resolve `deployment.environment.name` with precedence explicit `OTEL_RESOURCE_ATTRIBUTES` → `APP_ENV` (`getAppEnvironment()`) → `dev`, keeping default SDK env-detector merging enabled

## 3. Graceful shutdown

- [x] 3.1 Export bounded `shutdownTelemetry()` (~5s timeout race around `sdk.shutdown()`, no-op when disabled) from `server/telemetry.ts`
- [x] 3.2 Wire one-shot `SIGTERM`/`SIGINT` handlers in `server/index.ts` (close HTTP server, await telemetry shutdown, always exit)

## 4. Operator docs

- [x] 4.1 Document code-set `service.version` and `deployment.environment.name` fallback precedence in `.env.example`

## 5. Verification

- [x] 5.1 `tsc --noEmit`, build, boot with and without `OTEL_EXPORTER_OTLP_ENDPOINT`
- [x] 5.2 Verify resource attributes on exported spans and `SIGTERM` flush/exit within timeout

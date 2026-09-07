## 1. Metrics module

- [x] 1.1 Create `server/metrics.ts` with singleton Meter, RED instruments (`http.server.request.duration`, `http.server.request.count`) and domain counters (`auth.login.count`, `brick.transfer.count`, `brick.seize.count`, `site.visit.count`), no-op when telemetry disabled
- [x] 1.2 Ensure `server/telemetry.ts` MeterProvider path is shared via the global metrics API so both esbuild chunks use one provider

## 2. RED middleware

- [x] 2.1 Add post-`finish` middleware on the API app recording duration (seconds) + count with templated `http.route`, `http.request.method`, `http.response.status_code` (`unknown` fallback)

## 3. Domain increments

- [x] 3.1 Increment `auth.login.count{method,outcome}` after session-save callback in OIDC and dev login paths
- [x] 3.2 Increment `brick.transfer.count{color,outcome}` and `brick.seize.count{outcome}` only after transaction commit or validation rejection
- [x] 3.3 Increment `site.visit.count{counted}` on the counted vs deduped branches of `POST /visits`

## 4. Verification

- [x] 4.1 `tsc --noEmit`, build, boot with and without `OTEL_EXPORTER_OTLP_ENDPOINT`
- [x] 4.2 Verify via in-memory metric reader: RED split by route/status, session/action counters, no high-cardinality labels

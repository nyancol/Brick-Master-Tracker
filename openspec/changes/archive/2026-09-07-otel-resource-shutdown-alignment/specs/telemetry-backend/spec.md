## ADDED Requirements

### Requirement: Code-set resource fallback is documented
`.env.example` SHALL document that `service.version` and the `deployment.environment.name` fallback (`OTEL_RESOURCE_ATTRIBUTES` override → `APP_ENV` → `dev`) are set in code, so operators know explicit `OTEL_RESOURCE_ATTRIBUTES` is only needed to override the default.

#### Scenario: Operator reads telemetry docs
- **WHEN** an operator reads the observability section of `.env.example`
- **THEN** the fallback precedence for `deployment.environment.name` and the automatic `service.version` are described without requiring code reading

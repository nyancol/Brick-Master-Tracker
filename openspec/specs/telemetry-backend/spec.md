# Telemetry Backend

## Purpose

Standalone observability stack (grafana/otel-lgtm) deployable independently of the app, with OTLP ingestion over a shared Docker network, multi-environment instance identification, persistent storage, and Grafana exposed through the reverse proxy.

## Requirements

### Requirement: Standalone observability stack for the host
The observability stack (grafana/otel-lgtm: embedded OTel collector, Prometheus, Loki, Tempo, Grafana) SHALL be deployable independently of the app via its own compose project (`obs/compose.yaml`), on a `telemetry` Docker network that apps join. Its embedded collector SHALL accept OTLP from containers on that network (e.g. `http://lgtm:4318`) and OTLP/HTTP additionally on host loopback (`127.0.0.1:4318`) for host-run development instances. Collector ports MUST NOT be published beyond loopback or routed through the reverse proxy.

#### Scenario: App container reaches the collector over the shared network
- **WHEN** the observability stack is up and the app container is configured with `OTEL_EXPORTER_OTLP_ENDPOINT=http://lgtm:4318` on the `telemetry` network
- **THEN** telemetry exported by the app is accepted by the embedded collector

#### Scenario: Host-run dev instance reaches the collector on loopback
- **WHEN** a development instance runs directly on the host with `OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318`
- **THEN** its telemetry is accepted by the embedded collector

#### Scenario: Collector is not exposed beyond loopback
- **WHEN** the observability stack is running
- **THEN** 4317/4318 are bound to 127.0.0.1 only (or unreachable from the host entirely), and no Caddy route targets them

### Requirement: Instances are distinguishable in the backend
Multiple app instances (production, development, preprod, test) MAY export to the same collector, and SHALL be distinguishable in the backend via the `service.name` resource attribute (`OTEL_SERVICE_NAME`) and an environment resource attribute (`OTEL_RESOURCE_ATTRIBUTES=deployment.environment.name=<env>`).

#### Scenario: Dev and prod instances are told apart
- **WHEN** a production instance (`service.name=brick-tracker`, `deployment.environment.name=production`) and a dev instance (different environment attribute) both export telemetry
- **THEN** the backend can filter traces/metrics/logs per environment

### Requirement: Preprod deployments reuse the standalone observability stack
A preprod deployment of the app (used for testing) SHALL NOT run its own observability stack: it SHALL export telemetry to the independently running LGTM instance over the shared `telemetry` network (`http://lgtm:4318`), identified by `deployment.environment.name=preprod` while keeping `service.name` stable. The preprod instance SHALL be isolated from production so both can run simultaneously: its own container name, a host port distinct from production's, and its own data volume.

#### Scenario: Preprod telemetry lands in the shared backend
- **WHEN** the app is deployed in preprod (via `compose.preprod.yaml`) with the observability stack running
- **THEN** its traces, metrics, and logs appear in the shared Grafana backend and are filterable by `deployment.environment.name=preprod`

#### Scenario: Preprod and production run simultaneously without conflict
- **WHEN** production (port 5000, container `brick-tracker`) and preprod (port 5173, container `brick-tracker-preprod`) are both deployed
- **THEN** neither deployment's containers, ports, nor data collide, and each exports telemetry to the same collector

#### Scenario: Preprod data is isolated from production
- **WHEN** test traffic is generated against the preprod instance
- **THEN** production data (database, uploads, counters) is unaffected

### Requirement: Telemetry data survives restarts
Prometheus, Loki, and Tempo data SHALL live on a Docker volume so dashboards and history survive container recreation.

#### Scenario: Recreate keeps history
- **WHEN** the lgtm service is stopped and recreated
- **THEN** previously ingested metrics/logs/traces are still queryable

### Requirement: Grafana UI exposed through the reverse proxy
The lgtm service SHALL join the existing `caddy_public` network so the Grafana UI can be routed through Caddy like the other services, protected by Grafana's own authentication.

#### Scenario: UI reachable via reverse proxy
- **WHEN** Caddy is configured with a route to the lgtm service
- **THEN** a browser can reach the Grafana login page through the reverse proxy

### Requirement: Compose wiring is documented and configurable
The telemetry-related environment variables (`OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, `OTEL_RESOURCE_ATTRIBUTES`, `LOG_LEVEL`, `SLOW_QUERY_THRESHOLD_MS`) SHALL be documented in `.env.example`, and the app compose SHALL pass the OTLP endpoint to the app container.

#### Scenario: A new deployment can enable telemetry from env alone
- **WHEN** an operator copies `.env.example`, fills in the telemetry variables, and runs `docker compose up`
- **THEN** the app exports telemetry to the standalone collector without any code changes

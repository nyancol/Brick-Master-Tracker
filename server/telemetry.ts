/**
 * OpenTelemetry bootstrap. This module MUST be imported before any other
 * server module (ESM evaluates imports in declaration order) so the
 * instrumentation can patch `http` and Express before they are used.
 *
 * Telemetry is active only when OTEL_EXPORTER_OTLP_ENDPOINT is configured
 * (and not disabled via OTEL_SDK_DISABLED=true). Without it the module is a
 * no-op: no exporters, no background traffic, unchanged stdout behavior.
 *
 * The OTLP exporters read the endpoint from the environment themselves:
 * OTEL_EXPORTER_OTLP_ENDPOINT (base URL, e.g. http://grafana:4318) — signal
 * paths /v1/traces and /v1/metrics are appended per the OTel spec, and
 * signal-specific overrides (OTEL_EXPORTER_OTLP_TRACES_ENDPOINT etc.) win.
 */
import { NodeSDK } from "@opentelemetry/sdk-node";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { diag, DiagLogLevel, type DiagLogger } from "@opentelemetry/api";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { setGlobalErrorHandler } from "@opentelemetry/core";
import logger from "./logger.js";

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

export function isTelemetryEnabled(): boolean {
  return Boolean(otlpEndpoint) && process.env.OTEL_SDK_DISABLED !== "true";
}

function startTelemetry(): void {
  if (!isTelemetryEnabled()) return;

  // Surface OTel diagnostics and export failures through the structured
  // logger instead of letting them vanish (the default global error handler
  // is a no-op in practice) — without ever blocking request handling.
  diag.setLogger(
    {
      debug: logger.debug.bind(logger),
      info: logger.info.bind(logger),
      warn: logger.warn.bind(logger),
      error: logger.error.bind(logger),
    } as DiagLogger,
    DiagLogLevel.WARN,
  );
  setGlobalErrorHandler((err) => logger.error({ err }, "OpenTelemetry error"));

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "brick-tracker",
  });

  const sdk = new NodeSDK({
    resource,
    traceExporter: new OTLPTraceExporter(),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter(),
    }),
    instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
  });

  sdk.start();
  logger.info(`OpenTelemetry enabled — exporting to ${otlpEndpoint}`);
}

startTelemetry();

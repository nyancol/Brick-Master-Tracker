/**
 * Structured application logging (pino).
 *
 * Output modes:
 * - OTEL_EXPORTER_OTLP_ENDPOINT set: single-line JSON on stdout AND export
 *   as OTLP logs (OTLP/HTTP) to the collector. Used in production.
 * - endpoint unset, NODE_ENV=production: JSON on stdout only.
 * - endpoint unset, otherwise (local dev): pretty-printed stdout.
 *
 * This module is built as its own chunk (dist/logger.js) so that the
 * telemetry bootstrap chunk and the server chunk share ONE pino instance —
 * a second instance would duplicate every log line into the OTLP pipeline.
 */
import pino from "pino";

const level = process.env.LOG_LEVEL || "info";
const serviceName = process.env.OTEL_SERVICE_NAME || "brick-tracker";

function logsEndpoint(): string | undefined {
  const explicit = process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT;
  if (explicit) return explicit;
  const base = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!base) return undefined;
  const trimmed = base.replace(/\/+$/, "");
  return trimmed.endsWith("/v1/logs") ? trimmed : `${trimmed}/v1/logs`;
}

function buildTransport():
  | pino.TransportSingleOptions
  | pino.TransportMultiOptions
  | undefined {
  const endpoint = logsEndpoint();

  if (endpoint) {
    return {
      targets: [
        { target: "pino/file", options: { destination: 1 }, level },
        {
          target: "pino-opentelemetry-transport",
          level,
          options: {
            loggerName: serviceName,
            resourceAttributes: { "service.name": serviceName },
            logRecordProcessorOptions: {
              recordProcessorType: "batch",
              exporterOptions: {
                protocol: "http",
                httpExporterOptions: { url: endpoint },
              },
            },
          },
        },
      ],
    };
  }

  if (process.env.NODE_ENV === "production") return undefined;

  return {
    target: "pino-pretty",
    options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" },
  };
}

const transport = buildTransport();

const logger = pino(
  {
    level,
    serializers: { err: pino.stdSerializers.err },
  },
  transport ? pino.transport(transport) : undefined,
);

export default logger;

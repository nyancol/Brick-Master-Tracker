/**
 * Application metrics — singleton Meter and typed helpers.
 *
 * Instruments are created once at module load via the global metrics API,
 * so the SDK-owned MeterProvider (created in server/telemetry.ts, possibly
 * in the separate dist/telemetry.mjs chunk) is shared without a direct
 * SDK import across chunks. When telemetry is disabled the helpers are
 * no-ops, so call sites stay unconditional.
 *
 * Cardinality rules: fixed label sets only — no user IDs, names, SQL text,
 * or free text on any instrument.
 */
import { metrics, type Counter, type Histogram } from "@opentelemetry/api";
import { isTelemetryEnabled } from "./telemetry.js";

const meter = metrics.getMeter("brick-tracker");

function noopCounter(): Counter {
  return { add: () => {} } as unknown as Counter;
}

function noopHistogram(): Histogram {
  return { record: () => {} } as unknown as Histogram;
}

const enabled = isTelemetryEnabled();

export const httpRequestDuration: Histogram = enabled
  ? meter.createHistogram("http.server.request.duration", {
      description: "HTTP request duration",
      unit: "s",
    })
  : noopHistogram();

export const httpRequestCount: Counter = enabled
  ? meter.createCounter("http.server.request.count", {
      description: "HTTP request count",
    })
  : noopCounter();

export const authLoginCount: Counter = enabled
  ? meter.createCounter("auth.login.count", {
      description: "Successful and failed logins (sessions created)",
    })
  : noopCounter();

export const brickTransferCount: Counter = enabled
  ? meter.createCounter("brick.transfer.count", {
      description: "Brick transfers by color and outcome",
    })
  : noopCounter();

export const brickSeizeCount: Counter = enabled
  ? meter.createCounter("brick.seize.count", {
      description: "Blue brick seizures by outcome",
    })
  : noopCounter();

export const siteVisitCount: Counter = enabled
  ? meter.createCounter("site.visit.count", {
      description: "Visit requests split by counted vs deduped",
    })
  : noopCounter();

export type HttpMethod = string;

export function recordHttpRequest(
  route: string,
  method: HttpMethod,
  statusCode: number,
  durationSeconds: number,
): void {
  if (!enabled) return;
  const attrs = {
    "http.route": route,
    "http.request.method": method,
    "http.response.status_code": statusCode,
  };
  httpRequestDuration.record(durationSeconds, attrs);
  httpRequestCount.add(1, attrs);
}

export type LoginMethod = "oidc" | "dev";
export type Outcome = "success" | "error";

export function countLogin(method: LoginMethod, outcome: Outcome): void {
  if (!enabled) return;
  authLoginCount.add(1, { method, outcome });
}

export type BrickColor = "red" | "blue";

export function countTransfer(color: BrickColor, outcome: Outcome): void {
  if (!enabled) return;
  brickTransferCount.add(1, { color, outcome });
}

export function countSeize(outcome: Outcome): void {
  if (!enabled) return;
  brickSeizeCount.add(1, { outcome });
}

export function countVisit(counted: boolean): void {
  if (!enabled) return;
  siteVisitCount.add(1, { counted: String(counted) });
}

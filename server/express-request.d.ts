import type { Logger } from "pino";

declare global {
  namespace Express {
    interface Request {
      /**
       * Request-scoped logger (set by the correlation middleware in app.ts).
       * Carries trace_id/span_id bindings when telemetry is active, which
       * links log records to their traces in the observability backend.
       */
      log: Logger;
    }
  }
}

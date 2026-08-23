import express, { type Express } from "express";
import pinoHttp from "pino-http";
import { logger } from "./logger.js";
import { router } from "./routes/index.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
app.use(express.json());

// All API routes are mounted at root. The /api prefix is applied by
// whoever mounts this app: Vite's configureServer in dev, and the
// production entrypoint in ./index.ts.
app.use(router);

export default app;
import { Router, type IRouter } from "express";
import { healthRouter } from "./health.js";
import { bricksRouter } from "./bricks.js";

export const router: IRouter = Router();

router.use(healthRouter);
router.use(bricksRouter);
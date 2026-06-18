import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bricksRouter from "./bricks";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bricksRouter);

export default router;

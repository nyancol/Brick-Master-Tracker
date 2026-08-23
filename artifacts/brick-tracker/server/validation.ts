// zod v4 is used intentionally (pre-release but stable for our use case).
// It provides improved type inference and smaller bundle size.
import { z } from "zod/v4";
import { FRIENDS } from "../shared/constants.js";

/** The two bricks we track. */
export const BrickColor = z.enum(["red", "blue"]);
export type BrickColor = z.infer<typeof BrickColor>;

export { FRIENDS };
export type Friend = (typeof FRIENDS)[number];

/** Health check response. */
export const HealthCheckResponse = z.object({ status: z.string() });

/** Path params for POST /api/bricks/:color/transfer. */
export const TransferBrickParams = z.object({ color: BrickColor });

/** Body for POST /api/bricks/:color/transfer. */
export const TransferBrickBody = z.object({
  to: z.string().refine((v) => (FRIENDS as readonly string[]).includes(v), {
    message: `Must be one of: ${FRIENDS.join(", ")}`,
  }),
});
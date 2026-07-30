import { z } from "zod/v4";

/** The two bricks we track. */
export const BrickColor = z.enum(["red", "blue"]);
export type BrickColor = z.infer<typeof BrickColor>;

/** The friends who can hold a brick. */
export const FRIENDS = ["Yann", "Anselme", "Thomas"] as const;
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
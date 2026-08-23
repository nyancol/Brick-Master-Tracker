/** Shared constants used by both client and server. */
export const FRIENDS = ["Yann", "Anselme", "Thomas"] as const;
export type Friend = (typeof FRIENDS)[number];
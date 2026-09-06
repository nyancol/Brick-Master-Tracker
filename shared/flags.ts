/**
 * Shared feature flag registry — single source of truth for flag keys, value
 * types, and code defaults, used by both the server (evaluation, /api/flags)
 * and the client (typed hooks, fallback defaults).
 *
 * Every default MUST equal the flag-off (current) behavior: when a flag is
 * missing, disabled, or its source is unreachable, the app behaves exactly
 * as if the feature does not exist.
 */
export const FLAGS = {} as Record<string, { type: "boolean"; default: boolean }>;

export type FlagKey = string;
export type FlagValues = Record<string, boolean>;

export const FLAG_DEFAULTS: FlagValues = Object.fromEntries(
  Object.entries(FLAGS).map(([key, def]) => [key, def.default]),
) as FlagValues;

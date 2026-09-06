const VALID_ENVIRONMENTS = new Set(["dev", "staging", "production"]);

export type AppEnvironment = "dev" | "staging" | "production";

export function getAppEnvironment(): AppEnvironment {
  const raw = process.env.APP_ENV ?? "dev";
  return VALID_ENVIRONMENTS.has(raw) ? (raw as AppEnvironment) : "dev";
}

export function isValidEnvironment(raw: string): boolean {
  return VALID_ENVIRONMENTS.has(raw);
}

import { resolve } from "node:path";
import { FlagdProvider } from "@openfeature/flagd-provider";
import { OpenFeature, type Client } from "@openfeature/server-sdk";
import logger from "./logger.js";
import { FLAGS, FLAG_DEFAULTS, type FlagValues } from "../shared/flags.js";

export function initFlags(): void {
  if (process.env.FLAGD_HOST) {
    OpenFeature.setProviderAndWait(new FlagdProvider())
      .then(() =>
        logger.info(
          { provider: "flagd", resolver: "rpc", host: process.env.FLAGD_HOST },
          "Feature flags ready",
        ),
      )
      .catch((err: unknown) =>
        logger.warn(
          { err },
          "Feature flag provider failed to become ready; serving defaults",
        ),
      );
    return;
  }

  const path = resolve("flags/flags.dev.json");
  OpenFeature.setProviderAndWait(
    new FlagdProvider({
      resolverType: "in-process",
      offlineFlagSourcePath: path,
    }),
  )
    .then(() =>
      logger.info(
        { provider: "flagd", resolver: "in-process", path },
        "Feature flags ready",
      ),
    )
    .catch((err: unknown) =>
      logger.warn(
        { err },
        "Feature flag provider failed to become ready; serving defaults",
      ),
    );
}

export function getFlagClient(): Client {
  return OpenFeature.getClient();
}

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

type AnyFlagDef =
  | { type: "boolean"; default: boolean }
  | { type: "string"; default: string }
  | { type: "number"; default: number }
  | { type: "object"; default: JsonValue };

export async function getAllFlagValues(): Promise<FlagValues> {
  const client = getFlagClient();
  const entries = Object.entries(FLAGS) as [string, AnyFlagDef][];
  const evaluated = await Promise.all(
    entries.map(async ([key, def]) => {
      if (def.type === "boolean") {
        return [key, await client.getBooleanValue(key, def.default)] as const;
      }
      if (def.type === "string") {
        return [key, await client.getStringValue(key, def.default)] as const;
      }
      if (def.type === "number") {
        return [key, await client.getNumberValue(key, def.default)] as const;
      }
      return [key, await client.getObjectValue(key, def.default)] as const;
    }),
  );
  return { ...FLAG_DEFAULTS, ...Object.fromEntries(evaluated) } as FlagValues;
}

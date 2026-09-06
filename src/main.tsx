import { createRoot } from "react-dom/client";
import { InMemoryProvider, OpenFeature } from "@openfeature/web-sdk";
import { OpenFeatureProvider } from "@openfeature/react-sdk";
import App from "./App";
import { FLAGS, FLAG_DEFAULTS, type FlagKey, type FlagValues } from "../shared/flags";
import "./index.css";

type FlagValue = boolean | string | number;

interface FlagConfigEntry {
  variants: { current: FlagValue };
  defaultVariant: "current";
  disabled: false;
}

async function loadFlagValues(): Promise<FlagValues> {
  try {
    const res = await fetch("/api/flags", {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const values = (await res.json()) as Partial<FlagValues>;
    return { ...FLAG_DEFAULTS, ...values } as FlagValues;
  } catch {
    return { ...FLAG_DEFAULTS };
  }
}

export async function loadEnvironment(): Promise<string> {
  try {
    const res = await fetch("/api/environment", {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { environment?: string };
    return data.environment ?? "dev";
  } catch {
    return "dev";
  }
}

function toProviderConfig(values: FlagValues): Record<string, FlagConfigEntry> {
  const config: Record<string, FlagConfigEntry> = {};
  for (const key of Object.keys(FLAGS) as FlagKey[]) {
    config[key] = {
      variants: { current: values[key] as FlagValue },
      defaultVariant: "current",
      disabled: false,
    };
  }
  return config;
}

void Promise.all([loadFlagValues(), loadEnvironment()]).then(
  ([values, environment]) => {
    OpenFeature.setProvider(
      new InMemoryProvider(
        toProviderConfig(values) as unknown as ConstructorParameters<
          typeof InMemoryProvider
        >[0],
      ),
    );

    createRoot(document.getElementById("root")!).render(
      <OpenFeatureProvider>
        <App environment={environment} />
      </OpenFeatureProvider>,
    );
  },
);

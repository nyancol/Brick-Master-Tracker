import { t } from "@/hooks/use-translation";

const KNOWN = new Set(["dev", "staging", "production"]);

export default function EnvironmentBadge({ environment }: { environment: string }) {
  if (environment === "production") return null;
  const label = KNOWN.has(environment)
    ? t(`env.${environment}` as Parameters<typeof t>[0])
    : environment;
  return (
    <div
      className="env-badge inline-flex items-center px-2 py-0.5 text-xs font-mono uppercase tracking-wider opacity-60"
      title={label}
    >
      {label}
    </div>
  );
}

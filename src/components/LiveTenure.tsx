import { useEffect, useState } from "react";
import { formatTenure } from "@/lib/tenure";
import { getLanguage } from "@/hooks/use-translation";

interface Props {
  closedMs: number;
  sinceMs: number;
  className?: string;
}

export default function LiveTenure({ closedMs, sinceMs, className }: Props) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const totalMs = Math.max(0, closedMs + Math.max(0, Date.now() - sinceMs));
  return <span className={className}>{formatTenure(totalMs, getLanguage())}</span>;
}

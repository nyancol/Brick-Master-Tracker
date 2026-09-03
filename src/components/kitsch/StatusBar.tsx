import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatusBarProps {
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export default function StatusBar({ left, right, className }: StatusBarProps) {
  return (
    <div
      className={cn(
        "bevel-in mt-1.5 flex items-center justify-between gap-2 bg-card px-2 py-0.5 font-mono text-[10px] text-muted-foreground",
        className,
      )}
    >
      <span className="min-w-0 truncate">{left}</span>
      <span className="shrink-0 whitespace-nowrap">{right}</span>
    </div>
  );
}

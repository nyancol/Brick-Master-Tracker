import { cn } from "@/lib/utils";

const paths: Record<string, string> = {
  "top-left": "M2 12V2h10M2 2l20 20",
  "top-right": "M22 12V2H12M22 2L2 22",
  "bottom-left": "M2 12v10h10M2 22l20-20",
  "bottom-right": "M22 12v10H12M22 22L2 2",
};

const sizeMap = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

interface Props {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Ornament({ position, size = "md", className }: Props) {
  return (
    <svg
      className={cn(
        "absolute pointer-events-none text-gold",
        position.includes("top") ? "top-0" : "bottom-0",
        position.includes("left") ? "left-0" : "right-0",
        sizeMap[size],
        className,
      )}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d={paths[position]} />
    </svg>
  );
}
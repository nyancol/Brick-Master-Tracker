import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-sm border bg-card text-card-foreground shadow outline outline-1 outline-border -outline-offset-1",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export { Card };
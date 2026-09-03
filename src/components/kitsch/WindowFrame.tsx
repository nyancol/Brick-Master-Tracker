import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { t } from "@/hooks/use-translation";
import { useToast } from "@/hooks/use-toast";

interface WindowFrameProps {
  title: string;
  icon?: { src: string; alt?: string };
  titleBarClassName?: string;
  titleTextClassName?: string;
  suffix?: ReactNode;
  onClose?: () => void;
  refuseToastTitle?: string;
  statusBar?: ReactNode;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}

export default function WindowFrame({
  title,
  icon,
  titleBarClassName,
  titleTextClassName,
  suffix,
  onClose,
  refuseToastTitle,
  statusBar,
  className,
  contentClassName,
  children,
}: WindowFrameProps) {
  const { toast } = useToast();
  const [shaking, setShaking] = useState(false);

  const handleClose = () => {
    if (onClose) {
      onClose();
      return;
    }
    if (shaking) return;
    setShaking(true);
    if (refuseToastTitle) {
      toast({ title: refuseToastTitle });
    }
  };

  const minimizeTip = t("window.minimize");
  const maximizeTip = t("window.maximize");
  const closeTip = t("window.close");

  return (
    <div
      className={cn("bevel bg-muted p-1.5", shaking && "window-shaking", className)}
      onAnimationEnd={() => setShaking(false)}
    >
      <div
        className={cn(
          "bevel-in mb-1.5 flex items-center gap-2 px-2 py-1",
          titleBarClassName,
        )}
      >
        {icon && (
          <img
            src={icon.src}
            alt={icon.alt ?? ""}
            width={81}
            height={109}
            className="h-5 w-auto shrink-0"
          />
        )}
        <span
          className={cn(
            "min-w-0 truncate font-display text-lg leading-none",
            titleTextClassName,
          )}
        >
          {title}
        </span>
        {suffix && <span className="ml-auto shrink-0 pl-2">{suffix}</span>}
        <div
          className={cn(
            "flex shrink-0 items-center gap-1",
            !suffix && "ml-auto",
          )}
        >
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            data-tip={minimizeTip}
            className="win-btn bevel bg-card text-card-foreground"
          >
            _
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            data-tip={maximizeTip}
            className="win-btn bevel bg-card text-card-foreground"
          >
            □
          </button>
          <button
            type="button"
            onClick={handleClose}
            aria-label={closeTip}
            data-tip={closeTip}
            className="win-btn bevel bg-card text-card-foreground"
          >
            ✕
          </button>
        </div>
      </div>
      <div className={cn("bevel-in bg-card", contentClassName)}>{children}</div>
      {statusBar}
    </div>
  );
}

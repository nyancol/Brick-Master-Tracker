import { useMemo } from "react";
import { t } from "@/hooks/use-translation";

const BASE = 41000;

function readVisitCount(): number {
  try {
    const stored = localStorage.getItem("visits");
    const next = (stored ? parseInt(stored, 10) : 0) + 1;
    localStorage.setItem("visits", String(next));
    return next;
  } catch {
    return 1;
  }
}

export default function VisitorCounter() {
  const visits = useMemo(readVisitCount, []);
  const digits = String(BASE + visits).padStart(7, "0").split("");

  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-sm">{t("footer.counterLabel")}</span>
      <span className="odometer" aria-label={`${BASE + visits}`}>
        {digits.map((d, i) => (
          <span key={i} className="odometer-cell">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

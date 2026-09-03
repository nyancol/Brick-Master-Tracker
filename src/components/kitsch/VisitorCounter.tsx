import { useEffect, useState } from "react";
import { registerVisit } from "@/api";
import { t } from "@/hooks/use-translation";

export default function VisitorCounter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    registerVisit()
      .then(setCount)
      .catch(() => {});
  }, []);

  const digits = String(count).padStart(7, "0").split("");

  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-sm">{t("footer.counterLabel")}</span>
      <span className="odometer" aria-label={`${count}`}>
        {digits.map((d, i) => (
          <span key={i} className="odometer-cell">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

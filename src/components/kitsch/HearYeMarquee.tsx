import type { Transfer } from "@/api";
import { t } from "@/hooks/use-translation";

interface Props {
  transfers: Transfer[] | undefined;
  loading?: boolean;
}

export default function HearYeMarquee({ transfers, loading }: Props) {
  let message: string;
  const latest = transfers?.[0];

  if (loading) {
    message = t("loading");
  } else if (latest) {
    const brickName =
      latest.color === "red" ? t("honor.name") : t("shame.name");
    message =
      latest.fromName == null
        ? t("marquee.forged")
            .replace("{brick}", brickName)
            .replace("{to}", latest.toName)
        : t("marquee.template")
            .replace("{brick}", brickName)
            .replace("{from}", latest.fromName)
            .replace("{to}", latest.toName);
  } else {
    message = t("marquee.empty");
  }

  return (
    <div
      className="bevel-in kitsch-marquee bg-card text-card-foreground px-3 py-1.5 font-mono text-sm tracking-wide"
      role="marquee"
      aria-label={message}
    >
      <span>
        ✦ {message} ✦&nbsp;&nbsp;&nbsp;&nbsp;✦ {message} ✦
      </span>
    </div>
  );
}

import type { Transfer } from "@/api";
import { t } from "@/hooks/use-translation";

interface Props {
  transfers: Transfer[] | undefined;
  loading?: boolean;
}

function HornHerald({ mirrored }: { mirrored?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={mirrored ? "-scale-x-100" : undefined}
    >
      <img
        src="/gifs/horn-herald.gif"
        alt=""
        width={122}
        height={113}
        className="marquee-horn marquee-horn--animated"
      />
      <img
        src="/gifs/horn-herald-static.png"
        alt=""
        width={122}
        height={113}
        className="marquee-horn marquee-horn--static"
      />
    </span>
  );
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
    <div className="flex items-center gap-1.5" role="marquee" aria-label={message}>
      <HornHerald />
      <div className="bevel-in kitsch-marquee min-w-0 flex-1 bg-card text-card-foreground px-3 py-1.5 font-mono text-sm tracking-wide">
        <span>
          ✦ {message} ✦&nbsp;&nbsp;&nbsp;&nbsp;✦ {message} ✦
        </span>
      </div>
      <HornHerald mirrored />
    </div>
  );
}

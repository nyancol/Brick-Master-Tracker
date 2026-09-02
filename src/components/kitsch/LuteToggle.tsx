import { useLute } from "@/hooks/use-lute";
import { t } from "@/hooks/use-translation";

export default function LuteToggle() {
  const { playing, toggle } = useLute();

  return (
    <button
      onClick={toggle}
      aria-label={playing ? t("lute.stop") : t("lute.play")}
      title={playing ? t("lute.stop") : t("lute.play")}
      className={`bevel px-2 py-0.5 text-sm leading-none transition-transform ${
        playing ? "bg-gold/30 text-foreground" : "bg-card text-card-foreground"
      }`}
    >
      {playing ? "♪♫" : "♪"}
    </button>
  );
}

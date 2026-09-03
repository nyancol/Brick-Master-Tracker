import { useSfx } from "@/hooks/use-sfx";
import { t } from "@/hooks/use-translation";

export default function SfxToggle() {
  const { enabled, toggle } = useSfx();

  return (
    <button
      onClick={toggle}
      aria-label={enabled ? t("sfx.disable") : t("sfx.enable")}
      title={enabled ? t("sfx.disable") : t("sfx.enable")}
      className={`bevel px-2 py-0.5 text-sm leading-none transition-transform ${
        enabled ? "bg-gold/30 text-foreground" : "bg-card text-card-foreground"
      }`}
    >
      ⚔
    </button>
  );
}

import { t } from "@/hooks/use-translation";

export default function ConstructionBadge() {
  return (
    <div className="inline-flex items-center gap-3">
      <img
        src="/gifs/knight-horse.gif"
        alt="Armored knight on horseback"
        width={153}
        height={150}
        style={{ transform: "scaleX(1.03)" }}
        className="w-[64px] h-auto"
      />
      <span className="text-sm italic">{t("footer.construction")}</span>
    </div>
  );
}

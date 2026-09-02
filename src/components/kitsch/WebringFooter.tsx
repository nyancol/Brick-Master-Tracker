import { t } from "@/hooks/use-translation";

export default function WebringFooter() {
  return (
    <div className="inline-flex items-center gap-2 text-sm">
      <span className="font-bold">{t("footer.webringTitle")}</span>
      <span>
        [
        <a href="#" className="footer-link" onClick={(e) => e.preventDefault()}>
          {t("footer.prev")}
        </a>
        {" | "}
        <a href="#" className="footer-link" onClick={(e) => e.preventDefault()}>
          {t("footer.random")}
        </a>
        {" | "}
        <a href="#" className="footer-link" onClick={(e) => e.preventDefault()}>
          {t("footer.next")}
        </a>
        ]
      </span>
    </div>
  );
}

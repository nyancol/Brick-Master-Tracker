import { getLanguage, changeLanguage } from "@/hooks/use-translation";

const LANGS = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
] as const;

export function LanguageToggle({ onLangChange }: { onLangChange: (lang: "en" | "fr") => void }) {
  const current = getLanguage();
  return (
    <div className="flex gap-1">
      {LANGS.map((lang) => {
        const active = current === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => {
              changeLanguage(lang.code);
              onLangChange(lang.code);
            }}
            className={`font-mono text-xs px-3 py-1 bevel transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "bg-card text-card-foreground hover:bg-muted"
            }`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}

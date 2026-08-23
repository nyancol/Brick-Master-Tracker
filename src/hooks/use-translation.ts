import en from "../locales/en";
import fr from "../locales/fr";

const locales = { en, fr };
type Lang = keyof typeof locales;

/** Gets a nested value from the locale object using dot notation. */
function getNested(obj: Record<string, unknown>, path: string): string {
  const value = path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[part];
    return undefined;
  }, obj);
  return typeof value === "string" ? value : path;
}

function getLang(): Lang {
  const stored = localStorage.getItem("lang");
  if (stored === "en" || stored === "fr") return stored;
  return "en";
}

let currentLang: Lang = getLang();

export type TKey = keyof typeof en | "honor.name" | "honor.heldBy" | "honor.transferTo" | "shame.name" | "shame.cursedUpon" | "shame.offloadTo" | "ledger.title" | "ledger.empty" | "notFound.title" | "notFound.description";

export function t(key: string): string {
  return getNested(locales[currentLang] as unknown as Record<string, unknown>, key);
}

export function getLanguage(): Lang {
  return currentLang;
}

export function changeLanguage(lang: Lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);
}
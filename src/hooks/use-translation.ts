import en from "../locales/en";
import fr from "../locales/fr";
import { resolveDefaultLanguage } from "../lib/language";

const locales = { en, fr };
type Lang = keyof typeof locales;

/**
 * Dot-path union of every leaf key in the `en` locale (e.g. "marginalia.age.now").
 * Derived from the source of truth so a renamed/removed key fails typecheck here
 * instead of silently rendering the raw key.
 */
type NestedKeys<T> = T extends string
  ? never
  : {
      [K in keyof T & string]: T[K] extends string
        ? K
        : `${K}.${NestedKeys<T[K]>}`;
    }[keyof T & string];

export type TKey = NestedKeys<typeof en>;

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
  return resolveDefaultLanguage(navigator.language);
}

let currentLang: Lang = getLang();

export function t(key: TKey): string {
  return getNested(locales[currentLang] as unknown as Record<string, unknown>, key);
}

export function getLanguage(): Lang {
  return currentLang;
}

export function changeLanguage(lang: Lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);
}

export type Lang = "en" | "fr";

/** Resolves the default language from a device/browser locale. French is the catch-all fallback. */
export function resolveDefaultLanguage(locale: string | undefined | null): Lang {
  const primary = locale?.trim().split(/[-_]/)[0]?.toLowerCase();
  if (primary === "fr") return "fr";
  if (primary === "en") return "en";
  return "fr";
}

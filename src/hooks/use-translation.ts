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

export type TKey = keyof typeof en | "honor.name" | "honor.heldBy" | "honor.transferTo" | "honor.waitingForTransfer" | "shame.name" | "shame.cursedUpon" | "shame.offloadTo" | "shame.waitingForTransfer" | "chronicles.title" | "chronicles.empty" | "chronicles.chapter" | "chronicles.editedBy" | "chronicles.on" | "chronicles.yearGroup" | "modal.cancel" | "modal.confirm" | "modal.descriptionLabel" | "modal.descriptionRequired" | "modal.uploadPhoto" | "modal.uploading" | "edit.save" | "edit.edit" | "edit.deletePhoto" | "edit.confirmDeletePhoto" | "notFound.title" | "notFound.description" | "logout" | "marginalia.header" | "marginalia.glossCount" | "marginalia.empty" | "marginalia.placeholder" | "marginalia.submit" | "marginalia.tooLong" | "marginalia.huzzah" | "marginalia.huzzahRebuke" | "marginalia.blot" | "marginalia.blotted" | "marginalia.confirmBlot" | "marginalia.chisel" | "marginalia.confirmChisel" | "marginalia.age.now" | "marginalia.age.today" | "marginalia.age.yestereve" | "marginalia.age.past";

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
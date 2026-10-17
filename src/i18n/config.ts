export const locales = ["en", "hi", "bn", "ml"] as const;
export type Locale = (typeof locales)[number];
export const languageNames: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  bn: "বাংলা",
  ml: "മലയാളം",
};
export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
export function localePath(locale: Locale, path: string) {
  if (!path.startsWith("/") || path.startsWith("//") || /^\/(en|hi|bn|ml)(\/|$)/.test(path))
    return path;
  return `/${locale}${path === "/" ? "/" : path}`;
}
export function chooseLocale(header: string): Locale {
  const choices = header
    .split(",")
    .map((part, i) => {
      const [language, quality] = part.trim().split(";");
      const q = quality ? Number(quality.replace(/^q=/, "")) : 1;
      return { language: language.toLowerCase().split("-")[0], q, i };
    })
    .filter((x) => Number.isFinite(x.q) && x.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  return (choices.find((x) => isLocale(x.language))?.language as Locale) ?? "en";
}

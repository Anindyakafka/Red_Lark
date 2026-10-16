"use client";
import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { languageNames, locales, localePath, type Locale } from "./config";
const Context = createContext<{ locale: Locale; strings: Record<string, string> }>({
  locale: "en",
  strings: {},
});
export function LocaleProvider({
  locale,
  strings,
  children,
}: {
  locale: Locale;
  strings: Record<string, string>;
  children: ReactNode;
}) {
  return <Context.Provider value={{ locale, strings }}>{children}</Context.Provider>;
}
export function useI18n() {
  const { locale, strings } = useContext(Context);
  return { locale, t: (key: string) => strings[key] ?? key };
}
export function UiText({ id }: { id: string }) {
  const { t } = useI18n();
  // Keep translated fragments separate from adjacent dynamic numbers and labels.
  return ` ${t(id)} `;
}
export function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const { locale } = useI18n();
  return (
    <NextLink
      {...props}
      prefetch={props.prefetch ?? false}
      href={typeof href === "string" ? localePath(locale, href) : href}
    />
  );
}
export function LanguageSwitcher({ landing = false }: { landing?: boolean }) {
  const path = usePathname();
  const { locale, t } = useI18n();
  const rest = path.replace(/^\/(en|hi|bn|ml)(?=\/|$)/, "") || "/";
  return (
    <nav className={landing ? "language-choice" : "language-switcher"} aria-label="Choose language">
      {landing && <strong>{t("CHOOSE LANGUAGE:")}</strong>}
      {locales.map((l, i) => (
        <NextLink
          key={l}
          href={localePath(l, rest)}
          prefetch={false}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? "page" : undefined}
        >
          {landing && l !== "en" ? `${["English", "Hindi", "Bengali", "Malayalam"][i]} / ` : ""}
          {languageNames[l]}
        </NextLink>
      ))}
    </nav>
  );
}

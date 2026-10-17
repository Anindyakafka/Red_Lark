import en from "../../content/copy/landing.en.json";
import hi from "../../content/copy/landing.hi.json";
import bn from "../../content/copy/landing.bn.json";
import ml from "../../content/copy/landing.ml.json";
import type { Locale } from "@/i18n/config";
export function landingCopy(locale: Locale) {
  return { en, hi, bn, ml }[locale];
}

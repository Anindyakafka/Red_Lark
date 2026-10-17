import en from "../../messages/en.json";
import hi from "../../messages/hi.json";
import bn from "../../messages/bn.json";
import ml from "../../messages/ml.json";
import type { Locale } from "./config";
export function localeMessages(locale: Locale) {
  const messages = { en, hi, bn, ml }[locale];
  // Message keys already provide the English fallback. Send only overrides to
  // the browser rather than repeating hundreds of identical key/value pairs.
  return {
    ...messages,
    strings: Object.fromEntries(
      Object.entries(messages.strings).filter(([key, value]) => key !== value),
    ),
  };
}

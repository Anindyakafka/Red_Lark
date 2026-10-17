import { UiText } from "@/i18n/client";
import { locales, languageNames } from "@/i18n/config";
export const metadata = {
  title: "Choose language",
  description: "Choose English, Hindi, Bengali or Malayalam to enter RED LARK WORKSHOP.",
};
export default function RootPage() {
  return (
    <section className="prose">
      <h1>
        <UiText id={"CHOOSE LANGUAGE"} />
      </h1>
      <p>
        <UiText
          id={"Your language is selected by the website address. No tracking cookie is used."}
        />
      </p>
      {locales.map((l) => (
        <p key={l}>
          <a href={`/${l}/`} lang={l}>
            {languageNames[l]}
          </a>
        </p>
      ))}
    </section>
  );
}

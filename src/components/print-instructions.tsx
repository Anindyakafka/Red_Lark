import en from "../../content/copy/print.en.json";
import hi from "../../content/copy/print.hi.json";
import bn from "../../content/copy/print.bn.json";
import ml from "../../content/copy/print.ml.json";
import type { Locale } from "@/i18n/config";
export function PrintInstructions({ locale }: { locale: Locale }) {
  const copy = { en, hi, bn, ml }[locale];
  return (
    <section className="print-instructions">
      <h2>{copy.title}</h2>
      {!copy.reviewed && (
        <p className="label" lang="en">
          DRAFT TRANSLATION — NEEDS NATIVE REVIEW
        </p>
      )}
      <ol>
        {copy.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}

"use client";
import { Link } from "@/i18n/client";

import { UiText } from "@/i18n/client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="prose">
      <p className="label">
        <UiText id={"SOMETHING DID NOT LOAD"} />
      </p>
      <h1>
        <UiText id={"TRY THAT AGAIN."} />
      </h1>
      <p role="alert">
        <UiText
          id={
            "The page could not be displayed. Your browser-local draft is separate from this page."
          }
        />
      </p>
      <button className="button accent" onClick={reset}>
        <UiText id={"RETRY"} />
      </button>
      <Link className="button" href="/collection/">
        <UiText id={"COLLECTION"} />
      </Link>
    </section>
  );
}

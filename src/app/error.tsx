"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="prose">
      <p className="label">[SOMETHING DID NOT LOAD]</p>
      <h1>TRY THAT AGAIN.</h1>
      <p role="alert">
        The page could not be displayed. Your browser-local draft is separate from this page.
      </p>
      <button className="button accent" onClick={reset}>
        [RETRY]
      </button>
      <a className="button" href="/collection/">
        [COLLECTION]
      </a>
    </section>
  );
}

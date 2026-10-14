import Link from "next/link";
export default function NotFound() {
  return (
    <section className="prose not-found">
      <p className="label">[404 / NOT ON THIS WALL]</p>
      <h1>
        WRONG TURN.
        <br />
        KEEP LOOKING.
      </h1>
      <p>That page isn’t in the archive.</p>
      <form action="/collection/" role="search" className="search-form">
        <label htmlFor="lost-search">SEARCH THE COLLECTION</label>
        <div>
          <input
            id="lost-search"
            name="q"
            type="search"
            placeholder="Try a word, theme or artist"
          />
          <button type="submit">[SEARCH] ↗</button>
        </div>
      </form>
      <div className="hero-ctas">
        <Link className="button accent" href="/collection">
          [COLLECTION] ↗
        </Link>
        <Link className="button" href="/studio" prefetch={false}>
          [OPEN STUDIO] ↗
        </Link>
      </div>
    </section>
  );
}

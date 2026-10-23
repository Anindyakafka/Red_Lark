import { UiText } from "@/i18n/client";
import { Link } from "@/i18n/client";
export default function NotFound() {
  return (
    <section className="prose not-found">
      <p className="label">
        <UiText id={"404 / NOT ON THIS WALL"} />
      </p>
      <h1>
        <UiText id={"WRONG TURN."} />
        <br />
        <UiText id={"KEEP LOOKING."} />
      </h1>
      <p>
        <UiText id={"That page isn’t in the archive."} />
      </p>
      <form action="/collection/" role="search" className="search-form">
        <label htmlFor="lost-search">
          <UiText id={"SEARCH THE COLLECTION"} />
        </label>
        <div>
          <input
            id="lost-search"
            name="q"
            type="search"
            placeholder="Try a word, theme or artist"
          />
          <button type="submit">
            <UiText id={"SEARCH ↗"} />
          </button>
        </div>
      </form>
      <div className="hero-ctas">
        <Link className="button accent" href="/collection">
          <UiText id={"COLLECTION ↗"} />
        </Link>
        <Link className="button" href="/workshop" prefetch={false}>
          <UiText id={"OPEN WORKSHOP ↗"} />
        </Link>
      </div>
    </section>
  );
}

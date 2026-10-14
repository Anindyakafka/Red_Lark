"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { artists, emptyFilters, filterPosters, fileSize, type Filters } from "@/lib/catalog";
import type { Poster } from "@/lib/types";
import { PosterImage } from "./poster-image";

export function Collection({
  posters,
  initialTheme = "",
  heading = "THE COLLECTION",
}: {
  posters: Poster[];
  initialTheme?: string;
  heading?: string;
}) {
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters, theme: initialTheme });
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [storageNotice, setStorageNotice] = useState("");
  useEffect(() => {
    setHydrated(true);
    try {
      const raw = JSON.parse(localStorage.getItem("mirafra.saved.v1") ?? "[]") as unknown;
      if (Array.isArray(raw) && raw.every((s) => typeof s === "string")) setSaved(raw);
    } catch {
      setStorageNotice(
        "Bookmarks are unavailable in this browser. You can still browse and download.",
      );
    }
    const params = new URLSearchParams(location.search);
    setDraft(params.get("q") ?? "");
    setFilters((f) => ({ ...f, query: params.get("q") ?? "" }));
  }, []);
  const results = useMemo(() => filterPosters(posters, filters, saved), [posters, filters, saved]);
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
  }
  function search(e: React.FormEvent) {
    e.preventDefault();
    if (draft.length > 150) {
      setError("[ERROR] Use 150 characters or fewer.");
      document.getElementById("archive-search")?.focus();
      return;
    }
    setError("");
    set("query", draft);
    const url = new URL(location.href);
    if (draft) url.searchParams.set("q", draft);
    else url.searchParams.delete("q");
    history.replaceState(null, "", url);
  }
  function toggle(slug: string) {
    const next = saved.includes(slug) ? saved.filter((s) => s !== slug) : [...saved, slug];
    setSaved(next);
    try {
      localStorage.setItem("mirafra.saved.v1", JSON.stringify(next));
    } catch {
      setStorageNotice("Saved for this visit only: browser storage is unavailable.");
    }
  }
  const facets: {
    key: keyof Filters;
    label: string;
    values: { value: string; label: string }[];
  }[] = [
    {
      key: "format",
      label: "Format",
      values: ["PDF", "PNG", "SVG", "ZIP"].map((v) => ({ value: v, label: v })),
    },
    {
      key: "theme",
      label: "Theme",
      values: [...new Set(posters.flatMap((p) => p.themes))]
        .sort()
        .map((v) => ({ value: v, label: v })),
    },
    {
      key: "movement",
      label: "Movement",
      values: [...new Set(posters.flatMap((p) => p.movements))]
        .sort()
        .map((v) => ({ value: v, label: v })),
    },
    {
      key: "language",
      label: "Language",
      values: [...new Set(posters.flatMap((p) => p.languages))]
        .sort()
        .map((v) => ({ value: v, label: v })),
    },
    {
      key: "artist",
      label: "Artist",
      values: artists.map((a) => ({ value: a.id, label: a.name })),
    },
    {
      key: "license",
      label: "License",
      values: [...new Set(posters.map((p) => p.license))].map((v) => ({ value: v, label: v })),
    },
    {
      key: "color",
      label: "Color",
      values: [
        { value: "bw", label: "Black & white" },
        { value: "color", label: "Color" },
      ],
    },
  ];
  return (
    <section id="collection" className="collection" aria-label="Poster collection">
      <div className="collection-heading">
        <h2>{heading}</h2>
        <a href="/search/image/" className="label">
          IMAGE SEARCH [COMING SOON]
        </a>
      </div>
      <p className="license-note">
        <strong>[PLEASE READ BEFORE USING]</strong> Free to download does not mean free to change.
        Check the licence and credit on every poster. These original placeholders are CC0.
      </p>
      <form onSubmit={search} className="search-form" role="search" noValidate>
        <label htmlFor="archive-search" className="label">
          SEARCH THE ARCHIVE
        </label>
        <div>
          <input
            id="archive-search"
            type="search"
            placeholder="Words, themes, artists, languages…"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError("");
            }}
            aria-invalid={!!error}
            aria-describedby={error ? "search-error" : undefined}
          />
          <button type="submit">[SEARCH] ↗</button>
        </div>
        {error && (
          <p id="search-error" role="alert">
            {error}
          </p>
        )}
      </form>
      <div className="filter-bar">
        <button
          className="filter-all"
          aria-pressed={!Object.entries(filters).some(([k, v]) => k !== "sort" && Boolean(v))}
          onClick={() => {
            setFilters({ ...emptyFilters, theme: initialTheme });
            setDraft("");
            setError("");
          }}
        >
          All [↺]
        </button>
        {facets.map((f) => (
          <label className="facet" key={f.key}>
            <span className="sr-only">{f.label}</span>
            <select
              aria-label={f.label}
              value={String(filters[f.key])}
              onChange={(e) => set(f.key, e.target.value)}
            >
              <option value="">{f.label}</option>
              {f.values.map((v) => (
                <option value={v.value} key={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className="facet">
          <span className="sr-only">Sort</span>
          <select
            aria-label="Sort"
            value={filters.sort}
            onChange={(e) => set("sort", e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="az">A–Z</option>
            <option value="za">Z–A</option>
          </select>
        </label>
        <button aria-pressed={filters.saved} onClick={() => set("saved", !filters.saved)}>
          [{filters.saved ? "SAVED ONLY" : "SAVED"}]
        </button>
        <strong className="result-count" aria-live="polite">
          {results.length} POSTERS
        </strong>
      </div>
      <p className="hydration-status" role="status">
        {hydrated
          ? `${results.length} posters ready. All artwork is placeholder content.`
          : "Loading collection…"}
      </p>
      {storageNotice && (
        <p role="status" className="notice">
          {storageNotice}
        </p>
      )}
      {results.length ? (
        <div className="poster-grid">
          {results.map((p, i) => (
            <article className="poster-card" key={p.slug}>
              <Link className="poster-preview" href={`/poster/${p.slug}`} prefetch={false}>
                <PosterImage poster={p} priority={i < 4} />
                <span className="poster-number">[{String(i + 1).padStart(2, "0")}]</span>
              </Link>
              <div className="card-details">
                <div className="card-title-row">
                  <h3>
                    <Link href={`/poster/${p.slug}`} prefetch={false}>
                      {p.titleOriginal ?? p.title}
                    </Link>
                  </h3>
                  <button
                    className="save-button"
                    aria-label={`${saved.includes(p.slug) ? "Unsave" : "Save"} ${p.title}`}
                    aria-pressed={saved.includes(p.slug)}
                    onClick={() => toggle(p.slug)}
                  >
                    {saved.includes(p.slug) ? "[−]" : "[+]"}
                  </button>
                </div>
                {p.titleOriginal && <p className="translated-title">{p.title}</p>}
                <Link href={`/artist/${p.artist}`} className="artist-credit">
                  {artists.find((a) => a.id === p.artist)?.name}
                </Link>
                <div className="card-tags">
                  <span>{p.region}</span>
                  <span>{p.languages.join(" / ")}</span>
                </div>
                <p className="card-meta">
                  {p.formats[0].format} · {fileSize(p.formats[0].bytes)} · {p.license}
                </p>
                <span className="placeholder-label">[PLACEHOLDER]</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>NO MATCH. KEEP LOOKING.</h3>
          <p>Try a different word or clear the filters.</p>
          <button
            onClick={() => {
              setFilters(emptyFilters);
              setDraft("");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      <noscript>
        <p>
          Search and filters need JavaScript. The archive and download pages are still available.
        </p>
      </noscript>
    </section>
  );
}

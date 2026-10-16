"use client";
import { UiText } from "@/i18n/client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/client";
import { artists, emptyFilters, filterPosters, fileSize, type Filters } from "@/lib/query";
import type { Poster } from "@/lib/types";
import { PosterImage } from "./poster-image";
import { migrateLocalDrafts } from "@/lib/storage";
import categories from "../../content/categories.json";
import formats from "../../content/formats.json";

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
      migrateLocalDrafts(localStorage);
      const raw = JSON.parse(localStorage.getItem("redlark.saved.v1") ?? "[]") as unknown;
      if (Array.isArray(raw) && raw.length > 0 && raw.every((s) => typeof s === "string"))
        setSaved(raw);
    } catch {
      setStorageNotice(
        "Bookmarks are unavailable in this browser. You can still browse and download.",
      );
    }
    const params = new URLSearchParams(location.search);
    setDraft(params.get("q") ?? "");
    setFilters((current) => {
      const next = { ...current, query: params.get("q") ?? "" };
      for (const key of [
        "category",
        "kind",
        "language",
        "artist",
        "license",
        "color",
        "sort",
      ] as const)
        if (params.has(key)) next[key] = params.get(key) ?? "";
      return next;
    });
  }, []);
  const results = useMemo(() => filterPosters(posters, filters, saved), [posters, filters, saved]);
  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
    const url = new URL(location.href);
    const parameter = key === "query" ? "q" : key;
    if (value && value !== emptyFilters[key]) url.searchParams.set(parameter, String(value));
    else url.searchParams.delete(parameter);
    history.replaceState(null, "", url);
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
      localStorage.setItem("redlark.saved.v1", JSON.stringify(next));
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
      key: "kind",
      label: "Format",
      values: formats.map((f) => ({ value: f.slug, label: f.label })),
    },
    {
      key: "category",
      label: "Category",
      values: categories.map((c) => ({ value: c.slug, label: c.label })),
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
      label: "Licence",
      values: [...new Set(posters.map((p) => p.license))].map((v) => ({ value: v, label: v })),
    },
    {
      key: "color",
      label: "Colour",
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
        <Link href="/search/image/" className="label">
          <UiText id={"IMAGE SEARCH [COMING SOON]"} />
        </Link>
      </div>
      <p className="license-note">
        <strong>
          <UiText id={"[PLEASE READ BEFORE USING]"} />
        </strong>
        <UiText
          id={
            "Free to download does not mean free to change. Check the licence and credit on every poster. Original placeholders are CC0; contributions keep their own licences."
          }
        />
      </p>
      <form onSubmit={search} className="search-form" role="search" noValidate>
        <label htmlFor="archive-search" className="label">
          <UiText id={"SEARCH THE ARCHIVE"} />
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
          <button type="submit">
            <UiText id={"[SEARCH] ↗"} />
          </button>
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
            const url = new URL(location.href);
            for (const key of [
              "q",
              "category",
              "kind",
              "language",
              "artist",
              "license",
              "color",
              "sort",
              "saved",
            ])
              url.searchParams.delete(key);
            history.replaceState(null, "", url);
          }}
        >
          <UiText id={"ALL (Uncategorized)"} />
        </button>
        {facets.map((f) => (
          <label className="facet" key={f.key}>
            <span className="sr-only">
              <UiText id={f.label} />
            </span>
            <select
              aria-label={f.label}
              value={String(filters[f.key])}
              onChange={(e) => set(f.key, e.target.value)}
            >
              <option value="">
                <UiText id={f.label} />
              </option>
              {f.values.map((v) => (
                <option value={v.value} key={v.value}>
                  <UiText id={v.label} />
                </option>
              ))}
            </select>
          </label>
        ))}
        <label className="facet">
          <span className="sr-only">
            <UiText id={"Sort"} />
          </span>
          <select
            aria-label="Sort"
            value={filters.sort}
            onChange={(e) => set("sort", e.target.value)}
          >
            <option value="newest">
              <UiText id={"Newest"} />
            </option>
            <option value="oldest">
              <UiText id={"Oldest"} />
            </option>
            <option value="az">
              <UiText id={"A–Z"} />
            </option>
            <option value="za">
              <UiText id={"Z–A"} />
            </option>
          </select>
        </label>
        <button aria-pressed={filters.saved} onClick={() => set("saved", !filters.saved)}>
          [{filters.saved ? "SAVED ONLY" : "SAVED"}]
        </button>
        <strong className="result-count" aria-live="polite">
          {results.length}
          <UiText id={"POSTERS"} />
        </strong>
      </div>
      <p className="hydration-status" role="status">
        {saved.length > 0 && (
          <button
            className="clear-bookmarks"
            onClick={() => {
              setSaved([]);
              try {
                localStorage.removeItem("redlark.saved.v1");
                setStorageNotice("All local bookmarks cleared.");
              } catch {
                setStorageNotice(
                  "Bookmarks cleared for this visit; browser storage is unavailable.",
                );
              }
            }}
          >
            <UiText id={"[CLEAR"} />
            {saved.length}
            <UiText id={"LOCAL BOOKMARKS]"} />
          </button>
        )}
        {hydrated
          ? `${results.length} posters ready. Check each licence before reuse.`
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
                {p.placeholder && (
                  <span className="placeholder-label">
                    <UiText id={"[PLACEHOLDER]"} />
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>
            <UiText id={"NO MATCH. KEEP LOOKING."} />
          </h3>
          <p>
            <UiText id={"Try a different word or clear the filters."} />
          </p>
          <button
            onClick={() => {
              setFilters(emptyFilters);
              setDraft("");
            }}
          >
            <UiText id={"Clear filters"} />
          </button>
        </div>
      )}
      <noscript>
        <p>
          <UiText
            id={
              "Search and filters need JavaScript. The archive and download pages are still available."
            }
          />
        </p>
      </noscript>
    </section>
  );
}

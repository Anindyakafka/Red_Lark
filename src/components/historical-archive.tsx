"use client";

import { useMemo, useState } from "react";
import formats from "../../content/formats.json";
import { artists } from "@/lib/catalog";
import type { Poster } from "@/lib/types";
import { Link, UiText } from "@/i18n/client";
import { PosterImage } from "./poster-image";

const pageSize = 24;
export function HistoricalArchive({ posters }: { posters: Poster[] }) {
  const [type, setType] = useState("");
  const [language, setLanguage] = useState("");
  const [year, setYear] = useState("");
  const [licence, setLicence] = useState("");
  const [status, setStatus] = useState("");
  const [view, setView] = useState<"timeline" | "grid">("timeline");
  const [shown, setShown] = useState(pageSize);
  const values = useMemo(
    () =>
      posters
        .filter(
          (poster) =>
            (!type || poster.kind === type) &&
            (!language || poster.languages.includes(language)) &&
            (!year || String(poster.year) === year) &&
            (!licence || poster.license === licence) &&
            (!status || (poster.archiveStatus || "usable") === status),
        )
        .sort((a, b) =>
          (b.createdAt || String(b.year)).localeCompare(a.createdAt || String(a.year)),
        ),
    [licence, language, posters, status, type, year],
  );
  const filters = [
    ["Type", type, setType, formats.map((f) => [f.slug, f.label])],
    [
      "Language",
      language,
      setLanguage,
      [...new Set(posters.flatMap((p) => p.languages))].sort().map((v) => [v, v]),
    ],
    [
      "Year",
      year,
      setYear,
      [...new Set(posters.map((p) => String(p.year)))]
        .sort()
        .reverse()
        .map((v) => [v, v]),
    ],
    [
      "Licence",
      licence,
      setLicence,
      [...new Set(posters.map((p) => p.license))].map((v) => [v, v]),
    ],
    [
      "Status",
      status,
      setStatus,
      [
        ["usable", "Usable"],
        ["archive-only", "Archive only"],
      ],
    ],
  ] as const;
  const visible = values.slice(0, shown);
  const years = new Map<number, Poster[]>();
  for (const poster of visible) years.set(poster.year, [...(years.get(poster.year) || []), poster]);
  return (
    <section className="collection historical-archive" aria-label="Historical archive">
      <div className="filter-bar">
        {filters.map(([label, value, change, options]) => (
          <label className="facet" key={label}>
            <span className="sr-only">
              <UiText id={label} />
            </span>
            <select
              aria-label={label}
              value={value}
              onChange={(event) => {
                change(event.target.value);
                setShown(pageSize);
              }}
            >
              <option value="">
                <UiText id={label} />
              </option>
              {options.map(([value, label]) => (
                <option value={value} key={value}>
                  <UiText id={label} />
                </option>
              ))}
            </select>
          </label>
        ))}
        <button aria-pressed={view === "timeline"} onClick={() => setView("timeline")}>
          <UiText id="Timeline" />
        </button>
        <button aria-pressed={view === "grid"} onClick={() => setView("grid")}>
          <UiText id="Grid" />
        </button>
        <strong className="result-count" aria-live="polite">
          {values.length} <UiText id="WORKS" />
        </strong>
      </div>
      {view === "grid" ? (
        <div className="poster-grid">
          {visible.map((poster) => (
            <ArchiveCard poster={poster} key={poster.slug} />
          ))}
        </div>
      ) : (
        [...years].map(([currentYear, works]) => (
          <section
            className="archive-year"
            key={currentYear}
            aria-labelledby={`year-${currentYear}`}
          >
            <h2 id={`year-${currentYear}`}>{currentYear}</h2>
            <div className="poster-grid">
              {works.map((poster) => (
                <ArchiveCard poster={poster} key={poster.slug} />
              ))}
            </div>
          </section>
        ))
      )}
      {!values.length && (
        <p className="empty-state">
          <UiText id="No archived works match these filters." />
        </p>
      )}
      {shown < values.length && (
        <button className="button" onClick={() => setShown((count) => count + pageSize)}>
          <UiText id="Load more" />
        </button>
      )}
    </section>
  );
}
function ArchiveCard({ poster }: { poster: Poster }) {
  const artist =
    artists.find((person) => person.id === poster.artist)?.name || "Anonymous contributor";
  const archiveOnly = (poster.archiveStatus || "usable") === "archive-only";
  const preview = <PosterImage poster={poster} />;
  return (
    <article className="poster-card archive-card">
      {archiveOnly ? (
        <div className="poster-preview" aria-label={poster.alt}>
          {preview}
        </div>
      ) : (
        <Link className="poster-preview" href={`/poster/${poster.slug}`} prefetch={false}>
          {preview}
        </Link>
      )}
      <div className="card-details">
        <h3>
          {archiveOnly ? poster.title : <Link href={`/poster/${poster.slug}`}>{poster.title}</Link>}
        </h3>
        <p>{artist}</p>
        <p className="card-meta">
          {poster.year} · {poster.kind} · {poster.license}
        </p>
        <p>
          {poster.languages.join(" / ")} ·{" "}
          <strong>{archiveOnly ? "Archive only" : "Usable"}</strong>
        </p>
      </div>
    </article>
  );
}

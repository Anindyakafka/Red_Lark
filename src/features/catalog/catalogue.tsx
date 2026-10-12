"use client";

import { useState } from "react";
import Link from "next/link";
import { artworks } from "@/content/catalog";
import { filterArtworks } from "./query";
import type { AssetKind } from "./types";

export function Catalogue({ kind, home = false }: { kind: AssetKind; home?: boolean }) {
  const [query, setQuery] = useState("");
  const [collection, setCollection] = useState("All");
  const collections = ["All", ...new Set(artworks.filter(a => a.kind === kind).map(a => a.collection))];
  const results = filterArtworks(artworks, kind, query, collection);
  return <section className="catalogue section" id="collection"><div className="section-heading"><div><p className="eyebrow">{home ? "The open archive" : "The collection"}</p><h2>{kind === "poster" ? "Posters for the people." : "Small format. Same spirit."}</h2></div><p className="muted">{kind === "poster" ? "Find your next wall." : "A little art, wherever you go."}</p></div>
    <div className="catalogue-toolbar"><div className="filter-tabs" aria-label="Collections">{collections.map(c => <button key={c} aria-pressed={c === collection} onClick={() => setCollection(c)} className={c === collection ? "active" : ""}>{c}</button>)}</div><label className="search"><span aria-hidden="true">⌕</span><span className="sr-only">Search {kind}s</span><input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${kind}s…`} /></label></div>
    <div className="results-meta"><span aria-live="polite">{results.length} {kind}{results.length === 1 ? "" : "s"}</span><span>Layout studies · SVG downloads</span></div>
    {results.length ? <div className="art-grid">{results.map((art, index) => <article className="art-card" key={art.id}><Link href={`/${kind}s/${art.slug}`} className={`art-preview ${kind}`} style={{ background: art.background }}><img src={art.previewUrl} alt={art.title} loading="lazy" /><span className="preview-corner" aria-hidden="true">↗</span></Link><div className="card-meta"><span>{String(index + 1).padStart(2, "0")} / {art.collection}</span><span>DEMO</span></div><div className="card-title"><h3><Link href={`/${kind}s/${art.slug}`}>{art.title}</Link></h3><a href={art.downloadUrl} download={`${art.slug}.svg`} aria-label={`Download ${art.title} SVG`}>↓</a></div></article>)}</div> : <div className="empty-state"><h3>No artwork found.</h3><p>Try another word or collection.</p><button className="button" onClick={() => { setQuery(""); setCollection("All"); }}>Clear filters</button></div>}
    <p className="catalogue-note">These are sample designs for the prototype. The first published collection is coming with your content.</p>
  </section>;
}

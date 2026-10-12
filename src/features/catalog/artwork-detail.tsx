import Link from "next/link";
import type { Artwork } from "./types";

export function ArtworkDetail({ art }: { art: Artwork }) {
  return <section className="detail section"><div className={`detail-preview ${art.kind}`} style={{ background: art.background }}><img src={art.previewUrl} alt={art.title} /></div><div className="detail-copy"><Link className="text-link" href={`/${art.kind}s`}>← All {art.kind}s</Link><p className="eyebrow">{art.collection} / Sample design</p><h1>{art.title}</h1><p>{art.description}</p><dl><div><dt>Format</dt><dd>Scalable vector (SVG)</dd></div><div><dt>Edition</dt><dd>Prototype layout study</dd></div><div><dt>Artwork licence</dt><dd>{art.license}</dd></div></dl><a className="button dark" href={art.downloadUrl} download={`${art.slug}.svg`}>Download SVG ↓</a><Link className="button" href="/studio">Create in the studio ↗</Link><p className="small-note">Sample downloads are RGB SVGs using system fonts. For professional printing, outline or embed fonts and obtain a printer-approved PDF. <Link href="/print-guide">Read the print guide.</Link></p></div></section>;
}

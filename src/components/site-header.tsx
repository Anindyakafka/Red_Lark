import Link from "next/link";

export function SiteHeader() {
  return <header className="site-header">
    <Link href="/" className="brand" aria-label="Mirafra home"><img src="/brand/mirafra-mark.svg" alt="" width="58" height="42" /><span><img src="/brand/mirafra-wordmark.svg" alt="MIRAFRA" width="142" height="23" /><span className="brand-caption">An open print archive</span></span></Link>
    <nav aria-label="Main navigation"><Link href="/posters">Posters</Link><Link href="/stickers">Stickers</Link><Link href="/about">About</Link><Link href="/studio" className="nav-studio">Open the studio <span aria-hidden="true">↗</span></Link></nav>
  </header>;
}

import Link from "next/link";

export function SiteFooter() {
  return <footer className="site-footer"><div><strong>MIRAFRA</strong><p>From a small screen to a public wall.</p></div><div><Link href="/print-guide">A note on printing ↗</Link><p>Archive in progress · Prototype 0.1</p></div></footer>;
}

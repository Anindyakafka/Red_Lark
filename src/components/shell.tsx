import Link from "next/link";
import Image from "next/image";
import { Preferences } from "./preferences";
export function Header() {
  return (
    <header className="site-header">
      <div className="masthead">
        <Link prefetch={false} className="wordmark" href="/" aria-label="Mirafra home">
          <Image src="/icons/mark.svg" alt="" width={32} height={32} />
          MIRAFRA<span className="edition">[FREE PRINT ARCHIVE]</span>
        </Link>
        <Preferences />
      </div>
      <nav aria-label="Main navigation">
        {[
          ["Collection", "/collection"],
          ["Discover", "/discover"],
          ["Artists", "/artists"],
          ["Studio", "/studio"],
          ["Community", "/community"],
          ["About", "/about"],
        ].map(([name, href]) => (
          <Link key={href} href={href} prefetch={false}>
            {name}
          </Link>
        ))}
      </nav>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <Link className="footer-mark" href="/">
          MIRAFRA [01]
        </Link>
        <p>FREE TO FIND. YOURS TO PRINT.</p>
        <p>
          Original placeholder studies, 2026.
          <br />
          Real artist contributions are still to come.
        </p>
      </div>
      <nav aria-label="Footer navigation">
        <Link prefetch={false} href="/submit">
          Submit a poster
        </Link>
        <Link prefetch={false} href="/contact">
          Contact / takedown
        </Link>
        <Link prefetch={false} href="/privacy">
          How we handle data
        </Link>
        <Link prefetch={false} href="/terms">
          Terms & licences
        </Link>
        <Link prefetch={false} href="/themes">
          Themes & movements
        </Link>
        <Link prefetch={false} href="/about">
          About / support artists
        </Link>
      </nav>
      <p className="footer-credit">
        An open archive built for public walls.
        <br />
        Software:{" "}
        <a href="https://github.com/Anindyakafka/mirafra" rel="noreferrer">
          AGPL source ↗
        </a>{" "}
        · Artwork: see each licence.
      </p>
    </footer>
  );
}

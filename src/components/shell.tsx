import { Link, UiText, LanguageSwitcher } from "@/i18n/client";
import Image from "next/image";
import { Preferences } from "./preferences";
import { REPO_URL } from "@/config/site";
export function Header() {
  return (
    <header className="site-header">
      <div className="masthead">
        <Link prefetch={false} className="wordmark" href="/" aria-label="Red Lark Workshop home">
          <Image src="/icons/mark.svg" alt="" width={32} height={32} />
          <UiText id={"RED LARK WORKSHOP"} />
          <span className="edition">
            <UiText id={"[FREE PRINT ARCHIVE]"} />
          </span>
        </Link>
        <div className="header-controls">
          <Link className="account-link" href="/account">
            <UiText id="Account" />
          </Link>
          <LanguageSwitcher />
          <Preferences />
        </div>
      </div>
      <nav aria-label="Main navigation">
        {[
          ["Collection", "/collection"],
          ["Categories", "/categories"],
          ["Artists", "/artists"],
          ["Studio", "/studio"],
          ["Community", "/community"],
          ["Blog", "/blog"],
          ["About", "/about"],
        ].map(([name, href]) => (
          <Link key={href} href={href} prefetch={false}>
            <UiText id={name} />
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
          <UiText id={"RED LARK WORKSHOP [01]"} />
        </Link>
        <p>
          <UiText id={"FREE TO FIND. YOURS TO PRINT."} />
        </p>
        <p>
          <UiText id={"Original placeholder studies, 2026."} />
          <br />
          <UiText id={"Real artist contributions are still to come."} />
        </p>
      </div>
      <nav aria-label="Footer navigation">
        <Link prefetch={false} href="/submit">
          <UiText id={"Submit a poster"} />
        </Link>
        <Link prefetch={false} href="/contact">
          <UiText id={"Contact / takedown"} />
        </Link>
        <Link prefetch={false} href="/privacy">
          <UiText id={"How we handle data"} />
        </Link>
        <Link prefetch={false} href="/terms">
          <UiText id={"Terms & licences"} />
        </Link>
        <Link href="/policies">
          <UiText id="Policies & guidelines" />
        </Link>
        <Link prefetch={false} href="/categories">
          <UiText id={"Categories"} />
        </Link>
        <Link prefetch={false} href="/about">
          <UiText id={"About / support artists"} />
        </Link>
      </nav>
      <p className="footer-credit">
        <UiText id={"An open archive built for public walls."} />
        <br />
        <UiText id={"Software:"} />{" "}
        <a href={REPO_URL} rel="noreferrer">
          <UiText id={"AGPL source ↗"} />
        </a>{" "}
        <UiText id={"· Artwork: see each licence."} />
      </p>
    </footer>
  );
}

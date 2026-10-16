"use client";
import { UiText } from "@/i18n/client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/client";
import { track } from "@/lib/analytics";
export function Preferences() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      setDark(media.matches);
      document.documentElement.dataset.theme = media.matches ? "dark" : "light";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return (
    <button
      className="theme-toggle"
      aria-pressed={dark}
      onClick={() => {
        setDark(!dark);
        document.documentElement.dataset.theme = dark ? "light" : "dark";
      }}
    >
      {" "}
      [{dark ? "LIGHT" : "DARK"}]{" "}
    </button>
  );
}
export function BrowseCTA() {
  const path = usePathname().replace(/^\/(en|hi|bn|ml)(?=\/|$)/, "") || "/";
  useEffect(() => {
    track("pageview");
    const onFocus = (event: FocusEvent) => {
      const target = event.target;
      const bar = document.querySelector<HTMLElement>(".mobile-cta, .studio-mobile-toolbar");
      if (
        !(target instanceof HTMLElement) ||
        !bar ||
        getComputedStyle(bar).display === "none" ||
        bar.contains(target)
      )
        return;
      const overlap = target.getBoundingClientRect().bottom - bar.getBoundingClientRect().top + 12;
      if (overlap > 0) window.scrollBy({ top: overlap, behavior: "instant" });
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, [path]);
  const browse =
    path === "/" ||
    [
      "/collection",
      "/categories",
      "/category/",
      "/discover",
      "/poster/",
      "/artists",
      "/artist/",
      "/themes",
      "/theme/",
      "/community",
    ].some((p) => path.startsWith(p));
  return browse ? (
    <div className="mobile-cta">
      <Link href="/studio" prefetch={false}>
        <UiText id={"[OPEN STUDIO] ↗"} />
      </Link>
    </div>
  ) : null;
}

"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
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
  const path = usePathname();
  useEffect(() => {
    track("pageview");
  }, [path]);
  const browse =
    path === "/" ||
    [
      "/collection",
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
        [OPEN STUDIO] ↗
      </Link>
    </div>
  ) : null;
}

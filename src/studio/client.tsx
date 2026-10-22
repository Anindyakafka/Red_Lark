"use client";
import { UiText } from "@/i18n/client";
import { useEffect, useState } from "react";
import formats from "../../content/formats.json";
import dynamic from "next/dynamic";
const Studio = dynamic(() => import("./studio"), {
  ssr: false,
  loading: () => (
    <div className="studio-loading" role="status">
      <h2>
        <UiText id={"LOADING STUDIO"} />
      </h2>
      <p>
        <UiText id={"Preparing local fonts and tools. No designs are uploaded."} />
      </p>
      <div className="skeleton-card" aria-hidden="true" />
    </div>
  ),
});
export function StudioClient() {
  const [format, setFormat] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const selected = params.get("format");
    if (params.has("remix") || location.hash.startsWith("#design=")) setFormat("poster-placard");
    else if (formats.some((format) => format.slug === selected)) setFormat(selected);
    setChecked(true);
  }, []);
  if (!checked)
    return (
      <p className="studio-loading" role="status">
        <UiText id="Checking local Studio options…" />
      </p>
    );
  if (!format)
    return (
      <section className="studio-format-picker">
        <h2>
          <UiText id="Choose format" />
        </h2>
        <p>
          <UiText id="CREATE YOUR OWN CAMPAIGN MATERIAL" />
        </p>
        <div className="format-grid">
          {formats.map((format) => (
            <button
              key={format.slug}
              onClick={() => {
                setFormat(format.slug);
                const url = new URL(location.href);
                url.searchParams.set("format", format.slug);
                history.replaceState(null, "", url);
              }}
            >
              {format.label}
            </button>
          ))}
        </div>
        <p>
          <UiText id="All formats use the same private editor. Choose paper or social dimensions inside the Studio." />
        </p>
        <p>
          <UiText id="(Featured tools: Rotate and adjust size and colour of text and image.)" />
        </p>
      </section>
    );
  return (
    <Studio
      format={format}
      onFormatChange={(value: string) => {
        setFormat(value);
        const url = new URL(location.href);
        url.searchParams.set("format", value);
        history.replaceState(null, "", url);
      }}
    />
  );
}

"use client";
import { useEffect, useState } from "react";
import { UiText } from "@/i18n/client";
export function ContactAddress({ email }: { email: string }) {
  const [href, setHref] = useState<string>();
  const clean = email.trim();
  useEffect(() => {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) setHref(["mailto", clean].join(":"));
  }, [clean]);
  if (!clean)
    return (
      <p className="contact-placeholder">
        <strong>
          <UiText id="CONTACT ADDRESS NOT SET" />
        </strong>
      </p>
    );
  const readable = clean.replace("@", " at ").replaceAll(".", " dot ");
  return (
    <p>
      <span className="sr-only">
        <UiText id="Contact email:" />{" "}
      </span>
      {href ? <a href={href}>{clean}</a> : <span>{readable}</span>}
    </p>
  );
}

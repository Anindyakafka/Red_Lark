"use client";
import { useState } from "react";
import { UiText } from "@/i18n/client";
export function PublicUpi({ value, name }: { value: string; name: string }) {
  const [status, setStatus] = useState("");
  return (
    <div className="public-upi">
      <code>{value}</code>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setStatus("Copied UPI ID.");
          } catch {
            setStatus("Copy unavailable. Select and copy the displayed ID.");
          }
        }}
      >
        <UiText id="Copy UPI ID" />
      </button>
      <a
        className="underlined"
        href={`upi://pay?pa=${encodeURIComponent(value)}&pn=${encodeURIComponent(name)}`}
      >
        <UiText id="Contribute" /> ↗
      </a>
      <p role="status">
        <UiText id={status} />
      </p>
    </div>
  );
}

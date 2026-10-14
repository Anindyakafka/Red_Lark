"use client";
import dynamic from "next/dynamic";
const Studio = dynamic(() => import("./studio"), {
  ssr: false,
  loading: () => (
    <div className="studio-loading" role="status">
      <h2>[LOADING STUDIO]</h2>
      <p>Preparing local fonts and tools. No designs are uploaded.</p>
      <div className="skeleton-card" aria-hidden="true" />
    </div>
  ),
});
export function StudioClient() {
  return <Studio />;
}

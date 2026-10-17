import { UiText } from "@/i18n/client";
export default function Loading() {
  return (
    <section className="content-width" aria-busy="true">
      <p role="status" className="label">
        <UiText id={"Loading collection…"} />
      </p>
      <div className="skeleton-grid" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <div className="skeleton-card" key={i} />
        ))}
      </div>
    </section>
  );
}
